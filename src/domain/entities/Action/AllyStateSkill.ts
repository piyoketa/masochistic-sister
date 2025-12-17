/*
AllyStateSkill.ts の責務:
- 味方に状態異常（バフ/デバフを含む State）を付与するスキル共通の基底クラス。
- 対象選定ロジック（ターゲット候補の絞り込みと重み付き抽選）と、ターゲットIDの事前確定・保持を提供する。
- `planTarget` によって「ターン開始時に対象を決める」処理を Action 側へ委譲し、EnemyTeam 側の特例分岐を減らす。

責務ではないこと:
- 個別スキル固有の追加効果やログ出力。必要なら派生クラスが perform/afterX をオーバーライドする。

主な通信相手:
- EnemyActionQueue.ensureActionForTurn / EnemyTeam.ensureActionsForTurn: `planTarget` を呼び出して対象を確定させる。
- Enemy / Battle: `planTarget` 内で Battle/Enemy 情報を参照し、重み付き抽選を行う。
*/
import type { ActionContext } from './ActionBase'
import type { ActionPlanSnapshot, ActionWithPlan } from './ActionBase'
import { Skill, type SkillProps } from './Skill'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'

export interface AllyStateSkillProps extends SkillProps {
  /** 対象が持つべき allyTag。全て満たした味方のみ抽選対象にする。 */
  targetTags: string[]
  /** 抽選時の重み付けキー。allyBuffWeights と対応づける。 */
  affinityKey: string
}

export interface PlanAllyTargetParams {
  battle: import('../../battle/Battle').Battle
  source: Enemy
  team: import('../EnemyTeam').EnemyTeam
}

export interface PlanAllyTargetSkill {
  planTarget(params: PlanAllyTargetParams): boolean
}

