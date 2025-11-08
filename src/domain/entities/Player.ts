import type { State } from './State'
import type { Battle } from '../battle/Battle'
import type { Hand } from '../battle/Hand'
import { MemoryManager } from './players/MemoryManager'
import type { Attack } from './Action'
import type { Damages } from './Damages'

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
  private readonly memoryManager: MemoryManager

  constructor(props: PlayerProps) {
    this.idValue = props.id
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.maxManaValue = props.maxMana
    this.currentHpValue = props.currentHp
    this.currentManaValue = props.currentMana
    this.memoryManager = new MemoryManager()
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

  setCurrentHp(value: number): void {
    this.currentHpValue = Math.max(0, Math.min(this.maxHpValue, Math.floor(value)))
  }

  setCurrentMana(value: number): void {
    this.currentManaValue = Math.max(0, Math.min(this.maxManaValue, Math.floor(value)))
  }

  addState(state: State, options?: { battle?: Battle }): void {
    const battle = options?.battle
    if (battle && state.cardDefinitionBase) {
      this.memoryManager.rememberState({
        state,
        repository: battle.cardRepository,
        battle,
      })
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

    const aggregates = new Map<string, { state: State; total: number }>()

    for (const card of hand.list()) {
      const state = card.state
      if (!state) {
        continue
      }

      const entry = aggregates.get(state.id)
      const magnitude = state.magnitude ?? 0

      if (entry) {
        entry.total += magnitude
        setStateMagnitude(entry.state, entry.total)
      } else {
        const clone = cloneState(state)
        setStateMagnitude(clone, magnitude)
        aggregates.set(state.id, { state: clone, total: magnitude })
      }
    }

    return Array.from(aggregates.values()).map(({ state }) => state)
  }

  bindHand(hand: Hand): void {
    this.handRef = hand
  }

  rememberEnemyAttack(damages: Damages, baseAttack: Attack, battle: Battle): void {
    this.memoryManager.rememberEnemyAttack({
      damages,
      baseAttack,
      repository: battle.cardRepository,
      battle,
    })
  }
}

function cloneState(state: State): State {
  const clone = Object.create(Object.getPrototypeOf(state)) as State
  Object.assign(clone, state)
  const props = { ...((state as unknown as { props: Record<string, unknown> }).props) }
  ;(clone as unknown as { props: Record<string, unknown> }).props = props
  return clone
}

function setStateMagnitude(state: State, magnitude: number): void {
  ;((state as unknown as { props: { magnitude?: number } }).props).magnitude = magnitude
}
