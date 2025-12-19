import { AllyBuffSkill, type AllyBuffSkillProps } from '../Action'
import { StrengthState } from '../states/StrengthState'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import type { ActionContext } from '../Action/ActionBase'
import type { Enemy } from '../Enemy'

const CHEER_PROPS: AllyBuffSkillProps = {
  name: '応援',
  cardDefinition: {
    title: '応援',
    cardType: 'skill',
    type: new SkillTypeCardTag(),
    target: new SelfTargetCardTag(),
    cost: 0,
    subtitle: '',
  },
  targetTags: [],
  affinityKey: 'cheer',
  inflictStates: [() => new StrengthState(10)],
}

/**
 * 味方1体に打点上昇(10)を付与する支援スキル。
 */
export class CheerAction extends AllyBuffSkill {
  constructor() {
    super(CHEER_PROPS)
  }

  protected override description(): string {
    return '味方に打点上昇 10点を付与する'
  }

  protected override afterBuffApplied(context: ActionContext, target: Enemy): void {
    context.battle.addLogEntry({
      message: `${context.source.name}は${target.name}を応援し、打点を高めた。`,
      metadata: { sourceId: (context.source as Enemy).id, targetId: target.id },
    })
  }
}
