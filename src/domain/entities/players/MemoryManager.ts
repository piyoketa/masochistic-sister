/**
 * MemoryManager
 * =============
 * プレイヤーが受けた攻撃や付与された状態を「記憶カード」として生成し、バトルへ反映する責務を持つクラス。
 * - Attack の複製時には記憶タグを付与したカードを生成し、プレイヤーの手札へ追加する。
 * - State の場合はシンプルにカード化して手札へ加える。
 *
 * ここではカードID管理を行わず、CardRepository へ委譲する。生成後の手札追加も Battle に依頼する。
 */
import { Card, createStateActionFromState } from '../Card'
import { Attack } from '../Action'
import { Damages } from '../Damages'
import type { State } from '../State'
import { MemoryCardTag, NewlyCreatedCardTag } from '../cardTags'
import type { CardRepository } from '../../repository/CardRepository'
import type { Battle } from '../../battle/Battle'

interface RememberAttackParams {
  damages: Damages
  baseAttack: Attack
  repository: CardRepository
  battle: Battle
}

interface RememberStateParams {
  state: State
  repository: CardRepository
  battle: Battle
}

export class MemoryManager {
  rememberEnemyAttack(params: RememberAttackParams): Card {
    const { damages, baseAttack, repository, battle } = params
    const overrides = this.buildMemoryOverrides(baseAttack, damages)
    const action = baseAttack.cloneWithDamages(damages, overrides)
    const card = repository.create(() => new Card({ action }))
    battle.addCardToPlayerHand(card)
    return card
  }

  rememberState(params: RememberStateParams): Card {
    const { state, repository, battle } = params
    const stateAction = createStateActionFromState(state)
    const card = repository.create(() => new Card({ action: stateAction }))
    battle.addCardToPlayerHand(card)
    return card
  }

  private buildMemoryOverrides(baseAttack: Attack, damages: Damages) {
    const baseDefinition = baseAttack.createCardDefinition()
    const memoryTag = new MemoryCardTag()
    const newTag = new NewlyCreatedCardTag()
    if (baseDefinition.cardType !== 'attack') {
      throw new Error('Memory cards can only be created from attack definitions')
    }

    const baseCategoryTags = baseDefinition.categoryTags ?? []
    const categoryTags = [...baseCategoryTags, memoryTag, newTag]

    return {
      name: baseAttack.name,
      cardDefinition: {
        ...baseDefinition,
        title: baseDefinition.title ?? baseAttack.name,
        categoryTags,
      },
    }
  }
}