// 「味方バフ/状態付与のターゲットを事前に確定し、スナップショットへ残す」責務を持つので、ActionWithPlanを実装する。
export abstract class AllyStateSkill extends Skill implements PlanAllyTargetSkill, ActionWithPlan {
  // 味方バフのターゲット抽選をデバッグするためのフラグ。env.VITE_DEBUG_ALLY_BUFF_PLAN=true で有効化。
  private static readonly DEBUG_ALLY_BUFF_PLAN =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_DEBUG_ALLY_BUFF_PLAN === 'true') ||
    (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ALLY_BUFF_PLAN === 'true')

  private readonly requiredTags: string[]
  private readonly affinityKeyValue: string
  private plannedTargetId?: number

  protected constructor(props: AllyStateSkillProps) {
    super(props)
    this.requiredTags = [...props.targetTags]
    this.affinityKeyValue = props.affinityKey
  }

  /**
   * EnemyTeam 側で利用する、抽選用のターゲット要件。
   */
  get requiredAllyTags(): string[] {
    return [...this.requiredTags]
  }

  /**
   * Enemy.getAllyBuffWeight との対応キー。
   */
  get affinityKey(): string {
    return this.affinityKeyValue
  }

  setPlannedTarget(enemyId: number | undefined): void {
    this.plannedTargetId = enemyId
  }

  getPlannedTarget(): number | undefined {
    return this.plannedTargetId
  }

  protected clearPlannedTarget(): void {
    this.plannedTargetId = undefined
  }

  override execute(context: ActionContext): void {
    super.execute(context)
    this.clearPlannedTarget()
  }

  // スナップショット保存用に、計画済みターゲットをシリアライズする。
  serializePlan(): ActionPlanSnapshot | undefined {
    return this.plannedTargetId !== undefined
      ? { kind: 'ally-target', targetId: this.plannedTargetId }
      : undefined
  }

  // 復元時に計画済みターゲットをActionへ戻す。
  restorePlan(plan: ActionPlanSnapshot | undefined): void {
    this.setPlannedTarget(plan?.targetId)
  }

  /**
   * Battle/Enemy 情報を使って対象を決定し、事前に保持する。
   * 抽選ロジック:
   * - 自身以外かつ requiredTags を全て満たすアクティブな味方を抽出
   * - allyBuffWeight(affinityKey) を重みとしてルーレット選択。weight 未設定は 1 とする
   */
  planTarget({ battle, source, team }: PlanAllyTargetParams): boolean {
    const candidates = team
      .members.filter(
        (ally) =>
          ally.isActive() &&
          ally !== source &&
          this.requiredTags.every((tag) => ally.hasAllyTag(tag)),
      )

    if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
      // 調査用に候補と重みをロギングする。環境変数で明示的にオンにしない限り出力しない。
      // eslint-disable-next-line no-console
      console.info('[AllyStateSkill.planTarget] candidates', {
        source: { id: source.id, name: source.name },
        turn: battle.turnPosition?.turn,
        side: battle.turnPosition?.side,
        affinityKey: this.affinityKeyValue,
        requiredTags: [...this.requiredTags],
        candidates: candidates.map((ally) => ({
          id: ally.id,
          name: ally.name,
          weight: ally.getAllyBuffWeight(this.affinityKeyValue),
          isActive: ally.isActive(),
          // タグの有無を配列で確認できるようにする
          tags: this.requiredTags.map((tag) => ({ tag, has: ally.hasAllyTag(tag) })),
        })),
      })
    }

    if (candidates.length === 0) {
      this.setPlannedTarget(undefined)
      if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
        // eslint-disable-next-line no-console
        console.info('[AllyStateSkill.planTarget] no candidates', {
          source: { id: source.id, name: source.name },
        })
      }
      return false
    }

    const weighted = candidates
      .map((ally) => {
        // 明示的に0を指定した場合は候補外扱いにするため、未指定(null/undefined)のみ1をデフォルトとする。
        const weight = ally.getAllyBuffWeight(this.affinityKey) ?? 1
        return { ally, weight }
      })
      .filter(({ weight }) => weight > 0)

    if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
      // eslint-disable-next-line no-console
      console.info('[AllyStateSkill.planTarget] weighted', {
        source: { id: source.id, name: source.name },
        turn: battle.turnPosition?.turn,
        side: battle.turnPosition?.side,
        weighted: weighted.map(({ ally, weight }) => ({
          id: ally.id,
          name: ally.name,
          weight,
        })),
      })
    }

    if (weighted.length === 0) {
      this.setPlannedTarget(undefined)
      if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
        // eslint-disable-next-line no-console
        console.info('[AllyStateSkill.planTarget] weights filtered out', {
          source: { id: source.id, name: source.name },
        })
      }
      return false
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
    let threshold = source.sampleRng() * total
    for (const entry of weighted) {
      threshold -= entry.weight
      if (threshold <= 0) {
        this.setPlannedTarget(entry.ally.id)
      if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
        // eslint-disable-next-line no-console
        console.info('[AllyStateSkill.planTarget] selected', {
          source: { id: source.id, name: source.name },
          target: { id: entry.ally.id, name: entry.ally.name },
          turn: battle.turnPosition?.turn,
          side: battle.turnPosition?.side,
          totalWeight: total,
          pickedWeight: entry.weight,
        })
      }
      return true
      }
    }

    const last = weighted[weighted.length - 1]
    this.setPlannedTarget(last?.ally.id)
    if (AllyStateSkill.DEBUG_ALLY_BUFF_PLAN) {
      // eslint-disable-next-line no-console
      console.info('[AllyStateSkill.planTarget] fallback-selected', {
        source: { id: source.id, name: source.name },
        target: last ? { id: last.ally.id, name: last.ally.name } : undefined,
        turn: battle.turnPosition?.turn,
        side: battle.turnPosition?.side,
        totalWeight: total,
      })
    }
    return Boolean(last)
  }

  protected resolveAllyTarget(context: ActionContext): Enemy | undefined {
    const targetId = this.plannedTargetId
    if (targetId === undefined) {
      return undefined
    }
    return context.battle.enemyTeam.findEnemy(targetId)
  }

  override canUse(context: {
    battle: ActionContext['battle']
    source: Player | Enemy
  }): boolean {
    const team = context.battle.enemyTeam
    return team
      .members.filter((enemy) => enemy.isActive())
      .some((enemy) => this.requiredTags.every((tag) => enemy.hasAllyTag(tag)))
  }
}
