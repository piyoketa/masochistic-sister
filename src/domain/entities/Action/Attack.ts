/*
Attack.ts の責務:
- 攻撃アクション共通のロジック（ヒット前/後のダメージ計算、追加状態付与、ターゲット操作）を実装し、派生クラスへ共通土台を提供する。
- 攻撃カードの複製（記憶カード化）や、演出に必要な `DamageOutcome` 配列の生成までを担い、UI 表示やログ出力の基礎データを準備する。

責務ではないこと:
- 与ダメージ後のログ出力や敵行動の予約管理など、バトル全体のフロー制御。
- 各 State 個別のダメージ調整アルゴリズム（State 側のフックで拡張する）や、ビュー層での表示整形。

主要な通信相手とインターフェース:
- `ActionBase.ts` の `Action`: 基底クラスとしてカード定義やコンテキスト準備を提供し、攻撃固有処理をオーバーライドする。
- `Damages`: 攻撃プロファイルを表現する値オブジェクト。pre-hit 計算結果と post-hit `DamageOutcome[]` を保持させる。
- `TargetEnemyOperation`: 攻撃対象の選択を要求する Operation。敵行動（プレイヤーが対象）時には省略できるよう `shouldRequireOperation` を調整する。
- `Player.rememberEnemyAttack`: プレイヤーが被弾した攻撃を「記憶カード」として生成する。post-hit 結果を保持した `Damages` を渡す。
*/
import type { Battle } from '../../battle/Battle'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import type { State } from '../State'
import type { Relic } from '../relics'
import { Damages, type DamageEffectType, type DamageOutcome } from '../Damages'
import type { DamageEvent } from '../../battle/Battle'
import {
  TargetEnemyOperation,
  type CardOperation,
  type Operation,
} from '../operations'
import type { ActionContext, ActionType, BaseActionProps } from './ActionBase'
import { Action } from './ActionBase'
import { isEnemyEntity, isPlayerEntity } from '../typeGuards'
import type { CardDefinition } from '../CardDefinition'

export interface AttackProps extends BaseActionProps {
  baseDamage: Damages
  inflictStates?: Array<() => State>
  effectType?: DamageEffectType
}

export abstract class Attack extends Action {
  protected readonly baseProfile: Damages
  protected readonly effectType: DamageEffectType
  private readonly inflictStateFactories: Array<() => State>

  protected constructor(props: AttackProps) {
    super(props)
    this.baseProfile = props.baseDamage
    this.effectType = props.effectType ?? 'slash'
    this.inflictStateFactories = props.inflictStates ? [...props.inflictStates] : []
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
      cardDefinition: mergeCardDefinition(
        currentProps.cardDefinition,
        overrides?.cardDefinition,
      ),
    }

    Object.assign(clone, this)
    ;(clone as unknown as { baseProfile: Damages }).baseProfile = new Damages({
      baseAmount: damages.amount,
      baseCount: damages.count,
      type: damages.type,
      cardId: damages.cardId,
    })
    ;(clone as unknown as { props: BaseActionProps }).props = mergedProps

