/*
ActiveRelic.ts の責務:
- 起動型レリックの共通処理（使用回数管理・マナコスト支払い・起動可否判定・状態保存/復元）を提供する。
- 個別レリックが Action を生成するためのフックを定義し、起動時のドメイン効果実行を標準化する。

非責務:
- UI 表示やアニメーション指示の生成（Battle/OperationRunner が担当）。
- レリック固有の効果内容（各派生クラスの Action が定義する）。

主な通信相手とインターフェース:
- `Battle` / `Player`: `perform` 内でマナ支払いと Action 実行を行う。
- `Action`: `createAction` で生成し、入力 Operation 済みのコンテキストで `execute` を呼び出す。
*/
import type { Battle } from '@/domain/battle/Battle'
import type { CardOperation } from '../operations'
import type { Player } from '../Player'
import type { Action, ActionAudioCue, ActionCutInCue } from '../Action'
import { Relic } from './Relic'
import type { RelicId } from './relicTypes'

export interface ActiveRelicContext {
  battle: Battle
  player: Player
}

export interface ActiveRelicProps {
  id: RelicId
  name: string
  icon: string
  manaCost?: number | null
  usageLimitPerBattle?: number | null
}

export abstract class ActiveRelic extends Relic {
  readonly usageType = 'active' as const
  readonly id: RelicId
  readonly name: string
  readonly icon: string
  readonly manaCost: number | null
  readonly usageLimitPerBattle: number | null
  private usesConsumed = 0

  protected constructor(props: ActiveRelicProps) {
    super()
    this.id = props.id
    this.name = props.name
    this.icon = props.icon
    this.manaCost = props.manaCost ?? 0
    this.usageLimitPerBattle = props.usageLimitPerBattle ?? 1
  }

  /**
   * 残り使用回数を返す。null は無制限。
   */
  getUsesRemaining(): number | null {
    if (this.usageLimitPerBattle === null) {
      return null
    }
    return Math.max(0, this.usageLimitPerBattle - this.usesConsumed)
  }

  /**
   * バトル状況を踏まえて起動可能か判定する。
   * - 使用上限・マナコストのみを共通チェックし、ターンなどの外部条件は Battle 側で評価する。
   */
  canActivate(context: ActiveRelicContext): boolean {
    if (this.usageLimitPerBattle !== null && this.usesConsumed >= this.usageLimitPerBattle) {
      return false
    }
    const cost = this.manaCost ?? 0
    if (cost > 0 && cost > context.player.currentMana) {
      return false
    }
    if (context.battle.status !== 'in-progress') {
      return false
    }
    return true
  }

  /**
   * 実際の効果実行。外部からはこのメソッドだけを呼び出す。
   */
  perform(context: ActiveRelicContext, operations: CardOperation[] = []): void {
    if (!this.canActivate(context)) {
      throw new Error('Relic cannot be activated in current context')
    }

    // 先にマナ支払いを行い、例外が出た場合は効果を実行しない。
    const cost = this.manaCost ?? 0
    if (cost > 0) {
      context.player.spendMana(cost, { battle: context.battle })
    }

    const action = this.createAction(context)
    const actionContext = action.prepareContext({
      battle: context.battle,
      source: context.player,
      operations,
    })
    actionContext.metadata = {
      ...(actionContext.metadata ?? {}),
      relicId: this.id,
      relicName: this.name,
    }

    action.execute(actionContext)
    // レリック起動時の演出情報も Battle に預け、OperationRunner が play-relic バッチで再生できるようにする
    context.battle.recordPlayRelicAnimationContext({
      relicId: this.id,
      audio: extractAudioCue(actionContext.metadata),
      cutin: extractCutInCue(actionContext.metadata),
    })
    if (this.usageLimitPerBattle !== null) {
      this.usesConsumed += 1
    }
  }

  override isActive(context?: { battle?: Battle; player?: Player }): boolean {
    if (!context?.battle || !context?.player) {
      return false
    }
    return this.canActivate({ battle: context.battle, player: context.player })
  }

  override saveState(): unknown {
    return { usesConsumed: this.usesConsumed }
  }

  override restoreState(state: unknown): void {
    if (state && typeof state === 'object' && 'usesConsumed' in state) {
      const raw = (state as { usesConsumed?: unknown }).usesConsumed
      const parsed = typeof raw === 'number' ? raw : Number(raw ?? 0)
      this.usesConsumed = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
    } else {
      this.usesConsumed = 0
    }
  }

  /**
   * 派生クラスが実際に実行する Action を生成するフック。
   */
  protected abstract createAction(context: ActiveRelicContext): Action
}

function extractCutInCue(metadata: unknown): ActionCutInCue | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }
  const candidate = (metadata as { cutin?: ActionCutInCue | undefined }).cutin
  if (!candidate || typeof candidate.src !== 'string' || candidate.src.length === 0) {
    return undefined
  }
  return {
    src: candidate.src,
    waitMs: typeof candidate.waitMs === 'number' ? candidate.waitMs : undefined,
    durationMs: typeof candidate.durationMs === 'number' ? candidate.durationMs : undefined,
  }
}

function extractAudioCue(metadata: unknown): ActionAudioCue | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }
  const candidate = (metadata as { audio?: ActionAudioCue | undefined }).audio
  if (!candidate || typeof candidate.soundId !== 'string' || candidate.soundId.length === 0) {
    return undefined
  }
  return {
    soundId: candidate.soundId,
    waitMs: typeof candidate.waitMs === 'number' ? candidate.waitMs : undefined,
    durationMs: typeof candidate.durationMs === 'number' ? candidate.durationMs : undefined,
  }
}
