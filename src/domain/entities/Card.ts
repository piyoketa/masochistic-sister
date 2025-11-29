import type {
  Action,
  ActionContext,
  ActionAudioCue,
  ActionCutInCue,
  ActionCostContext,
} from './Action'
import type { CardTag } from './CardTag'
import { CardCategoryTag } from './CardTag'
import type { State } from './State'
import type { CardDefinition } from './CardDefinition'
import type { Battle } from '../battle/Battle'
import type { CardOperation } from './operations'

const RUNTIME_COST_KEY = Symbol('runtimeCostOverride')

export interface CardProps {
  action?: Action
  state?: State
  cardTags?: CardTag[]
  offensiveStates?: State[]
  defensiveStates?: State[]
  definitionOverrides?: Partial<CardDefinition>
}

export class Card {
  private idValue?: number
  private readonly actionRef?: Action
  private readonly stateRef?: State
  private readonly cardTagsValue?: CardTag[]
  private readonly offensiveStatesValue?: State[]
  private readonly defensiveStatesValue?: State[]
  private readonly definitionOverridesValue?: Partial<CardDefinition>
  private readonly definitionValue: CardDefinition
  private extraTags: CardTag[] = []
  private extraCategoryTags: CardCategoryTag[] = []

  constructor(props: CardProps) {
    if (!props.action && !props.state) {
      throw new Error('Card requires an action or a state reference')
    }

    this.actionRef = props.action
    this.stateRef = props.state
    this.cardTagsValue = props.cardTags
    this.offensiveStatesValue = props.offensiveStates
    this.defensiveStatesValue = props.defensiveStates
    this.definitionOverridesValue = props.definitionOverrides
    this.definitionValue = this.composeDefinition()
  }

  get id(): number | undefined {
    return this.idValue
  }

  assignId(id: number): void {
    if (this.idValue !== undefined && this.idValue !== id) {
      throw new Error(`Card already assigned to repository id ${this.idValue}`)
    }

    this.idValue = id
  }

  hasId(): boolean {
    return this.idValue !== undefined
  }

  get action(): Action | undefined {
    return this.actionRef
  }

  get state(): State | undefined {
    return this.stateRef
  }

  get effectTags(): CardTag[] | undefined {
    const collected: CardTag[] = []
    const append = (tag: CardTag) => {
      if (collected.every((existing) => existing.id !== tag.id)) {
        collected.push(tag)
      }
    }

    for (const tag of this.definition.effectTags ?? []) {
      append(tag)
    }

    for (const tag of this.cardTagsValue ?? []) {
      if (!(tag instanceof CardCategoryTag)) {
        append(tag)
      }
    }

    for (const tag of this.extraTags) {
      if (!(tag instanceof CardCategoryTag)) {
        append(tag)
      }
    }

    return collected.length > 0 ? [...collected] : undefined
  }

  get categoryTags(): CardCategoryTag[] | undefined {
    const collected: CardCategoryTag[] = []
    const append = (tag: CardCategoryTag) => {
      if (collected.every((existing) => existing.id !== tag.id)) {
        collected.push(tag)
      }
    }

    for (const tag of this.definition.categoryTags ?? []) {
      append(tag)
    }

    for (const tag of this.cardTagsValue ?? []) {
      if (tag instanceof CardCategoryTag) {
        append(tag)
      }
    }

    for (const tag of this.extraCategoryTags) {
      append(tag)
    }

    return collected.length > 0 ? [...collected] : undefined
  }

  get cardTags(): CardTag[] | undefined {
    const effect = this.effectTags ?? []
    const category = this.categoryTags ?? []
    if (effect.length === 0 && category.length === 0) {
      return undefined
    }
    return [...effect, ...category]
  }

  get offensiveStates(): State[] | undefined {
    return this.offensiveStatesValue
  }

  get defensiveStates(): State[] | undefined {
    return this.defensiveStatesValue
  }

  get definition(): CardDefinition {
    return this.definitionValue
  }

  get definitionOverrides(): Partial<CardDefinition> | undefined {
    return this.definitionOverridesValue
  }

  get title(): string {
    return this.definition.title
  }

  get type(): CardDefinition['cardType'] {
    return this.definition.cardType
  }

