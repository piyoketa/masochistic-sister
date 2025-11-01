import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { Enemy } from './Enemy'
import type { Player } from './Player'
import type { State } from './State'
import { Damages, type DamagePattern } from './Damages'
import {
  TargetEnemyOperation,
  type CardOperation,
  type Operation,
  type OperationContext,
} from './operations'
import { isPlayerEntity } from './typeGuards'

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

  protected get cardDefinitionBase(): CardDefinitionBase {
    return this.props.cardDefinition
  }

  describe(context?: ActionContext): string {
    return this.description(context)
  }

  protected description(_context?: ActionContext): string {
    return ''
  }

  createCardDefinition(context?: ActionContext): CardDefinition {
    const base = this.cardDefinitionBase
    const operations = this.buildOperations().map((operation) => operation.type)
    return {
      ...base,
      description: this.describe(context),
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

    return context
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
  baseDamage: Damages
}

export abstract class Attack extends Action {
  protected readonly baseProfile: Damages
  private overrideDamagesInstance?: Damages

  protected constructor(props: AttackProps) {
    super(props)
    this.baseProfile = props.baseDamage
  }

  get type(): ActionType {
    return 'attack'
  }

  get baseDamages(): Damages {
    return this.baseProfile
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
    ;(clone as unknown as { baseProfile: Damages }).baseProfile = new Damages({
      baseAmount: damages.amount,
      baseCount: damages.count,
      type: damages.type,
    })
    ;(clone as unknown as { props: BaseActionProps }).props = mergedProps

    return clone
  }

  execute(context: ActionContext): void {
    // プレイヤー側からの攻撃なのか、敵側からの攻撃なのかでデフォルトの対象が異なるため、先に判別する
    const isPlayerSource = isPlayerEntity(context.source)
    const target = context.target ?? this.resolveTarget(context)
    const defender = target ?? (isPlayerSource ? undefined : context.battle.player)
    if (!defender) {
      throw new Error('Attack target is not resolved')
    }

    // 各攻撃固有の事前処理（追加コスト徴収など）がある場合はここで定義する
    this.beforeAttack(context, defender)

    // ダメージ計算はAttack共通のcalcDamagesで行い、返り値には与ダメ合計だけでなく参照したState情報も含める
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

    return new Damages({
      baseAmount: this.baseProfile.baseAmount,
      baseCount: this.baseProfile.baseCount,
      type: this.baseProfile.type,
      attackerStates: this.collectStates(attacker),
      defenderStates: this.collectStates(defender),
    })
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override shouldRequireOperation(
    operation: Operation,
    context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    const isPlayerSource = isPlayerEntity(context.source)
    if (!isPlayerSource && operation.type === TargetEnemyOperation.TYPE) {
      return false
    }

    return true
  }

  private isPlayer(entity: Player | Enemy): entity is Player {
    return isPlayerEntity(entity)
  }

  private collectStates(entity: Player | Enemy): State[] {
    if ('getStates' in entity && typeof entity.getStates === 'function') {
      return [...entity.getStates()]
    }

    return []
  }
}
