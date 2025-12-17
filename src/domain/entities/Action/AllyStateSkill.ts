/*
AllyStateSkill.ts の責務:
- 味方に状態異常（バフ/デバフを含む State）を付与するスキル共通の基底クラス。
- 対象選定ロジック（ターゲット候補の絞り込みと重み付き抽選）と、ターゲットIDの事前確定・保持を提供する。
- `planTarget` によって「ターン開始時に対象を決める」処理を Action 側へ委譲し、EnemyTeam 側の特例分岐を減らす。

責務ではないこと:
- 個別スキル固有の追加効果やログ出力。必要なら派生クラスが perform/afterX をオーバーライドする。

主な通信相手:
- EnemyTeam.planUpcomingActions: `planTarget` を呼び出して対象を確定させる。
- Enemy / Battle: `planTarget` 内で Battle/Enemy 情報を参照し、重み付き抽選を行う。
*/
import type { ActionContext } from './ActionBase'
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

export abstract class AllyStateSkill extends Skill implements PlanAllyTargetSkill {
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

    if (candidates.length === 0) {
      this.setPlannedTarget(undefined)
      return false
    }

    const weighted = candidates
      .map((ally) => {
        const weight = ally.getAllyBuffWeight(this.affinityKey) || 1
        return { ally, weight }
      })
      .filter(({ weight }) => weight > 0)

    if (weighted.length === 0) {
      this.setPlannedTarget(undefined)
      return false
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
    let threshold = source.sampleRng() * total
    for (const entry of weighted) {
      threshold -= entry.weight
      if (threshold <= 0) {
        this.setPlannedTarget(entry.ally.id)
        return true
      }
    }

    const last = weighted[weighted.length - 1]
    this.setPlannedTarget(last?.ally.id)
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