  get cost(): number {
    // バトル状況で計算済みのコストがある場合はそれを優先し、なければ定義コストを使う。
    // Symbolで持たせることでJSON比較時に表へ出ないようにする。
    const store = this as unknown as Record<symbol, number | undefined>
    return store[RUNTIME_COST_KEY] ?? this.definition.cost
  }

  get description(): string {
    // 描画時には定義ではなく参照しているAction/Stateから説明文を動的に生成する
    if (this.actionRef) {
      return this.actionRef.describe()
    }

    if (this.stateRef) {
      return this.stateRef.description()
    }

    return ''
  }

  get image(): string | undefined {
    return this.definition.image
  }

  /**
   * バトル文脈を踏まえた実コストを計算する。Action.cost に委譲し、酩酊などの補正を今後追加しやすくする。
   */
  calculateCost(context?: ActionCostContext): number {
    if (this.actionRef) {
      return this.actionRef.cost({
        ...context,
        cardTags: context?.cardTags ?? this.cardTags ?? [],
      })
    }
    return this.definition.cost
  }

  setRuntimeCost(cost: number | undefined): void {
    const store = this as unknown as Record<symbol, number | undefined>
    store[RUNTIME_COST_KEY] = cost
  }

  play(battle: Battle, operations: CardOperation[] = []): void {
    const action = this.actionRef
    if (!action) {
      const state = this.stateRef
      if (!state) {
        throw new Error('Card cannot be played without an action')
      }

      battle.player.spendMana(this.cost, { battle })
      battle.player.removeState(state.id)
      battle.exilePile.add(this)
      battle.recordPlayCardAnimationContext({ cardId: this.id })
      return
    }

    // 戦闘状況に応じたコストを算出し、支払いと表示に反映する
    const resolvedCost = this.calculateCost({
      battle,
      source: battle.player,
      cardTags: this.cardTags ?? [],
    })
    this.setRuntimeCost(resolvedCost)

    const context: ActionContext = action.prepareContext({
      battle,
      source: battle.player,
      operations,
    })
    if (!context.metadata) {
      context.metadata = {}
    }
    if (this.id !== undefined) {
      context.metadata.cardId = this.id
    }
    context.metadata.cardTags = (this.cardTags ?? []).map((tag) => tag.id)

    battle.player.spendMana(resolvedCost, { battle })
    battle.hand.remove(this)

    action.execute(context)

    battle.recordPlayCardAnimationContext({
      cardId: this.id,
      audio: this.extractAudioCueFromContext(context),
      cutin: this.extractCutInCueFromContext(context),
      cardTags: Array.isArray(context.metadata.cardTags)
        ? [...(context.metadata.cardTags as string[])]
        : undefined,
    })

    this.moveToNextZone(battle)
  }

  private extractAudioCueFromContext(context: ActionContext): ActionAudioCue | undefined {
    const metadata = context.metadata
    if (!metadata || typeof metadata !== 'object') {
      return undefined
    }
    const candidate = (metadata as { audio?: ActionAudioCue | undefined }).audio
    if (!candidate || typeof candidate.soundId !== 'string') {
      return undefined
    }
    return {
      soundId: candidate.soundId,
      waitMs: typeof candidate.waitMs === 'number' ? candidate.waitMs : undefined,
      durationMs: typeof candidate.durationMs === 'number' ? candidate.durationMs : undefined,
    }
  }

  private extractCutInCueFromContext(context: ActionContext): ActionCutInCue | undefined {
    const metadata = context.metadata
    if (!metadata || typeof metadata !== 'object') {
      return undefined
    }
    const candidate = (metadata as { cutin?: ActionCutInCue | undefined }).cutin
    if (!candidate || typeof candidate.src !== 'string' || candidate.src.length === 0) {
      return undefined
    }
    return {
      src: candidate.src,
      waitMs: typeof candidate.waitMs === 'number' ? candidate.waitMs : undefined,
      durationMs: typeof candidate.durationMs === 'number' ? candidate.durationMs : undefined,
    }
  }

  copyWith(overrides: Partial<CardProps>): Card {
    return new Card({
      action: overrides.action ?? this.actionRef,
      state: overrides.state ?? this.stateRef,
      cardTags: overrides.cardTags ?? this.cardTagsValue,
      offensiveStates: overrides.offensiveStates ?? this.offensiveStatesValue,
      defensiveStates: overrides.defensiveStates ?? this.defensiveStatesValue,
      definitionOverrides: overrides.definitionOverrides ?? this.definitionOverridesValue,
    })
  }

