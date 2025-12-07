/*
ActionBase.ts の責務:
- 戦闘アクション共通のインターフェースを定義し、操作要求やターゲット解決、付与ステート処理など基礎的な振る舞いを提供する。
- カード定義の組み立てやコンテキスト準備を担い、派生クラスがドメイン固有の処理に集中できる土台を整える。

責務ではないこと:
- 実際のダメージ計算や攻撃特有の演出など、派生クラスに依存する振る舞いの詳細実装。
- 戦闘ログ記録やバトル進行管理など、バトル全体のオーケストレーション。

主要な通信相手とインターフェース:
- operations.ts の `Operation` / `CardOperation`: `prepareContext` 内で要求入力を検証し、`Operation.complete`・`toMetadata` を通じて追加情報を収集する。
- `typeGuards.ts` の `isPlayerEntity`: 付与ステートの適用先がプレイヤーか敵かを判定し、`Player` 特有の挙動（カード化）を有効化する。
- `CardDefinition`: `createCardDefinition` がベース定義と操作一覧を統合し、ビュー層が表示するデータ構造を生成する。似た概念である `Card` とは異なり、実インスタンスではなく表示用メタ情報のみを扱う。
*/
import type { Battle } from '../../battle/Battle'
import type { CardDefinition } from '../CardDefinition'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import type { State } from '../State'
import type { CardTag } from '../CardTag'
import {
  TargetEnemyOperation,
  SelectHandCardOperation,
  type CardOperation,
  type Operation,
  type OperationContext,
  type TargetEnemyAvailabilityEntry,
  type HandCardSelectionAvailabilityEntry,
} from '../operations'

export type ActionType = 'attack' | 'skill' | 'skip'

export interface ActionContext {
  battle: Battle
  source: Player | Enemy
  target?: Player | Enemy
  metadata?: Record<string, unknown>
  operations?: Operation[]
}

export interface ActionAudioCue {
  soundId: string
  waitMs?: number
  durationMs?: number
}

export interface ActionCutInCue {
  src: string
  waitMs?: number
  durationMs?: number
}

export interface BaseActionProps {
  name: string
  cardDefinition: CardDefinition
  gainStates?: Array<() => State>
  audioCue?: ActionAudioCue
  cutInCue?: ActionCutInCue
}

export interface ActionCostContext {
  battle?: Battle
  source?: Player | Enemy
  cardTags?: CardTag[]
}

export abstract class Action {
  protected readonly props: BaseActionProps
  private readonly gainStateFactories: Array<() => State>
  private readonly audioCue?: ActionAudioCue
  private readonly cutInCue?: ActionCutInCue

  protected constructor(props: BaseActionProps) {
    this.props = props
    this.gainStateFactories = props.gainStates ? [...props.gainStates] : []
    this.audioCue = props.audioCue
    this.cutInCue = props.cutInCue
  }

  abstract get type(): ActionType

  get name(): string {
    return this.props.name
  }

  protected get cardDefinitionBase(): CardDefinition {
    return this.props.cardDefinition
  }

  /**
   * アクションの発動コストを算出する。
   * いまは定義済みコストをそのまま返すだけだが、状態異常などの補正を入れる余地を残す。
   */
  cost(_context?: ActionCostContext): number {
    const cardTags = _context?.cardTags ?? []
    let cost = this.cardDefinitionBase.cost

    // State由来のコスト補正
    const source = (_context?.source as Player | Enemy | undefined) ?? (_context?.battle?.player as Player | Enemy | undefined)
    const stateAdjust =
      source && 'getStates' in source && typeof source.getStates === 'function'
        ? (source as Player | Enemy)
            .getStates(_context?.battle)
            .reduce(
              (sum, state) =>
                sum +
                (typeof state.costAdjustment === 'function'
                  ? state.costAdjustment({
                      battle: _context?.battle,
                      owner: source as Player | Enemy,
                      cardTags,
                      cardType: this.cardDefinitionBase.cardType,
                    })
                  : 0),
              0,
            )
        : 0
    cost += stateAdjust ?? 0

    // レリック由来のコスト補正
    const relicAdjust =
      _context?.battle
        ?.getRelicInstances()
        .reduce(
          (sum, relic) =>
            sum +
            (typeof relic.costAdjustment === 'function'
              ? relic.costAdjustment({
                  battle: _context?.battle,
                  player: _context?.battle?.player,
                  cardTags,
                  cardType: this.cardDefinitionBase.cardType,
                })
              : 0),
          0,
        ) ?? 0
    cost += relicAdjust

    return Math.max(0, cost)
  }

  describe(context?: ActionContext): string {
    return this.description(context)
  }

  protected description(_context?: ActionContext): string {
    return ''
  }

  /**
   * カードが発動可能かを判定するためのフック。
   * デフォルトでは常に true を返し、個別の Action が条件付き発動をしたい場合にオーバーライドする。
   */
  isActive(_context?: { battle?: Battle; source?: Player | Enemy; cardTags?: CardTag[] }): boolean {
    return true
  }

