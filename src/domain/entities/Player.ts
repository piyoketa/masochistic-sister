import type { State } from './State'

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
  private readonly states: State[] = []

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

  resetMana(): void {
    this.currentManaValue = this.maxManaValue
  }

  addState(state: State): void {
    this.states.push(state)
  }

  removeState(stateId: string): void {
    const index = this.states.findIndex((state) => state.id === stateId)
    if (index >= 0) {
      this.states.splice(index, 1)
    }
  }

  getStates(): State[] {
    return [...this.states]
  }
}