  addTemporaryTag(tag: CardTag): void {
    if (tag instanceof CardCategoryTag) {
      if (this.extraCategoryTags.some((entry) => entry.id === tag.id)) {
        return
      }
      this.extraCategoryTags = [...this.extraCategoryTags, tag]
      return
    }

    if (this.extraTags.some((entry) => entry.id === tag.id)) {
      return
    }
    this.extraTags = [...this.extraTags, tag]
  }

  removeTemporaryTag(tagId: string): void {
    if (this.extraTags.length > 0) {
      this.extraTags = this.extraTags.filter((tag) => tag.id !== tagId)
    }
    if (this.extraCategoryTags.length > 0) {
      this.extraCategoryTags = this.extraCategoryTags.filter((tag) => tag.id !== tagId)
    }
  }

  hasTag(tagId: string): boolean {
    return (this.cardTags ?? []).some((tag) => tag.id === tagId)
  }

  private moveToNextZone(battle: Battle): void {
    const cardTags = this.cardTags ?? []
    const isExhaust = cardTags.some((tag) => tag.id === 'tag-exhaust')

    if (isExhaust) {
      battle.exilePile.add(this)
      if (this.id !== undefined) {
        battle.recordCardTrashAnimation({
          cardIds: [this.id],
          cardTitles: [this.title],
          variant: 'eliminate',
        })
      }
    } else {
      battle.discardPile.add(this)
      if (this.id !== undefined) {
        battle.recordCardTrashAnimation({
          cardIds: [this.id],
          cardTitles: [this.title],
          variant: 'trash',
        })
      }
    }
  }

  private composeDefinition(): CardDefinition {
    const baseDefinition = this.actionRef
      ? this.actionRef.createCardDefinition()
      : this.stateRef!.createCardDefinition()
    const overrides = this.definitionOverridesValue

    if (!overrides) {
      return {
        ...baseDefinition,
        effectTags: baseDefinition.effectTags ? [...baseDefinition.effectTags] : undefined,
        categoryTags: baseDefinition.categoryTags ? [...baseDefinition.categoryTags] : undefined,
      }
    }

    if (overrides.cardType && overrides.cardType !== baseDefinition.cardType) {
      throw new Error('Card definition overrides cannot change cardType')
    }

    if (overrides.type && overrides.type !== baseDefinition.type) {
      throw new Error('Card definition overrides cannot change type tag')
    }

    if ('target' in overrides && overrides.target !== undefined && overrides.target !== baseDefinition.target) {
      throw new Error('Card definition overrides cannot change target tag')
    }

    const effectTags =
      overrides.effectTags !== undefined
        ? [...overrides.effectTags]
        : baseDefinition.effectTags
        ? [...baseDefinition.effectTags]
        : undefined

    const categoryTags =
      overrides.categoryTags !== undefined
        ? [...overrides.categoryTags]
        : baseDefinition.categoryTags
        ? [...baseDefinition.categoryTags]
        : undefined

    const {
      cardType,
      type,
      target,
      effectTags: _ignoredEffect,
      categoryTags: _ignoredCategory,
      ...rest
    } = overrides

    if (baseDefinition.cardType === 'status') {
      return {
        ...baseDefinition,
        ...rest,
        cardType: 'status',
        type: baseDefinition.type,
        effectTags,
        categoryTags,
      }
    }

    if (baseDefinition.cardType === 'attack') {
      const attackTarget = baseDefinition.target
      if (!attackTarget) {
        throw new Error('Attack definition missing target tag')
      }
      return {
        ...baseDefinition,
        ...rest,
        cardType: 'attack',
        type: baseDefinition.type,
        effectTags,
        categoryTags,
        target: attackTarget,
      }
    }

    const skillTarget = baseDefinition.target
    if (!skillTarget) {
      throw new Error('Skill definition missing target tag')
    }
    return {
      ...baseDefinition,
      ...rest,
      cardType: 'skill',
      type: baseDefinition.type,
      effectTags,
      categoryTags,
      target: skillTarget,
    }
  }
}
