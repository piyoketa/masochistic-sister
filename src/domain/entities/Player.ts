import type { State } from './State'
import type { Battle } from '../battle/Battle'
import type { Hand } from '../battle/Hand'

export interface PlayerProps {
  id: string
  name: string
  maxHp: number
  currentHp: number
  maxMana: number
  currentMana: number
}

export class Player {
  private readonly idValue: string
  private readonly nameValue: string
  private readonly maxHpValue: number
  private readonly maxManaValue: number
  private currentHpValue: number
  private currentManaValue: number
  private handRef?: Hand

  constructor(props: PlayerProps) {
    this.idValue = props.id
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.maxManaValue = props.maxMana
    this.currentHpValue = props.currentHp
    this.currentManaValue = props.currentMana
  }

  get id(): string {
    return this.idValue
  }

  get name(): string {
    return this.nameValue
  }

  get maxHp(): number {
    return this.maxHpValue
  }

  get currentHp(): number {
    return this.currentHpValue
  }

  get maxMana(): number {
    return this.maxManaValue
  }

  get currentMana(): number {
    return this.currentManaValue
  }

  takeDamage(amount: number): void {
    this.currentHpValue = Math.max(0, this.currentHpValue - Math.max(0, Math.floor(amount)))
  }

  heal(amount: number): void {
    this.currentHpValue = Math.min(this.maxHpValue, this.currentHpValue + Math.max(0, Math.floor(amount)))
  }

  spendMana(cost: number): void {
    if (cost > this.currentManaValue) {
      throw new Error('Not enough mana')
    }
    this.currentManaValue -= cost
  }

  gainMana(amount: number): void {
    this.currentManaValue = Math.min(this.maxManaValue, this.currentManaValue + Math.max(0, Math.floor(amount)))
  }

  gainTemporaryMana(amount: number): void {
    if (amount <= 0) {
      return
    }
    this.currentManaValue += Math.floor(amount)
  }

  resetMana(): void {
    this.currentManaValue = this.maxManaValue
  }

  addState(state: State, options?: { battle?: Battle }): void {
    // プレイヤーの状態異常は手札に対応カードとしてのみ管理する。
    const battle = options?.battle
    if (battle && state.cardDefinitionBase) {
      battle.cardRepository.memoryState(state, battle)
    }
  }

  removeState(stateId: string): void {
    const hand = this.handRef
    if (!hand) {
      return
    }

    const targetCard = hand
      .list()
      .find((card) => card.state?.id === stateId)

    if (targetCard) {
      hand.remove(targetCard)
    }
  }

  getStates(): State[] {
    const hand = this.handRef
    if (!hand) {
      return []
    }

    return hand
      .list()
      .map((card) => card.state)
      .filter((state): state is State => state !== undefined)
  }

  bindHand(hand: Hand): void {
    this.handRef = hand
  }
}
