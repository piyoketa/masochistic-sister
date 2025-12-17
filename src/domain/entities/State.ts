import type { CardDefinition } from './CardDefinition'
import type { DamageCalculationParams, DamageOutcome, Damages } from './Damages'
import { StateAction } from './Action/StateAction'
import type { CardTag } from './CardTag'
import type { Battle } from '../battle/Battle'
import type { Player } from './Player'
import type { Enemy } from './Enemy'
import type { Action } from './Action'

type StackableStateProps = {
  id: string
  name: string
  stackable: true
  magnitude: number
  cardDefinition?: CardDefinition
  isImportant?: boolean
  /**
   * 状態を表すアイコンパス。デフォルトは未指定。派生クラスで上書き可能。
   */
  iconPath?: string
}

type NonStackableStateProps = {
  id: string
  name: string
  stackable: false
  magnitude?: undefined
  cardDefinition?: CardDefinition
  isImportant?: boolean
  /**
   * 状態を表すアイコンパス。デフォルトは未指定。派生クラスで上書き可能。
   */
  iconPath?: string
}

export type StateProps = StackableStateProps | NonStackableStateProps

export type StateCategory = 'bad' | 'buff' | 'trait'

export class State {
  protected readonly props: StateProps

  constructor(props: StateProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get magnitude(): number | undefined {
    if (!this.isStackable()) {
      return undefined
    }
    return this.props.magnitude
  }

  get cardDefinitionBase(): CardDefinition | undefined {
    return this.props.cardDefinition
  }

  /**
   * UI用の状態アイコンパス。存在しない場合は undefined を返す。
   */
  get iconPath(): string | undefined {
    return this.props.iconPath
  }

  /**
   * このStateのカテゴリ（Bad/Buff/Trait）。派生クラスで必ず実装する。
   */
  getCategory(): StateCategory {
    throw new Error('State.getCategory must be overridden by subclasses')
  }

  /**
   * Traitの重要度フラグ。デフォルト false。
   */
  isImportant(): boolean {
    return Boolean(this.props.isImportant)
  }

  get priority(): number {
    return 10
  }

  description(): string {
    return ''
  }

  /**
   * コスト計算時の補正値を返す。デフォルトは0。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  costAdjustment(_context?: {
    battle?: Battle
    owner?: Player | Enemy
    cardTags?: CardTag[]
    cardType?: CardDefinition['cardType']
    action?: import('./Action').Action
  }): number {
    return 0
  }

  createCardDefinition(): CardDefinition {
    const base = this.cardDefinitionBase
    if (!base) {
      throw new Error('State does not provide a card definition')
    }

    return { ...base }
  }

  stackWith(state: State): void {
    if (!this.isStackable()) {
      return
    }
    if (state.id !== this.id) {
      throw new Error(`State "${this.id}" cannot be stacked with different id "${state.id}"`)
    }

    if (!state.isStackable()) {
      throw new Error(`State "${this.id}" cannot be stacked with non-stackable state "${state.id}"`)
    }

    const incoming = state.magnitude ?? 0
    if (incoming === 0) {
      return
    }

    const current = this.magnitude ?? 0
    this.setMagnitude(current + incoming)
  }

  apply(): void {}

  remove(): void {}

  isPreHitModifier(): boolean {
    return false
  }

  isPostHitModifier(): boolean {
    return false
  }

  affectsAttacker(): boolean {
    return false
  }

  affectsDefender(): boolean {
    return false
  }

  modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    return params
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTurnStart(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPlayerTurnStart(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onActionResolved(_context: {
    battle: Battle
    owner: Player | Enemy
    actor: Player | Enemy
    action: Action
  }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHitResolved(_context: DamageHitContext): boolean {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDamageSequenceResolved(_context: DamageSequenceContext): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOwnerDefeated(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // 味方が撃破されたときに呼ばれる拡張ポイント。デフォルトは何もしない。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAllyDefeated(_context: AllyDefeatedContext): void {}

  protected setMagnitude(value: number | undefined): void {
    if (!this.isStackable()) {
      throw new Error(`State "${this.id}" is not stackable but setMagnitude was called`)
    }
    this.props.magnitude = value ?? this.props.magnitude
  }

  isStackable(): this is State & { props: StackableStateProps } {
    return this.props.stackable
  }
}

/**
 * プレイヤー手札に入る「悪性」状態（カード化されるもの）
 */
export class BadState extends State {
  constructor(props: StateProps) {
    super({ ...props, iconPath: props.iconPath ?? '/assets/icons/debuff.png' })
  }

  override getCategory(): StateCategory {
    return 'bad'
  }

  /**
   * 状態カードとして使用可能な Action を生成する。
   * 追加タグを渡すことで、記憶タグなどを付与したバリアントも生成できる。
   */
  action(tags?: CardTag[]): Action {
    return new StateAction({
      name: this.name,
      cardDefinition: this.createCardDefinition(),
      tags,
      stateId: this.id,
      sourceState: this,
    })
  }
}

/**
 * バフ系（手札に入らない）
 */
export class BuffState extends State {
  constructor(props: StateProps) {
    super({ ...props, iconPath: props.iconPath ?? '/assets/icons/buff.png' })
  }

  override getCategory(): StateCategory {
    return 'buff'
  }
}

/**
 * 敵固有 Trait
 */
export class TraitState extends State {
  constructor(props: StateProps) {
    super(props)
  }

  override getCategory(): StateCategory {
    return 'trait'
  }

  override isImportant(): boolean {
    return Boolean(this.props.isImportant) || super.isImportant()
  }
}

export interface DamageHitContext {
  battle: Battle
  attack: Action
  attacker: Player | Enemy
  defender: Player | Enemy
  damages: Damages
  index: number
  outcome: DamageOutcome
  role: 'attacker' | 'defender'
}

export interface DamageSequenceContext {
  battle: Battle
  attack: Action
  attacker: Player | Enemy
  defender: Player | Enemy
  damages: Damages
  outcomes: readonly DamageOutcome[]
}

// 味方撃破イベントのコンテキスト。デフォルト実装は何もしない。
export interface AllyDefeatedContext {
  battle: Battle
  owner: Player | Enemy
  ally: Player | Enemy
}
