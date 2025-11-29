import type { State } from './State'
import type { Battle, DamageAnimationEvent } from '../battle/Battle'
import type { Hand } from '../battle/Hand'
import { MemoryManager } from './players/MemoryManager'
import type { Attack } from './Action'
import type { Damages } from './Damages'
import { instantiateRelic } from './relics/relicLibrary'

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
  // レリック由来のStateは元のStateとは別に計算するため、baseState集計ロジックを共通化する。

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

  takeDamage(amount: number, options?: { battle?: Battle; animation?: DamageAnimationEvent }): void {
    const damage = Math.max(0, Math.floor(amount))
    if (damage <= 0) {
      return
    }
    this.currentHpValue = Math.max(0, this.currentHpValue - damage)
    if (options?.battle && options.animation) {
      options.battle.recordDamageAnimation(options.animation)
    }
  }

  heal(amount: number): void {
    this.currentHpValue = Math.min(this.maxHpValue, this.currentHpValue + Math.max(0, Math.floor(amount)))
  }

  spendMana(cost: number, options?: { battle?: Battle }): void {
    if (cost > this.currentManaValue) {
      throw new Error('Not enough mana')
    }
    const normalizedCost = Math.max(0, Math.floor(cost))
    if (normalizedCost === 0) {
      return
    }
    this.currentManaValue -= normalizedCost
    if (options?.battle) {
      options.battle.recordManaAnimation({ amount: -normalizedCost })
    }
  }

  gainMana(amount: number, options?: { battle?: Battle; trackAnimation?: boolean }): void {
    const gain = Math.max(0, Math.floor(amount))
    if (gain <= 0) {
      return
    }
    this.currentManaValue = Math.min(this.maxManaValue, this.currentManaValue + gain)
    if (options?.battle && options.trackAnimation !== false) {
      options.battle.recordManaAnimation({ amount: gain })
    }
  }

  gainTemporaryMana(amount: number, options?: { battle?: Battle; trackAnimation?: boolean }): void {
    if (amount <= 0) {
      return
    }
    const gain = Math.floor(amount)
    this.currentManaValue += gain
    if (options?.battle && options.trackAnimation !== false) {
      options.battle.recordManaAnimation({ amount: gain })
    }
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

  addState(state: State, options?: { battle?: Battle; enemyId?: number }): void {
    const battle = options?.battle
    if (!battle) {
      return
    }

    if (!state.cardDefinitionBase) {
      return
    }

    const card = this.memoryManager.rememberState({
      state,
      repository: battle.cardRepository,
      battle,
    })
    battle.recordStateCardAnimation({
      stateId: state.id,
      stateName: state.name,
      cardId: card.id,
      cardIds: card.id !== undefined ? [card.id] : undefined,
      cardTitle: card.title,
      cardTitles: card.title ? [card.title] : state.name ? [state.name] : undefined,
      cardCount: card.id !== undefined ? 1 : undefined,
      enemyId: options?.enemyId,
    })
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

  /**
   * 手札由来のState（元のState）だけを返す。
   */
  getBaseStates(): State[] {
    const hand = this.handRef
    if (!hand) {
      return []
    }

    const states = hand
      .list()
      .map((card) => card.state)
      .filter((state): state is State => Boolean(state))

    return this.aggregateStates(states)
  }

  /**
   * レリック由来の追加Stateを計算する。
   */
  getRelicEffectStates(battle?: Battle): State[] {
    if (!battle) {
      return []
    }
    const relicStates: State[] = []
    for (const className of battle.getRelicClassNames()) {
      const relic = instantiateRelic(className)
      if (!relic) continue
      const active = relic.isActive({ battle, player: this })
      if (!active) continue
      const additional = relic.getAdditionalStates
        ? relic.getAdditionalStates({ battle, player: this })
        : []
      relicStates.push(...additional)
    }
    return this.aggregateStates(relicStates)
  }

  /**
   * 合計State（元のState + レリック付与）を返す。
   */
  getStates(battle?: Battle): State[] {
    const base = this.getBaseStates()
    if (!battle) {
      return base
    }
    const relicStates = this.getRelicEffectStates(battle)
    return this.aggregateStates([...base, ...relicStates])
  }

  /**
   * State配列をid単位でマージし、magnitudeを合算する。
   */
  private aggregateStates(states: State[]): State[] {
    const aggregates = new Map<string, { state: State; total: number }>()

    for (const state of states) {
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

  rememberEnemyAttack(damages: Damages, baseAttack: Attack, battle: Battle, options?: { enemyId?: number }): void {
    const card = this.memoryManager.rememberEnemyAttack({
      damages,
      baseAttack,
      repository: battle.cardRepository,
      battle,
    })
    battle.recordMemoryCardAnimation({
      // Attack にはユニークIDが存在しないため、演出用 stateId として攻撃名を使い、ビューが記憶元を識別できるようにする。
      stateId: baseAttack.name,
      stateName: baseAttack.name,
      cardId: card.id,
      cardIds: card.id !== undefined ? [card.id] : undefined,
      cardTitle: card.title,
      cardTitles: card.title ? [card.title] : baseAttack.name ? [baseAttack.name] : undefined,
      cardCount: card.id !== undefined ? 1 : undefined,
      enemyId: options?.enemyId,
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
