import { AllyBuffSkill, type AllyBuffSkillProps } from '../Action'
import { AccelerationState } from '../states/AccelerationState'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import type { ActionContext } from '../Action/ActionBase'
import type { Enemy } from '../Enemy'

export class TailwindAction extends AllyBuffSkill {
  private readonly magnitude: number

  constructor(magnitude = 1) {
    const props: AllyBuffSkillProps = {
      name: '追い風',
      cardDefinition: {
        title: '追い風',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
        subtitle: '',
      },
      audioCue: {
        soundId: 'skills/kurage-kosho_status03.mp3',
        waitMs: 0, // ステータス反映を待たせないために0msに設定
        durationMs: 0, 
      },
      targetTags: ['acceleratable', 'multi-attack'],
      affinityKey: 'tailwind',
      inflictStates: [() => new AccelerationState(magnitude)],
    }
    super(props)
    this.magnitude = magnitude
  }

  protected override description(): string {
    return `味方の風を整え、加速(${this.magnitude})を付与する`
  }

  protected override afterBuffApplied(context: ActionContext, target: Enemy): void {
    context.battle.addLogEntry({
      message: `${context.source.name}の追い風が${target.name}を加速させた。`,
      metadata: { sourceId: (context.source as Enemy).id, targetId: target.id },
    })
  }
}