  createCardDefinition(context?: ActionContext): CardDefinition {
    const base = this.cardDefinitionBase
    const operations = this.buildOperations().map((operation) => operation.type)
    const finalOperations = operations.length > 0 ? operations : base.operations

    if (finalOperations) {
      return {
        ...base,
        operations: finalOperations,
      }
    }

    return { ...base }
  }

  prepareContext(params: {
    battle: Battle
    source: Player | Enemy
    operations: CardOperation[]
  }): ActionContext {
    const operationContext: OperationContext = {
      battle: params.battle,
      player: params.battle.player,
    }

    const requiredOperations = this.buildOperations().filter((operation) =>
      this.shouldRequireOperation(operation, params),
    )
    const { completedOperations, metadata } = this.resolveRequiredOperations(
      requiredOperations,
      params,
      operationContext,
    )

    const context: ActionContext = {
      battle: params.battle,
      source: params.source,
      metadata,
      operations: completedOperations,
    }

    context.target = this.resolveTarget(context)
    const audioCue = this.getAudioCue(context)
    if (audioCue) {
      context.metadata = {
        ...(context.metadata ?? {}),
        audio: { ...audioCue },
      }
    }
    const cutInCue = this.getCutInCue(context)
    if (cutInCue) {
      context.metadata = {
        ...(context.metadata ?? {}),
        cutin: { ...cutInCue },
      }
    }

    return context
  }

  execute(context: ActionContext): void {
    this.perform(context)
    this.applyGainStates(context)
    context.battle.notifyActionResolved({ source: context.source, action: this })
  }

  get gainStatePreviews(): State[] {
    return this.gainStateFactories.map((factory) => factory())
  }

  protected buildOperations(): Operation[] {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldRequireOperation(
    _operation: Operation,
    _context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    return true
  }

  protected resolveTarget(context: ActionContext): Player | Enemy | undefined {
    const targetOperation = context.operations?.find(
      (operation) => operation.type === TargetEnemyOperation.TYPE,
    ) as TargetEnemyOperation | undefined

    return targetOperation?.enemy
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected perform(_context: ActionContext): void {}

  protected getAudioCue(_context: ActionContext): ActionAudioCue | undefined {
    return this.audioCue
  }

  protected getCutInCue(_context: ActionContext): ActionCutInCue | undefined {
    return this.cutInCue
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canUse(_context: { battle: Battle; source: Player | Enemy }): boolean {
    return true
  }

  describeTargetEnemyAvailability(context: OperationContext): TargetEnemyAvailabilityEntry[] {
    const operations = this.buildOperations()
    const targetOperation = operations.find(
      (operation) => operation.type === TargetEnemyOperation.TYPE,
    ) as TargetEnemyOperation | undefined
    if (!targetOperation) {
      return []
    }
    return targetOperation.describeAvailability(context)
  }

  describeHandSelectionAvailability(context: OperationContext): HandCardSelectionAvailabilityEntry[] {
    const operations = this.buildOperations()
    const selectOperation = operations.find(
      (operation) => operation.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined
    if (!selectOperation) {
      return []
    }
    return selectOperation.describeAvailability(context)
  }

  describePileSelectionCandidates(
    _context: OperationContext,
  ): { pile: 'deck' | 'discard' | 'exile'; cardIds: number[] } | null {
    return null
  }

  private resolveRequiredOperations(
    requiredOperations: Operation[],
    params: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
    operationContext: OperationContext,
  ): { completedOperations: Operation[]; metadata: Record<string, unknown> } {
    if (requiredOperations.length === 0) {
      if (params.operations.length > 0) {
        throw new Error('Unexpected operations were supplied')
      }
      return { completedOperations: [], metadata: {} }
    }

    const usedOperationIndex = new Set<number>()
    const completedOperations: Operation[] = []
    const metadata: Record<string, unknown> = {}

    for (const operation of requiredOperations) {
      const inputIndex = params.operations.findIndex((candidate, index) => {
        if (usedOperationIndex.has(index)) {
          return false
        }
        return candidate.type === operation.type
      })

      if (inputIndex === -1) {
        throw new Error(`Operation "${operation.type}" is required but missing`)
      }

      const input = params.operations[inputIndex]!
      // デバッグ用: Operation 解決前の入力を記録
      // eslint-disable-next-line no-console
      console.info('[ActionBase] resolveRequiredOperations', { operationType: operation.type, payload: input.payload })
      operation.complete(input.payload, operationContext)

      if (!operation.isCompleted()) {
        throw new Error(`Operation "${operation.type}" is not completed`)
      }

      usedOperationIndex.add(inputIndex)
      completedOperations.push(operation)
      Object.assign(metadata, operation.toMetadata())
    }

    if (usedOperationIndex.size !== params.operations.length) {
      const unexpected = params.operations
        .filter((_, index) => !usedOperationIndex.has(index))
        .map((operation) => operation.type)
      throw new Error(`Unexpected operations were supplied: ${unexpected.join(', ')}`)
    }

    return { completedOperations, metadata }
  }

  private applyGainStates(context: ActionContext): void {
    if (this.gainStateFactories.length === 0) {
      return
    }

    const source = context.source
    for (const factory of this.gainStateFactories) {
      source.addState(factory(), { battle: context.battle })
    }
  }
}
