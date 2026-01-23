/*
闇の加護:
- 「天の鎖無効」を持たない味方1体に「天の鎖無効」を付与する。
- 味方全員が既に「天の鎖無効」を持っている場合は使用不可。
*/
import { AllyBuffSkill, type AllyBuffSkillProps } from '../Action'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import { LargeState } from '../states/LargeState'
import type { Battle } from '@/domain/battle/Battle'
import type { Enemy } from '../Enemy'

const PROPS: AllyBuffSkillProps = {
  name: '闇の加護',
  cardDefinition: {
    title: '闇の加護',
    cardType: 'skill',
    type: new SkillTypeCardTag(),
    target: new SelfTargetCardTag(),
    cost: 0,
    subtitle: '',
  },
  targetTags: [],
  affinityKey: 'dark-blessing',
  inflictStates: [() => new LargeState()],
}

export class DarkBlessingAction extends AllyBuffSkill {
  static readonly cardId = 'dark-blessing'
  constructor() {
    super(PROPS)
  }

  protected override description(): string {
    return '味方1体に天の鎖無効を付与する'
  }

  override canUse(context: { battle: Battle; source: Enemy }): boolean {
    return this.findTargets(context.battle).length > 0
  }

  override planTarget(params: { battle: Battle; source: Enemy; team: import('../EnemyTeam').EnemyTeam }): boolean {
    const candidates = this.findTargets(params.battle).filter(
      (ally) => ally.isActive() && this.requiredAllyTags.every((tag) => ally.hasAllyTag(tag)),
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

  private findTargets(battle: Battle): Enemy[] {
    return battle.enemyTeam.members.filter(
      (ally) => ally.isActive() && !ally.getStates().some((state) => state.id === 'state-large'),
    )
  }
}
