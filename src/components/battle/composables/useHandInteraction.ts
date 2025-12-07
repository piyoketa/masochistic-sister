import { ref } from 'vue'
import {
  TargetEnemyOperation,
  SelectHandCardOperation,
  type CardOperation,
  type TargetEnemyAvailabilityEntry,
  type OperationContext,
} from '@/domain/entities/operations'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import type { HandEntry } from './useHandPresentation'

export interface HandSelectionRequest {
  allowedIds: Set<number>
  blockedReasons: Map<number, string>
  message: string
  resolve: (cardId: number) => void
  reject: (error: Error) => void
}

export interface UseHandInteractionOptions {
  props: {
    isPlayerTurn: boolean
    isInputLocked: boolean
    requestEnemyTarget: (theme: EnemySelectionTheme) => Promise<number>
    cancelEnemySelection: () => void
  }
  emit: {
    (event: 'play-card', payload: { cardId: number; operations: CardOperation[] }): void
    (event: 'update-footer', message: string): void
    (event: 'reset-footer'): void
    (event: 'error', message: string): void
    (event: 'hide-overlay'): void
    (event: 'show-enemy-selection-hints', hints: TargetEnemyAvailabilityEntry[]): void
    (event: 'clear-enemy-selection-hints'): void
  }
  interactionState: {
    selectedCardKey: string | null
    selectedCardId: number | null
    isAwaitingEnemy: boolean
    selectionTheme: EnemySelectionTheme
  }
  buildOperationContext: () => OperationContext | null
}

const supportedOperations = new Set<string>([
  TargetEnemyOperation.TYPE,
  SelectHandCardOperation.TYPE,
])

