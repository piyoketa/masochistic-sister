import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { Enemy } from './Enemy'
import type { Player } from './Player'
import type { State } from './State'
import { Damages } from './Damages'
import {
  TargetEnemyOperation,
  type CardOperation,
  type Operation,
  type OperationContext,
} from './operations'

export type ActionType = 'attack' | 'skill'

export interface ActionContext {
  battle: Battle
  source: Player | Enemy
  target?: Player | Enemy
  metadata?: Record<string, unknown>
  operations?: Operation[]
}

export interface BaseActionProps {
  name: string
  description?: string
  descriptionBuilder?: (context: ActionContext) => string
  cardDefinition: CardDefinitionBase
}

export abstract class Action {
  protected readonly props: BaseActionProps

  protected constructor(props: BaseActionProps) {
    this.props = props
  }

  abstract get type(): ActionType

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  protected get cardDefinitionBase(): CardDefinitionBase {
    return this.props.cardDefinition
  }

  createDescription(context?: ActionContext): string {
    if (this.props.descriptionBuilder && context) {
      return this.props.descriptionBuilder(context)
    }

    if (this.props.description) {
      return this.props.description
    }

    return ''
  }

  createCardDefinition(context?: ActionContext): CardDefinition {
    const base = this.cardDefinitionBase
    const operations = this.buildOperations().map((operation) => operation.type)
    return {
      ...base,
      description: this.createDescription(context),
      operations,
    }
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
      operation.complete(input.payload, operationContext)

      if (!operation.isCompleted()) {
        throw new Error(`Operation "${operation.type}" is not completed`)
      }

      usedOperationIndex.add(inputIndex)
      completedOperations.push(operation)
      Object.assign(metadata, operation.toMetadata())
    }

    if (usedOperationIndex.size !== params.operations.length) {
      throw new Error('Unexpected operations were supplied')
    }

    const context: ActionContext = {
      battle: params.battle,
      source: params.source,
      metadata,
      operations: completedOperations,
    }

    context.target = this.resolveTarget(context)

    return context
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
  execute(_context: ActionContext): void {}
}

export interface SkillProps extends BaseActionProps {}

export abstract class Skill extends Action {
  protected constructor(props: SkillProps) {
    super(props)
  }

  get type(): ActionType {
    return 'skill'
  }
}

export interface AttackProps extends BaseActionProps {
  baseDamages: Damages
}

export abstract class Attack extends Action {
  protected readonly baseDamagesValue: Damages
  private overrideDamagesInstance?: Damages

  protected constructor(props: AttackProps) {
    super(props)
    this.baseDamagesValue = props.baseDamages
  }

  get type(): ActionType {
    return 'attack'
  }

  get baseDamages(): Damages {
    return this.baseDamagesValue
  }

  cloneWithDamages(damages: Damages, overrides?: Partial<BaseActionProps>): Attack {
    const clone = Object.create(Object.getPrototypeOf(this)) as Attack
    const currentProps = (this as unknown as { props: BaseActionProps }).props
    const mergedProps: BaseActionProps = {
      ...currentProps,
      ...(overrides ?? {}),
      cardDefinition: {
        ...currentProps.cardDefinition,
        ...(overrides?.cardDefinition ?? {}),
      },
    }

    Object.assign(clone, this)
    ;(clone as unknown as { baseDamagesValue: Damages }).baseDamagesValue = damages
    ;(clone as unknown as { props: BaseActionProps }).props = mergedProps

    return clone
  }

  execute(context: ActionContext): void {
    const isPlayerSource = 'currentMana' in context.source
    const target = context.target ?? this.resolveTarget(context)
    const defender = target ?? (isPlayerSource ? undefined : context.battle.player)
    if (!defender) {
      throw new Error('Attack target is not resolved')
    }

    this.beforeAttack(context, defender)

    const damages = this.calcDamages(context.source, defender)
    const totalDamage = Math.max(0, damages.amount * damages.count)

    if (this.isPlayer(defender)) {
      context.battle.damagePlayer(totalDamage)
    } else {
      defender.takeDamage(totalDamage)
    }

    this.onAfterDamage(context, damages, defender)

    if (this.isPlayer(defender)) {
      context.battle.cardRepository.memoryEnemyAttack(damages, this, context.battle)
    }
  }

  protected beforeAttack(_context: ActionContext, _defender: Player | Enemy): void {}

  protected onAfterDamage(_context: ActionContext, _damages: Damages, _defender: Player | Enemy): void {}

  protected setOverrideDamages(damages: Damages): void {
    this.overrideDamagesInstance = damages
  }

  calcDamages(attacker: Player | Enemy, defender: Player | Enemy): Damages {
    if (this.overrideDamagesInstance) {
      const damages = this.overrideDamagesInstance
      this.overrideDamagesInstance = undefined
      return damages
    }

    const base = this.baseDamagesValue
    let amount = base.amount
    let count = base.count

    const attackerStates = this.collectStates(attacker)
    const defenderStates = this.collectStates(defender)
    const usedAttackerStates: Set<State> = new Set()
    const usedDefenderStates: Set<State> = new Set()

    const strengthStates = attackerStates.filter((state) => state.id === 'state-strength')
    const strengthBonus = strengthStates.reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    if (strengthBonus !== 0) {
      amount += strengthBonus
      strengthStates.forEach((state) => usedAttackerStates.add(state))
    }

    const accelerationStates = attackerStates.filter((state) => state.id === 'state-acceleration')
    const accelerationBonus = accelerationStates.reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    if (accelerationBonus > 0) {
      count += accelerationBonus
      accelerationStates.forEach((state) => usedAttackerStates.add(state))
    }

    const corrosionStates = defenderStates.filter((state) => state.id === 'state-corrosion')
    const corrosionBonus = corrosionStates.reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    if (corrosionBonus !== 0) {
      amount += corrosionBonus * 10
      corrosionStates.forEach((state) => usedDefenderStates.add(state))
    }

    const hardShellStates = defenderStates.filter((state) => state.id === 'state-hard-shell')
    const hardShellReduction = hardShellStates.reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    if (hardShellReduction > 0) {
      amount = Math.max(0, amount - hardShellReduction)
      hardShellStates.forEach((state) => usedDefenderStates.add(state))
    }

    const finalCount = Math.max(1, Math.floor(count))
    const finalAmount = Math.max(0, amount)
    const type = finalCount > 1 ? 'multi' : 'single'

    return new Damages({
      type,
      amount: finalAmount,
      count: finalCount,
      attackerStates: Array.from(usedAttackerStates),
      defenderStates: Array.from(usedDefenderStates),
    })
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override shouldRequireOperation(
    operation: Operation,
    context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    const isPlayerSource = 'currentMana' in context.source
    if (!isPlayerSource && operation.type === TargetEnemyOperation.TYPE) {
      return false
    }

    return true
  }

  private isPlayer(entity: Player | Enemy): entity is Player {
    return 'currentMana' in entity
  }

  private collectStates(entity: Player | Enemy): State[] {
    if ('getStates' in entity && typeof entity.getStates === 'function') {
      return [...entity.getStates()]
    }

    return []
  }
}