    return clone
  }

  protected override perform(context: ActionContext): void {
    const isPlayerSource = isPlayerEntity(context.source)
    const target = context.target ?? this.resolveTarget(context)
    const defender = target ?? (isPlayerSource ? undefined : context.battle.player)
    if (!defender) {
      throw new Error('Attack target is not resolved')
    }

    this.beforeAttack(context, defender)

    const damages = this.calcDamages(context.source, defender, context.battle)
    const baseOutcomes = this.initializeOutcomes(damages)
    // Stateとレリックのポストヒット修正を適用し、レリックの発火だけを戻り値で把握する
    const postHitRelicEffects = this.applyPostHitModifiers({
      battle: context.battle,
      attacker: context.source,
      defender,
      damages,
      outcomes: baseOutcomes,
    })
    const resolvedOutcomes = this.truncateOutcomesByDefenderHp(defender, baseOutcomes)
    damages.setOutcomes(resolvedOutcomes)
    const totalDamage = damages.totalPostHitDamage
    const shouldDrain = this.hasDrainEffect(context)
    const damageEvent: DamageEvent | undefined = resolvedOutcomes.length
      ? {
          actionId: damages.cardId,
          attacker: this.isPlayer(context.source)
            ? { type: 'player' }
            : { type: 'enemy', enemyId: context.source.id ?? -1 },
          defender: this.isPlayer(defender)
            ? { type: 'player' }
            : { type: 'enemy', enemyId: defender.id ?? -1 },
          outcomes: resolvedOutcomes.map((outcome) => ({ ...outcome })),
          effectType: this.effectType,
        }
      : undefined

    if (damageEvent) {
      if (this.isPlayer(defender)) {
        context.battle.damagePlayer(damageEvent)
      } else {
        context.battle.damageEnemy(defender, damageEvent)
      }
    }
    if (shouldDrain) {
      this.applyDrainHeal({
        battle: context.battle,
        source: context.source,
        amount: totalDamage,
      })
    }

    this.invokePostSequenceHooks({
      battle: context.battle,
      attacker: context.source,
      defender,
      damages,
      outcomes: damages.outcomes,
      attackerRelicEffects: postHitRelicEffects.attackerRelicEffects,
      defenderRelicEffects: postHitRelicEffects.defenderRelicEffects,
    })

    this.applyInflictedStates(context, defender)
    this.onAfterDamage(context, damages, defender)

    if (this.isPlayer(defender)) {
      const rememberedEnemyId = isEnemyEntity(context.source) ? context.source.id : undefined
      defender.rememberEnemyAttack(damages, this, context.battle, {
        enemyId: typeof rememberedEnemyId === 'number' ? rememberedEnemyId : undefined,
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected beforeAttack(_context: ActionContext, _defender: Player | Enemy): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onAfterDamage(_context: ActionContext, _damages: Damages, _defender: Player | Enemy): void {}

  calcDamages(attacker: Player | Enemy, defender: Player | Enemy, battle?: Battle): Damages {
    const cardId = this.getCardId()
    return new Damages({
      baseAmount: this.baseProfile.baseAmount,
      baseCount: this.baseProfile.baseCount,
      type: this.baseProfile.type,
      cardId,
      attackerStates: this.collectStates(attacker, battle),
      defenderStates: this.collectStates(defender, battle),
      context: battle
        ? {
            battle,
            attack: this,
            attacker,
            defender,
            cardId,
          }
        : undefined,
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

  private collectStates(entity: Player | Enemy, battle?: Battle): State[] {
    if ('getStates' in entity && typeof entity.getStates === 'function') {
      // Player はバトル情報があるとレリック付与状態を考慮できる
      return [...(entity as Player | Enemy).getStates(battle as Battle | undefined)]
    }

    return []
  }

  get inflictStatePreviews(): State[] {
    return this.inflictStateFactories.map((factory) => factory())
  }

  private applyInflictedStates(context: ActionContext, defender: Player | Enemy): void {
    if (this.inflictStateFactories.length === 0) {
      return
    }

    for (const factory of this.inflictStateFactories) {
      const state = factory()
      if (!this.canInflictState(context, defender, state)) {
        continue
      }

      defender.addState(state, { battle: context.battle })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected canInflictState(_context: ActionContext, _defender: Player | Enemy, _state: State): boolean {
    return true
  }

  private initializeOutcomes(damages: Damages): DamageOutcome[] {
    return Array.from({ length: damages.count }, () => ({
      damage: damages.amount,
      effectType: this.effectType,
    }))
  }

  private applyPostHitModifiers(params: {
    battle: Battle
    attacker: Player | Enemy
    defender: Player | Enemy
    damages: Damages
    outcomes: DamageOutcome[]
  }): { attackerRelicEffects: Set<Relic>; defenderRelicEffects: Set<Relic> } {
    const attackerStates = this.collectStates(params.attacker, params.battle)
    const defenderStates = this.collectStates(params.defender, params.battle)
    const relics = params.battle
      .getRelicInstances()
      .filter((relic) => relic.isActive({ battle: params.battle, player: params.battle.player }))
    const attackerRelicEffects = new Set<Relic>()
    const defenderRelicEffects = new Set<Relic>()

    for (let index = 0; index < params.outcomes.length; index += 1) {
      const outcome = params.outcomes[index]!
      this.applyPostHitForStates({
        states: attackerStates,
        battle: params.battle,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        outcome,
        index,
        role: 'attacker',
      })
      this.applyPostHitForStates({
        states: defenderStates,
        battle: params.battle,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        outcome,
        index,
        role: 'defender',
      })

      this.applyPostHitForRelics({
        relics,
        battle: params.battle,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        outcome,
        index,
        role: 'attacker',
        recorded: attackerRelicEffects,
      })
      this.applyPostHitForRelics({
        relics,
        battle: params.battle,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        outcome,
        index,
        role: 'defender',
        recorded: defenderRelicEffects,
      })
    }
    return { attackerRelicEffects, defenderRelicEffects }
  }

  private applyPostHitForStates(params: {
    states: State[]
    battle: Battle
    attacker: Player | Enemy
    defender: Player | Enemy
    damages: Damages
    outcome: DamageOutcome
    index: number
    role: 'attacker' | 'defender'
  }): void {
    for (const state of params.states) {
      if (!state.isPostHitModifier()) {
        continue
      }

      const beforeDamage = params.outcome.damage
      const beforeEffect = params.outcome.effectType
      const reacted = state.onHitResolved({
        battle: params.battle,
        attack: this,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        index: params.index,
        outcome: params.outcome,
        role: params.role,
      })

      if (
        reacted ||
        beforeDamage !== params.outcome.damage ||
        beforeEffect !== params.outcome.effectType
      ) {
        params.damages.registerPostHitState(params.role, state)
      }
    }
  }

  private applyPostHitForRelics(params: {
    relics: Relic[]
    battle: Battle
    attacker: Player | Enemy
    defender: Player | Enemy
    damages: Damages
    outcome: DamageOutcome
    index: number
    role: 'attacker' | 'defender'
    recorded: Set<Relic>
  }): void {
    for (const relic of params.relics) {
      if (!relic.isPostHitModifier()) {
        continue
      }

      const beforeDamage = params.outcome.damage
      const beforeEffect = params.outcome.effectType
      const reacted = relic.onHitResolved({
        battle: params.battle,
        attack: this,
        attacker: params.attacker,
        defender: params.defender,
        damages: params.damages,
        index: params.index,
        outcome: params.outcome,
        role: params.role,
      })

      if (
        reacted ||
        beforeDamage !== params.outcome.damage ||
        beforeEffect !== params.outcome.effectType
      ) {
        params.recorded.add(relic)
      }
    }
  }

  private truncateOutcomesByDefenderHp(defender: Player | Enemy, outcomes: DamageOutcome[]): DamageOutcome[] {
    let remainingHp = this.getCurrentHp(defender)
    if (remainingHp <= 0) {
      return []
    }

    const result: DamageOutcome[] = []
    for (const outcome of outcomes) {
      if (remainingHp <= 0) {
        break
      }

      const appliedDamage = Math.min(outcome.damage, remainingHp)
      result.push({
        damage: appliedDamage,
        effectType: outcome.effectType,
      })
      remainingHp -= appliedDamage

      if (outcome.damage <= 0) {
        continue
      }
    }

    return result
  }

  private getCurrentHp(entity: Player | Enemy): number {
    if (this.isPlayer(entity)) {
      return entity.currentHp
    }
    return entity.currentHp
  }

  private invokePostSequenceHooks(params: {
    battle: Battle
    attacker: Player | Enemy
    defender: Player | Enemy
    damages: Damages
    outcomes: readonly DamageOutcome[]
    attackerRelicEffects: Set<Relic>
    defenderRelicEffects: Set<Relic>
  }): void {
    const context = {
      battle: params.battle,
      attack: this,
      attacker: params.attacker,
      defender: params.defender,
      damages: params.damages,
      outcomes: params.outcomes,
    }

    for (const state of this.resolvePostHitStates(params.attacker, params.damages.postHitAttackerStateEffects)) {
      state.onDamageSequenceResolved(context)
    }

    for (const state of this.resolvePostHitStates(params.defender, params.damages.postHitDefenderStateEffects)) {
      state.onDamageSequenceResolved(context)
    }

    for (const relic of this.resolvePostHitRelics(params.attackerRelicEffects, params.battle)) {
      relic.onDamageSequenceResolved(context)
    }

    for (const relic of this.resolvePostHitRelics(params.defenderRelicEffects, params.battle)) {
      relic.onDamageSequenceResolved(context)
    }
  }

  private resolvePostHitStates(entity: Player | Enemy, recorded: readonly State[]): State[] {
    if (recorded.length > 0) {
      return Array.from(recorded)
    }

    return this.collectStates(entity).filter((state) => state.isPostHitModifier())
  }

  private resolvePostHitRelics(recorded: Set<Relic>, battle: Battle): Relic[] {
    if (recorded.size > 0) {
      return Array.from(recorded)
    }
    return battle
      .getRelicInstances()
      .filter((relic) => relic.isPostHitModifier() && relic.isActive({ battle, player: battle.player }))
  }

  private hasDrainEffect(context: ActionContext): boolean {
    const tags = context.metadata?.cardTags
    if (Array.isArray(tags)) {
      return tags.includes('tag-drain')
    }
    const definitionTags = this.cardDefinitionBase.effectTags ?? []
    return definitionTags.some((tag) => tag.id === 'tag-drain')
  }

  private applyDrainHeal(params: { battle: Battle; source: Player | Enemy; amount: number }): void {
    const amount = Math.max(0, Math.floor(params.amount))
    if (amount <= 0) {
      return
    }

    const source = params.source
    if (this.isPlayer(source)) {
      source.heal(amount)
      return
    }

    source.heal(amount)
  }

  describeForPlayerCard(options?: PlayerAttackDescriptionOptions): PlayerAttackDescription {
    const inflictedStates = options?.inflictedStates ?? this.inflictStatePreviews
    const segments: PlayerAttackDescription['segments'] = []

    for (const [index, state] of inflictedStates.entries()) {
      if (index > 0) {
        segments.push({ text: '\n' })
      }
      const stackable =
        typeof state.isStackable === 'function' ? state.isStackable() : state.magnitude !== undefined
      const magnitude = stackable ? `(${state.magnitude ?? 0}点)` : ''
      const description = state.description?.() ?? ''
      segments.push({
        text: `🌀${state.name}${magnitude}`,
        tooltip: description || undefined,
      })
    }

    const label = segments.map((segment) => segment.text).join('')
    return { label, segments }
  }
}

function mergeCardDefinition(
  base: CardDefinition,
  overrides?: Partial<CardDefinition>,
): CardDefinition {
  if (!overrides) {
    return {
      ...base,
      effectTags: base.effectTags ? [...base.effectTags] : undefined,
      categoryTags: base.categoryTags ? [...base.categoryTags] : undefined,
    }
  }

  if (overrides.cardType && overrides.cardType !== base.cardType) {
    throw new Error('Card definition overrides cannot change cardType')
  }

  if (overrides.type && overrides.type !== base.type) {
    throw new Error('Card definition overrides cannot change type tag')
  }

  if ('target' in overrides && overrides.target !== undefined && overrides.target !== base.target) {
    throw new Error('Card definition overrides cannot change target tag')
  }

  const effectTags =
    overrides.effectTags !== undefined
      ? [...overrides.effectTags]
      : base.effectTags
      ? [...base.effectTags]
      : undefined

  const categoryTags =
    overrides.categoryTags !== undefined
      ? [...overrides.categoryTags]
      : base.categoryTags
      ? [...base.categoryTags]
      : undefined

  const {
    cardType,
    type,
    target,
    effectTags: _ignoredEffect,
    categoryTags: _ignoredCategory,
    ...rest
  } = overrides

  if (base.cardType === 'status') {
    return {
      ...base,
      ...rest,
      cardType: 'status',
      type: base.type,
      effectTags,
      categoryTags,
    }
  }

  if (base.cardType === 'attack') {
    const target = base.target
    if (!target) {
      throw new Error('Attack definition missing target tag')
    }
    return {
      ...base,
      ...rest,
      cardType: 'attack',
      type: base.type,
      effectTags,
      categoryTags,
      target,
    }
  }

  const skillTarget = base.target
  if (!skillTarget) {
    throw new Error('Skill definition missing target tag')
  }
  return {
    ...base,
      ...rest,
      cardType: 'skill',
      type: base.type,
      effectTags,
      categoryTags,
      target: skillTarget,
  }
}

export interface PlayerAttackDescriptionOptions {
  baseDamages?: Damages
  displayDamages?: Damages
  inflictedStates?: State[]
}

export interface PlayerAttackDescription {
  label: string
  segments: Array<{ text: string; highlighted?: boolean; tooltip?: string }>
}