export function useHandInteraction(options: UseHandInteractionOptions) {
  const hoveredCardKey = ref<string | null>(null)
  const handSelectionRequest = ref<HandSelectionRequest | null>(null)

  function isCardDisabled(entry: HandEntry): boolean {
    const request = handSelectionRequest.value
    if (request) {
      if (entry.id === undefined) {
        return true
      }
      return !request.allowedIds.has(entry.id)
    }
    if (options.props.isInputLocked) {
      return true
    }
    if (entry.disabled) {
      return true
    }
    if (!options.props.isPlayerTurn) {
      return true
    }
    if (!entry.affordable) {
      return true
    }
    if (options.interactionState.isAwaitingEnemy) {
      return options.interactionState.selectedCardKey !== entry.key
    }
    return false
  }

  function handleCardHoverStart(entry: HandEntry): void {
    if (options.interactionState.isAwaitingEnemy || handSelectionRequest.value) {
      return
    }
    hoveredCardKey.value = entry.key
    options.emit('update-footer', '左クリック：使用　右クリック：詳細')
  }

  function handleCardHoverEnd(): void {
    if (options.interactionState.isAwaitingEnemy || handSelectionRequest.value) {
      return
    }
    hoveredCardKey.value = null
    options.emit('reset-footer')
  }

  async function handleCardClick(entry: HandEntry): Promise<void> {
    if (isCardDisabled(entry)) {
      return
    }
    if (handSelectionRequest.value) {
      handleHandSelectionClick(entry)
      return
    }
    if (options.props.isInputLocked || !options.props.isPlayerTurn || !entry.affordable) {
      return
    }

    if (options.interactionState.isAwaitingEnemy && options.interactionState.selectedCardKey !== entry.key) {
      return
    }

    if (entry.id === undefined) {
      options.emit('error', 'カードにIDが割り当てられていません')
      return
    }

    options.interactionState.selectedCardKey = entry.key
    options.interactionState.selectedCardId = entry.id
    options.interactionState.selectionTheme = deriveEnemySelectionTheme(entry)

    if (entry.operations.length === 0) {
      options.emit('play-card', { cardId: entry.id, operations: [] })
      resetSelection()
      return
    }

    const unsupported = entry.operations.filter((operation) => !supportedOperations.has(operation))
    if (unsupported.length > 0) {
      options.emit(
        'error',
        `未対応の操作が含まれているため、このカードは使用できません (${unsupported.join(', ')})`,
      )
      resetSelection()
      options.emit('hide-overlay')
      return
    }

    try {
      await executeOperations(entry)
    } catch (error) {
      if (error instanceof Error) {
        options.emit('error', error.message)
      } else {
        options.emit('error', String(error))
      }
      resetSelection()
    }
  }

  function handleHandSelectionClick(entry: HandEntry): void {
    const request = handSelectionRequest.value
    if (!request) {
      return
    }
    if (entry.id === undefined) {
      options.emit('error', 'カードにIDが割り当てられていません')
      return
    }
    if (!request.allowedIds.has(entry.id)) {
      const reason = request.blockedReasons.get(entry.id) ?? 'このカードは選択できません'
      options.emit('error', reason)
      return
    }
    request.resolve(entry.id)
  }

  async function executeOperations(entry: HandEntry): Promise<void> {
    const collectedOperations: CardOperation[] = []

    for (const operationType of entry.operations) {
      if (operationType === TargetEnemyOperation.TYPE) {
        options.interactionState.isAwaitingEnemy = true
        const hints = gatherEnemySelectionHints(entry)
        if (hints.length > 0) {
          options.emit('show-enemy-selection-hints', hints)
        }
        options.emit('update-footer', '対象の敵を選択：左クリックで決定　右クリックでキャンセル')
        try {
          const enemyId = await options.props.requestEnemyTarget(options.interactionState.selectionTheme)
          collectedOperations.push({
            type: TargetEnemyOperation.TYPE,
            payload: enemyId,
          })
        } finally {
          options.interactionState.isAwaitingEnemy = false
          options.interactionState.selectionTheme = 'default'
          options.emit('reset-footer')
          options.emit('clear-enemy-selection-hints')
        }
        continue
      }
      if (operationType === SelectHandCardOperation.TYPE) {
        const targetCardId = await requestHandCardSelection(entry)
        collectedOperations.push({
          type: SelectHandCardOperation.TYPE,
          payload: targetCardId,
        })
        continue
      }

      throw new Error(`未対応の操作 ${operationType} です`)
    }

    const cardId = options.interactionState.selectedCardId
    if (cardId === null) {
      throw new Error('カード使用に必要な情報が不足しています')
    }

    options.emit('play-card', { cardId, operations: collectedOperations })
    resetSelection({ keepSelection: false })
  }

  function resetSelection(optionsArg?: { keepSelection?: boolean }): void {
    options.interactionState.isAwaitingEnemy = false
    options.interactionState.selectionTheme = 'default'
    if (!optionsArg?.keepSelection) {
      options.interactionState.selectedCardKey = null
      options.interactionState.selectedCardId = null
    }
    hoveredCardKey.value = null
    options.emit('reset-footer')
    options.emit('hide-overlay')
    cancelHandSelectionRequest()
  }

  function cancelSelection(): void {
    if (options.interactionState.isAwaitingEnemy) {
      options.props.cancelEnemySelection()
    }
    resetSelection()
  }

  function deriveEnemySelectionTheme(entry: HandEntry): EnemySelectionTheme {
    const tags = entry.card.categoryTags ?? []
    const hasTag = (tagId: string) => tags.some((tag) => tag.id === tagId)
    if (hasTag('tag-arcane')) {
      return 'arcane'
    }
    if (hasTag('tag-sacred')) {
      return 'sacred'
    }
    return 'default'
  }

  function gatherEnemySelectionHints(entry: HandEntry): TargetEnemyAvailabilityEntry[] {
    const action = entry.card.action
    const context = options.buildOperationContext()
    if (!action || !context) {
      return []
    }
    return action.describeTargetEnemyAvailability(context)
  }

  async function requestHandCardSelection(entry: HandEntry): Promise<number> {
    const action = entry.card.action
    const context = options.buildOperationContext()
    if (!action || !context) {
      throw new Error('カード選択を開始できませんでした')
    }
    const availability = action.describeHandSelectionAvailability(context)
    if (availability.length === 0) {
      throw new Error('選択可能なカードが見つかりません')
    }
    const selectable = availability.filter((item) => item.selectable)
    if (selectable.length === 0) {
      throw new Error('条件を満たすカードが手札に存在しません')
    }
    const allowedIds = new Set(selectable.map((item) => item.cardId))
    const blockedReasons = new Map<number, string>()
    availability.forEach((item) => {
      if (!item.selectable && item.reason && typeof item.cardId === 'number') {
        blockedReasons.set(item.cardId, item.reason)
      }
    })

    return new Promise<number>((resolve, reject) => {
      handSelectionRequest.value = {
        allowedIds,
        blockedReasons,
        message: '対象カードを選択：左クリックで決定　右クリックでキャンセル',
        resolve: (cardId: number) => {
          handSelectionRequest.value = null
          options.emit('reset-footer')
          resolve(cardId)
        },
        reject: (error: Error) => {
          handSelectionRequest.value = null
          options.emit('reset-footer')
          reject(error)
        },
      }
      options.emit('update-footer', handSelectionRequest.value.message)
    })
  }

  function cancelHandSelectionRequest(reason?: string): void {
    const request = handSelectionRequest.value
    if (!request) {
      return
    }
    handSelectionRequest.value = null
    request.reject(new Error(reason ?? 'カード選択がキャンセルされました'))
  }

  function isHandSelectionCandidate(entry: HandEntry): boolean {
    const request = handSelectionRequest.value
    if (!request || entry.id === undefined) {
      return false
    }
    return request.allowedIds.has(entry.id)
  }

  function handSelectionBlockedReason(entry: HandEntry): string | undefined {
    const request = handSelectionRequest.value
    if (!request || entry.id === undefined) {
      return undefined
    }
    return request.blockedReasons.get(entry.id)
  }

  function selectionWrapperClass(entry: HandEntry): string | undefined {
    const request = handSelectionRequest.value
    if (!request || entry.id === undefined) {
      return undefined
    }
    return request.allowedIds.has(entry.id)
      ? 'hand-card-wrapper--selection-candidate'
      : 'hand-card-wrapper--selection-blocked'
  }

  function handleHandContextMenu(event: MouseEvent): void {
    if (!handSelectionRequest.value) {
      return
    }
    event.preventDefault()
    cancelHandSelectionRequest('カード選択がキャンセルされました')
  }

  return {
    hoveredCardKey,
    handSelectionRequest,
    handleCardHoverStart,
    handleCardHoverEnd,
    handleCardClick,
    handleHandContextMenu,
    isCardDisabled,
    isHandSelectionCandidate,
    handSelectionBlockedReason,
    selectionWrapperClass,
    resetSelection,
    cancelSelection,
    cancelHandSelectionRequest,
  }
}
