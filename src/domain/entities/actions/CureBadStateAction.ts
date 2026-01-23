import { AllyStateSkill, type AllyStateSkillProps } from '../Action'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import type { ActionContext } from '../Action/ActionBase'
import type { Enemy } from '../Enemy'
import type { Battle } from '@/domain/battle/Battle'
import type { State } from '../State'

/*
キュア: 仲間に付与されたBadStateを1つだけ解除するスキル。
- 使用条件: チーム内にBadStateを保持している味方がいること。
- 対象: BadStateを1つ以上持つ味方1体（自身含む）。
- 効果: 対象のBadStateをランダムに1種類除去する。
*/
const PROPS: AllyStateSkillProps = {
  name: 'キュア',
  cardDefinition: {
    title: 'キュア',
    cardType: 'skill',
    type: new SkillTypeCardTag(),
    target: new SelfTargetCardTag(),
    cost: 0,
    subtitle: '',
  },
  targetTags: [],
  affinityKey: 'cure',
}

export class CureBadStateAction extends AllyStateSkill {
  static readonly cardId = 'cure-bad-state'
  constructor() {
    super(PROPS)
  }

  protected override description(): string {
    return '味方1体のBadStateを1つ解除する'
  }

  override canUse(context: { battle: Battle; source: Enemy }): boolean {
    return this.findAlliesWithBadState(context.battle).length > 0
  }

  override planTarget(params: { battle: Battle; source: Enemy; team: import('../EnemyTeam').EnemyTeam }): boolean {
    const candidates = this.findAlliesWithBadState(params.battle).filter(
      (ally) => ally.isActive() && this.requiredAllyTags.every((tag) => ally.hasAllyTag(tag)),
    )
    if (candidates.length === 0) {
      this.setPlannedTarget(undefined)
      return false
    }

    const index = Math.min(candidates.length - 1, Math.floor(params.source.sampleRng() * candidates.length))
    this.setPlannedTarget(candidates[index]?.id)
    return this.getPlannedTarget() !== undefined
  }

  protected override perform(context: ActionContext): void {
    const target = this.resolveAllyTarget(context)
    if (!target || !target.isActive()) {
      context.metadata = { ...(context.metadata ?? {}), skipped: true, skipReason: 'ally-target-missing' }
      return
    }

    const badStates = this.listCleansableStates(target.getStates())
    if (badStates.length === 0) {
      context.metadata = { ...(context.metadata ?? {}), skipped: true, skipReason: 'ally-cure-no-state' }
      return
    }

    const rng = (context.source as Enemy).sampleRng ? (context.source as Enemy).sampleRng() : Math.random()
    const picked = badStates[Math.min(badStates.length - 1, Math.floor(rng * badStates.length))]
    if (picked) {
      target.removeState(picked.id)
      context.metadata = {
        ...(context.metadata ?? {}),
        removedStateId: picked.id,
        removedStateName: picked.name,
      }
    }
  }

  private findAlliesWithBadState(battle: Battle): Enemy[] {
    return battle.enemyTeam.members.filter(
      (ally) =>
        ally.isActive() &&
        this.listCleansableStates(ally.getStates()).length > 0,
    )
  }

  private listCleansableStates(states: State[]): State[] {
    const targetIds = new Set(['state-corrosion', 'state-joint-damage', 'state-sticky'])
    return states.filter((state) => targetIds.has(state.id))
  }
}
