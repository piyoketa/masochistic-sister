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

  takeDamage(amount: number): void {}

  heal(amount: number): void {}

  spendMana(cost: number): void {}

  gainMana(amount: number): void {}

  resetMana(): void {}

  addState(state: State): void {}

  removeState(stateId: string): void {}
}
