/*
治療 (AllyCleanseAction) の責務:
- 味方に付与された特定の状態異常（腐食/関節損傷/粘液）をランダムに1種類だけ除去する。
- ターン開始の計画フェーズで対象味方を決め、実行フェーズで対象ステートを抽選・削除する。

責務ではないこと:
- 状態異常の付与やダメージ計算。純粋に除去のみを担当する。
- 対象ステートが存在しない場合のフォールバック行動（代替効果は実装しない）。

主な通信相手:
- EnemyTeam: 味方候補の列挙とID検索に利用。
- Enemy: sampleRng() での乱数取得、保持Stateの列挙・removeState呼び出しを行う。
- Battle: canUse/planTarget判定で参照し、実行時のメタデータ付与のみ（追加の演出は付けない）。
*/
import { AllyStateSkill, type AllyStateSkillProps } from '../Action'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import type { ActionContext } from '../Action/ActionBase'
import type { Enemy } from '../Enemy'
import type { Battle } from '@/domain/battle/Battle'

// 治療: 味方の腐食/関節損傷/粘液のいずれかを1種類除去するスキル
const CLEANSABLE_STATE_IDS = ['state-corrosion', 'state-joint-damage', 'state-sticky'] as const

const ALLY_CLEANSE_PROPS: AllyStateSkillProps = {
  name: '治療',
  cardDefinition: {
    title: '治療',
    cardType: 'skill',
    type: new SkillTypeCardTag(),
    target: new SelfTargetCardTag(),
    cost: 0,
    subtitle: '',
  },
  targetTags: [],
  affinityKey: 'cleanse',
}

export class AllyCleanseAction extends AllyStateSkill {
  constructor() {
    super(ALLY_CLEANSE_PROPS)
  }

  protected override description(): string {
    return '味方の腐食/関節損傷/粘液を1種類だけ癒やす'
  }

  override canUse(context: { battle: Battle; source: Enemy }): boolean {
    return this.findCleansableAllies(context.battle).length > 0
  }

  override planTarget(params: { battle: Battle; source: Enemy; team: import('../EnemyTeam').EnemyTeam }): boolean {
    const candidates = this.findCleansableAllies(params.battle).filter(
      (ally) => ally !== params.source && ally.isActive() && this.requiredAllyTags.every((tag) => ally.hasAllyTag(tag)),
    )
    if (candidates.length === 0) {
      this.setPlannedTarget(undefined)
      return false
    }

    const weighted = candidates
      .map((ally) => {
        const rawWeight = ally.getAllyBuffWeight(this.affinityKey)
        const weight = rawWeight > 0 ? rawWeight : 1
        return { ally, weight }
      })
      .filter(({ weight }) => weight > 0)

    if (weighted.length === 0) {
      this.setPlannedTarget(undefined)
      return false
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
    let threshold = params.source.sampleRng() * total
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

  protected override perform(context: ActionContext): void {
    const target = this.resolveAllyTarget(context)
    if (!target || !target.isActive()) {
      context.metadata = {
        ...(context.metadata ?? {}),
        skipped: true,
        skipReason: 'ally-target-missing',
      }
      return
    }

    const cleansableStates = target
      .getStates()
      .filter((state) => CLEANSABLE_STATE_IDS.includes(state.id as (typeof CLEANSABLE_STATE_IDS)[number]))
    if (cleansableStates.length === 0) {
      context.metadata = {
        ...(context.metadata ?? {}),
        skipped: true,
        skipReason: 'ally-cleanse-no-state',
      }
      return
    }

    const rng = (context.source as Enemy).sampleRng ? (context.source as Enemy).sampleRng() : Math.random()
    const index = Math.min(cleansableStates.length - 1, Math.floor(rng * cleansableStates.length))
    const picked = cleansableStates[index]
    if (picked) {
      target.removeState(picked.id)
      context.metadata = {
        ...(context.metadata ?? {}),
        removedStateId: picked.id,
        removedStateName: picked.name,
      }
    }
  }

  private findCleansableAllies(battle: Battle): Enemy[] {
    return battle.enemyTeam.members.filter(
      (ally) =>
        ally.isActive() &&
        ally
          .getStates()
          .some((state) => CLEANSABLE_STATE_IDS.includes(state.id as (typeof CLEANSABLE_STATE_IDS)[number])),
    )
  }
}
