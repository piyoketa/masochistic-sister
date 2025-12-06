import { AllyBuffSkill, type AllyBuffSkillProps } from '../Action'
import { AccelerationState } from '../states/AccelerationState'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import type { ActionContext } from '../Action/ActionBase'
import type { Enemy } from '../Enemy'

const TAILWIND_PROPS: AllyBuffSkillProps = {
  name: '追い風',
  cardDefinition: {
    title: '追い風',
    cardType: 'skill',
    type: new SkillTypeCardTag(),
    target: new SelfTargetCardTag(),
    cost: 0,
    subtitle: '',
  },
  targetTags: ['acceleratable', 'multi-attack'],
  affinityKey: 'tailwind',
  inflictStates: [() => new AccelerationState(1)],
}

export class TailwindAction extends AllyBuffSkill {
  constructor() {
    super(TAILWIND_PROPS)
  }

  protected override description(): string {
    return '味方の風を整え、加速(1)を付与する'
  }

  protected override afterBuffApplied(context: ActionContext, target: Enemy): void {
    context.battle.addLogEntry({
      message: `${context.source.name}の追い風が${target.name}を加速させた。`,
      metadata: { sourceId: (context.source as Enemy).id, targetId: target.id },
    })
  }
}
