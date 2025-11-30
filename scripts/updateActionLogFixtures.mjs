import fs from 'node:fs'
import path from 'node:path'
import jiti from 'jiti'

const scenarios = [
  {
    logPath: '/tmp/battleSample1.log',
    marker: 'BATTLE_SAMPLE1_ACTION_LOG_SUMMARY',
    output: 'tests/fixtures/battleSampleExpectedActionLog.ts',
    enemyNames: {
      0: 'オーク',
      1: 'オークダンサー',
      2: '触手',
      3: 'かたつむり',
    },
  },
  {
    logPath: '/tmp/battleSample2.log',
    marker: 'BATTLE_SAMPLE2_ACTION_LOG_SUMMARY',
    output: 'tests/fixtures/battleSample2ExpectedActionLog.ts',
    enemyNames: {
      0: 'オークランサー',
      1: 'かまいたち',
      2: '鉄花',
      3: 'なめくじ',
    },
  },
]

const useFixtureSource = process.env.USE_FIXTURE_SOURCE === '1'

const scenarioSpecificAdjustments = {
  'tests/fixtures/battleSampleExpectedActionLog.ts': {
    alreadyActedEnemyEntries: {
      10: { enemyId: 3, actionName: 'ぬるりと食いつく' },
    },
    playCardMemoryCardOverrides: {
      23: {
        waitMs: 1500,
        metadata: {
          durationMs: 1500,
          cardId: 15,
          cardIds: [15],
          cardTitle: '乱れ突き',
          cardTitles: ['乱れ突き'],
          cardCount: 1,
          enemyId: null,
        },
      },
    },
  },
}

function extractSummary(logPath, marker) {
  const raw = fs.readFileSync(logPath, 'utf8')
  const markerIndex = raw.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`marker ${marker} not found in ${logPath}`)
  }
  const jsonStart = raw.indexOf('[', markerIndex)
  let depth = 0
  let jsonEnd = -1
  for (let i = jsonStart; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch === '[') depth += 1
    else if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        jsonEnd = i
        break
      }
    }
  }
  if (jsonEnd === -1) {
    throw new Error(`json end not found for ${marker}`)
  }
  const jsonText = raw.slice(jsonStart, jsonEnd + 1)
  return JSON.parse(jsonText)
}

function toInlineObject(obj) {
  const json = JSON.stringify(obj)
  return json
    .replace(/"([^"\\]+)":/g, '$1:')
    .replace(/"/g, "'")
}

function describeCardFromMetadata(metadata) {
  if (!metadata) {
    return 'カード'
  }
  if (metadata.cardTitle) {
    return metadata.cardTitle
  }
  if (metadata.cardId !== undefined) {
    return `cardId=${metadata.cardId}`
  }
  return 'カード'
}

function describeCardList(metadata) {
  const titles = metadata?.cardTitles ?? metadata?.cards
  if (Array.isArray(titles) && titles.length > 0) {
    return titles.join('・')
  }
  const ids = metadata?.cardIds
  if (Array.isArray(ids) && ids.length > 0) {
    return ids.map((id) => `cardId=${id}`).join('・')
  }
  return ''
}

function resolveAnimationBatches(entry) {
  if (Array.isArray(entry.animationBatches) && entry.animationBatches.length > 0) {
    return entry.animationBatches.map((batch) => ({
      batchId: batch.batchId,
      snapshot: batch.snapshot,
      patch: batch.patch,
      instructions: (batch.instructions ?? []).map((instruction) => ({
        waitMs: instruction.waitMs,
        metadata: mergeDamageOutcomes(instruction.metadata, instruction.damageOutcomes),
      })),
    }))
  }
  if (Array.isArray(entry.animations) && entry.animations.length > 0) {
    const batches = new Map()
    entry.animations.forEach((animation) => {
      const batchId = animation.batchId ?? 'legacy-batch'
      const existing = batches.get(batchId)
      const metadata = mergeDamageOutcomes(animation.metadata, animation.damageOutcomes)
      if (existing) {
        existing.instructions.push({
          waitMs: animation.waitMs,
          metadata,
        })
      } else {
        batches.set(batchId, {
          batchId,
          snapshot: animation.snapshot,
          patch: animation.patch,
          instructions: [
            {
              waitMs: animation.waitMs,
              metadata,
            },
          ],
        })
      }
    })
    return Array.from(batches.values())
  }
  return []
}

const CARD_TITLE_PLACEHOLDER_PATTERN = /^カードID(\d+)$/
const CARD_AUDIO_MAP = new Map([
  ['被虐のオーラ', { soundId: 'skills/kurage-kosho_teleport01.mp3', waitMs: 500, durationMs: 500 }],
])
const ENEMY_BUFF_AUDIO_MAP = new Map([
  ['戦いの舞い', { soundId: 'skills/kurage-kosho_status03.mp3', waitMs: 500, durationMs: 500 }],
  ['ビルドアップ', { soundId: 'skills/kurage-kosho_status03.mp3', waitMs: 500, durationMs: 500 }],
])
const ENEMY_SKIP_AUDIO_MAP = new Map([
  ['足止め', { soundId: 'skills/OtoLogic_Electric-Shock02-Short.mp3', waitMs: 500, durationMs: 500 }],
])

function normalizeAnimationStructure(_entry, batches) {
  if (!Array.isArray(batches)) {
    return []
  }
  return batches
}

function combineStartPlayerTurnBatch(entry, batches) {
  const firstBatch = batches[0]
  const deckDrawInstructions = batches
    .flatMap((batch) => batch.instructions ?? [])
    .filter((instruction) => instruction.metadata?.stage === 'deck-draw')
    .map(cloneInstruction)
  const turnStartInstruction = (firstBatch.instructions ?? []).find(
    (instruction) => instruction.metadata?.stage === 'turn-start',
  )
  const instructions = []
  if (turnStartInstruction) {
    instructions.push(cloneInstruction(turnStartInstruction))
  }
  instructions.push({
    waitMs: 0,
    metadata: {
      stage: 'mana',
      amount: firstBatch.snapshot?.player?.currentMana,
    },
  })
  applyDeckDrawWaitToInstructions(deckDrawInstructions)
  instructions.push(...deckDrawInstructions)
  applyDeckDrawWaitToInstructions(instructions)
  return {
    batchId: ensureBatchId(firstBatch.batchId, 'turn-start'),
    snapshot: firstBatch.snapshot,
    instructions,
  }
}

function combinePlayCardBatches(entry, batches, context) {
  if (!batches.length) {
    return batches
  }
  const flattened = batches.flatMap((batch, batchIndex) =>
    (batch.instructions ?? []).map((instruction, instructionIndex) => ({
      instruction,
      batch,
      batchIndex,
      instructionIndex,
    })),
  )
  const used = new Set()
  const ordered = []
  const selectors = [
    (item) => item.instruction.metadata?.stage === 'mana',
    (item) =>
      item.instruction.metadata?.stage === 'card-trash' ||
      item.instruction.metadata?.stage === 'card-eliminate',
    (item) => item.instruction.metadata?.stage === 'deck-draw',
    (item) => item.instruction.metadata?.stage === 'audio',
  ]
  let manaInsertionIndex = 0
  selectors.forEach((selector, selectorIndex) => {
    flattened.forEach((item, index) => {
      if (!used.has(index) && selector(item)) {
        ordered.push(cloneInstruction(item.instruction))
        used.add(index)
      }
    })
    if (selectorIndex === 0) {
      manaInsertionIndex = ordered.length
    }
  })
  const hasCardMovementInstruction = ordered.some((instruction) =>
    instruction.metadata?.stage === 'card-trash' || instruction.metadata?.stage === 'card-eliminate',
  )
  const cardId = typeof entry.card === 'number' ? entry.card : undefined
  let cardTitle =
    cardId !== undefined ? resolveCardTitleFromInstructions(cardId, flattened) ?? context.cardNameMap.get(cardId) : undefined
  if (cardId !== undefined) {
    cardTitle = normalizeCardTitle(cardTitle, cardId, context)
  }
  if (!hasCardMovementInstruction && typeof cardId === 'number') {
    const fallbackTitle = cardTitle ?? `カードID${cardId}`
    ordered.splice(manaInsertionIndex, 0, {
      waitMs: 0,
      metadata: {
        stage: 'card-trash',
        cardIds: [cardId],
        cardTitles: fallbackTitle ? [fallbackTitle] : undefined,
      },
    })
  }
  if (cardTitle && CARD_AUDIO_MAP.has(cardTitle) && !ordered.some((instruction) => instruction.metadata?.stage === 'audio')) {
    const { soundId, waitMs, durationMs } = CARD_AUDIO_MAP.get(cardTitle)
    ordered.push({
      waitMs,
      metadata: {
        stage: 'audio',
        soundId,
        durationMs,
      },
    })
  }
  flattened.forEach((item, index) => {
    if (!used.has(index)) {
      ordered.push(cloneInstruction(item.instruction))
      used.add(index)
    }
  })
  applyCardTitleNormalization(ordered, context)
  applyDeckDrawWaitToInstructions(ordered)
  applyPlayCardScenarioOverrides(ordered, context)
  const defeatInstructions = []
  const remainingInstructions = []
  ordered.forEach((instruction) => {
    if (instruction.metadata?.stage === 'defeat') {
      defeatInstructions.push(instruction)
    } else {
      remainingInstructions.push(instruction)
    }
  })
  const lastBatch = batches[batches.length - 1]
  const resultBatches = [
    {
      batchId: ensureBatchId(batches[0]?.batchId, 'player-action'),
      snapshot: lastBatch?.snapshot ?? batches[0]?.snapshot,
      instructions: remainingInstructions,
    },
  ]
  if (defeatInstructions.length > 0) {
    resultBatches.push({
      batchId: ensureBatchId(batches[0]?.batchId, 'enemy-defeat'),
      snapshot: lastBatch?.snapshot ?? batches[0]?.snapshot,
      instructions: defeatInstructions,
    })
  }
  return resultBatches
}

function combineEndPlayerTurnBatch(batches, context) {
  const firstBatch = batches[0]
  const snapshot = firstBatch?.snapshot ?? context?.previousSnapshot ?? batches.at(-1)?.snapshot
  const turnEndInstruction = (firstBatch?.instructions ?? []).find(
    (instruction) => instruction.metadata?.stage === 'turn-end',
  )
  const instructions = [
    turnEndInstruction ? cloneInstruction(turnEndInstruction) : { waitMs: 0, metadata: { stage: 'turn-end' } },
  ]
  return [
    {
      batchId: ensureBatchId(firstBatch?.batchId, 'turn-end'),
      snapshot: snapshot ?? null,
      instructions,
    },
  ]
}

function transferEndTurnEnemyStages(batches, context) {
  if (!context) {
    return
  }
  const extraInstructions = batches
    .slice(1)
    .flatMap((batch) => (batch.instructions ?? []).map((instruction) => cloneInstruction(instruction)))
    .filter((instruction) => {
      const stage = instruction.metadata?.stage
      return stage === 'create-state-card' || stage === 'memory-card'
    })
  if (!extraInstructions.length) {
    return
  }
  if (!Array.isArray(context.pendingEnemyStages)) {
    context.pendingEnemyStages = []
  }
  context.pendingEnemyStages.push(...extraInstructions)
}

function resolveCardTitleFromInstructions(cardId, flattenedInstructions) {
  for (const item of flattenedInstructions) {
    const metadata = item.instruction.metadata
    if (!metadata) {
      continue
    }
    if (typeof metadata.cardId === 'number' && metadata.cardId === cardId && typeof metadata.cardTitle === 'string') {
      return metadata.cardTitle
    }
    if (Array.isArray(metadata.cardIds) && metadata.cardIds.includes(cardId)) {
      const index = metadata.cardIds.indexOf(cardId)
      const candidate = Array.isArray(metadata.cardTitles) ? metadata.cardTitles[index] : undefined
      if (typeof candidate === 'string') {
        return candidate
      }
    }
  }
  return undefined
}

function normalizeCardTitle(title, cardId, context) {
  if (typeof cardId === 'number') {
    if (!title || isPlaceholderCardTitle(title, cardId)) {
      const mappedTitle = context?.cardNameMap?.get(cardId)
      if (mappedTitle) {
        return mappedTitle
      }
    }
  }
  return title
}

function isPlaceholderCardTitle(title, cardId) {
  if (typeof title !== 'string') {
    return false
  }
  if (typeof cardId === 'number' && title === `カードID${cardId}`) {
    return true
  }
  return CARD_TITLE_PLACEHOLDER_PATTERN.test(title)
}

function applyCardTitleNormalization(instructions, context) {
  instructions.forEach((instruction) => {
    const stage = instruction.metadata?.stage
    if (stage === 'card-trash' || stage === 'card-eliminate') {
      normalizeCardMovementMetadata(instruction.metadata, context)
    }
  })
}

function normalizeCardMovementMetadata(metadata, context) {
  if (!metadata) {
    return
  }
  const ids = []
  if (Array.isArray(metadata.cardIds)) {
    ids.push(...metadata.cardIds)
  } else if (typeof metadata.cardId === 'number') {
    ids.push(metadata.cardId)
  }
  if (!ids.length) {
    return
  }
  const existingTitles = Array.isArray(metadata.cardTitles) ? metadata.cardTitles.slice() : []
  const normalizedTitles = ids.map((cardId, index) => {
    const existing = existingTitles[index] ?? metadata.cardTitle
    const normalized = normalizeCardTitle(existing, cardId, context)
    if (normalized) {
      return normalized
    }
    if (typeof cardId === 'number') {
      return `カードID${cardId}`
    }
    return existing ?? 'カード'
  })
  metadata.cardIds = ids
  metadata.cardTitles = normalizedTitles
}

function applyPlayCardScenarioOverrides(instructions, context) {
  const override =
    context?.scenarioConfig?.playCardMemoryCardOverrides?.[context.entryIndex]
  if (!override) {
    return
  }
  instructions.push({
    waitMs: override.waitMs ?? 1500,
    metadata: {
      stage: 'memory-card',
      durationMs: override.metadata?.durationMs ?? override.waitMs ?? 1500,
      ...override.metadata,
    },
  })
}

function applyDeckDrawWaitToInstructions(instructions) {
  instructions.forEach((instruction) => {
    if (instruction.metadata?.stage === 'deck-draw') {
      instruction.waitMs = calculateDeckDrawWaitFromMetadata(instruction.metadata)
    }
  })
}

function calculateDeckDrawWaitFromMetadata(metadata) {
  const cardCount = Array.isArray(metadata?.cardIds) ? metadata.cardIds.length : metadata?.draw ?? 0
  const base = 600
  if (!cardCount || cardCount <= 0) {
    return base
  }
  const additionalDelay = Math.max(0, cardCount - 1) * 100
  return base + additionalDelay
}

function splitEnemyActBatches(entry, batches, context) {
  const highlightInstructions = []
  const actionInstructions = []
  const memoryInstructions = []
  const highlightSnapshots = []
  const actionSnapshots = []
  const memorySnapshots = []
  batches.forEach((batch) => {
    (batch.instructions ?? []).forEach((instruction) => {
      const stage = instruction.metadata?.stage
      const cloned = cloneInstruction(instruction)
      if (stage === 'enemy-highlight') {
        cloned.waitMs = 0
        highlightInstructions.push(cloned)
        highlightSnapshots.push(batch.snapshot)
      } else if (stage === 'memory-card') {
        cloned.waitMs = 1500
        memoryInstructions.push(cloned)
        memorySnapshots.push(batch.snapshot)
      } else {
        if (stage === 'player-damage') {
          cloned.waitMs = computePlayerDamageWait(cloned.metadata)
        } else if (stage === 'create-state-card') {
          cloned.waitMs = 500
        }
        actionInstructions.push(cloned)
        actionSnapshots.push(batch.snapshot)
      }
    })
  })
  const suffix = extractBatchSuffix(batches[0]?.batchId ?? '')
  const normalizedBatches = []
  if (highlightInstructions.length > 0) {
    normalizedBatches.push({
      batchId: `enemy-act-start:${suffix}`,
      snapshot: highlightSnapshots.at(-1) ?? batches[0]?.snapshot,
      instructions: highlightInstructions,
    })
  }
  assignPendingEnemyStages(context, actionInstructions, memoryInstructions)
  const enemyActionAudioInstruction = getEnemyActionAudioInstruction(highlightInstructions, actionInstructions)
  if (enemyActionAudioInstruction) {
    actionInstructions.unshift(enemyActionAudioInstruction)
  }
  if (actionInstructions.length > 0) {
    const prioritizedActionInstructions = orderEnemyActionInstructions(actionInstructions)
    normalizedBatches.push({
      batchId: `enemy-action:${suffix}`,
      snapshot: actionSnapshots.at(-1) ?? batches[0]?.snapshot,
      instructions: prioritizedActionInstructions,
    })
  }
  if (memoryInstructions.length > 0) {
    normalizedBatches.push({
      batchId: `remember-enemy-attack:${suffix}`,
      snapshot: memorySnapshots.at(-1) ?? batches.at(-1)?.snapshot,
      instructions: memoryInstructions,
    })
  }
  return normalizedBatches.length > 0 ? normalizedBatches : batches
}

function getEnemyActionAudioInstruction(highlightInstructions, actionInstructions) {
  if (actionInstructions.some((instruction) => instruction.metadata?.stage === 'audio')) {
    return null
  }
  const highlightWithName = highlightInstructions.find((instruction) => instruction.metadata?.actionName)
  const actionName = highlightWithName?.metadata?.actionName
  if (!actionName) {
    return null
  }
  const audioSetting = ENEMY_SKIP_AUDIO_MAP.get(actionName) ?? ENEMY_BUFF_AUDIO_MAP.get(actionName)
  if (!audioSetting) {
    return null
  }
  return {
    waitMs: audioSetting.waitMs,
    metadata: {
      stage: 'audio',
      soundId: audioSetting.soundId,
      durationMs: audioSetting.durationMs,
    },
  }
}

function assignPendingEnemyStages(context, actionInstructions, memoryInstructions) {
  if (!context?.pendingEnemyStages?.length) {
    return
  }
  const consumedStages = new Set()
  while (context.pendingEnemyStages.length > 0) {
    const nextInstruction = context.pendingEnemyStages[0]
    const stage = nextInstruction.metadata?.stage
    if (stage === 'create-state-card' && !consumedStages.has('create-state-card')) {
      actionInstructions.push(context.pendingEnemyStages.shift())
      consumedStages.add('create-state-card')
      continue
    }
    if (stage === 'memory-card' && !consumedStages.has('memory-card')) {
      memoryInstructions.push(context.pendingEnemyStages.shift())
      consumedStages.add('memory-card')
      continue
    }
    break
  }
}

function computePlayerDamageWait(metadata) {
  const outcomes = Array.isArray(metadata?.damageOutcomes) ? metadata.damageOutcomes : []
  const count = outcomes.length > 0 ? outcomes.length : 1
  return (count - 1) * 200 + 500
}

function orderEnemyActionInstructions(instructions) {
  const damageInstructions = []
  const stateCardInstructions = []
  const restInstructions = []
  instructions.forEach((instruction) => {
    const stage = instruction.metadata?.stage
    if (stage === 'player-damage') {
      damageInstructions.push(instruction)
    } else if (stage === 'create-state-card') {
      stateCardInstructions.push(instruction)
    } else {
      restInstructions.push(instruction)
    }
  })
  return [...damageInstructions, ...stateCardInstructions, ...restInstructions]
}

function buildAlreadyActedEnemyBatches(entry, override, context, batches = []) {
  const suffix = extractBatchSuffix(batches[0]?.batchId ?? `enemy-act:${context.entryIndex}`)
  const snapshot = batches[0]?.snapshot ?? context?.previousSnapshot ?? batches.at(-1)?.snapshot ?? null
  const highlightInstruction = {
    waitMs: 0,
    metadata: {
      stage: 'enemy-highlight',
      enemyId: override.enemyId,
      actionName: override.actionName ?? 'already-acted',
      skipped: true,
    },
  }
  const alreadyActedInstruction = {
    waitMs: 500,
    metadata: {
      stage: 'already-acted-enemy',
      enemyId: override.enemyId,
    },
  }
  return [
    {
      batchId: `enemy-act-start:${suffix}`,
      snapshot,
      instructions: [highlightInstruction],
    },
    {
      batchId: `enemy-action:${suffix}`,
      snapshot,
      instructions: [alreadyActedInstruction],
    },
  ]
}

function ensureBatchId(originalId, prefix) {
  if (!originalId) {
    return `${prefix}:0`
  }
  const suffix = extractBatchSuffix(originalId)
  return `${prefix}:${suffix}`
}

function extractBatchSuffix(batchId) {
  if (!batchId) {
    return '0'
  }
  const parts = `${batchId}`.split(':')
  return parts.length > 1 ? parts.slice(1).join(':') : parts[0]
}

function cloneInstruction(instruction) {
  if (!instruction) {
    return instruction
  }
  return {
    waitMs: instruction.waitMs,
    metadata: instruction.metadata ? JSON.parse(JSON.stringify(instruction.metadata)) : undefined,
  }
}

function flattenAnimationBatches(batches) {
  return batches.flatMap((batch) =>
    batch.instructions.map((instruction) => ({
      waitMs: instruction.waitMs,
      metadata: instruction.metadata,
      batchId: batch.batchId,
      snapshot: batch.snapshot,
    })),
  )
}

function buildCardNameMap(summary) {
  const map = new Map()
  summary.forEach((entry) => {
    const batches = resolveAnimationBatches(entry)
    batches.forEach((batch) => {
      (batch.instructions ?? []).forEach((instruction) => {
        const metadata = instruction.metadata ?? {}
        if (typeof metadata.cardId === 'number' && typeof metadata.cardTitle === 'string') {
          map.set(metadata.cardId, metadata.cardTitle)
        }
        if (Array.isArray(metadata.cardIds) && Array.isArray(metadata.cardTitles)) {
          metadata.cardIds.forEach((cardId, index) => {
            const title = metadata.cardTitles[index]
            if (typeof cardId === 'number' && typeof title === 'string') {
              map.set(cardId, title)
            }
          })
        }
      })
    })
    const animations = flattenAnimationBatches(batches)
    animations.forEach((animation) => {
      collectCardsFromSnapshot(animation.snapshot).forEach((card) => {
        const cardId =
          typeof card?.id === 'number'
            ? card.id
            : typeof card?.idValue === 'number'
              ? card.idValue
              : undefined
        const resolvedTitle =
          card?.title ??
          card?.definitionValue?.title ??
          card?.actionRef?.props?.name ??
          card?.definitionValue?.cardDefinition?.title
        if (cardId !== undefined && typeof resolvedTitle === 'string') {
          map.set(cardId, resolvedTitle)
        }
      })
    })
  })
  return map
}

function collectCardsFromSnapshot(snapshot) {
  if (!snapshot) {
    return []
  }
  const collections = [snapshot.hand ?? [], snapshot.deck ?? [], snapshot.discardPile ?? [], snapshot.exilePile ?? []]
  return collections.flat()
}

function loadSummaryFromFixture(outputPath) {
  const modulePath = outputPath.endsWith('battleSample2ExpectedActionLog.ts')
    ? '../tests/fixtures/battleSample2ExpectedActionLog.ts'
    : '../tests/fixtures/battleSampleExpectedActionLog.ts'
  const loader = jiti(import.meta.url, { cache: false })
  const exports = loader(modulePath)
  const sequence = exports.ACTION_LOG_ENTRY_SEQUENCE ?? []
  return sequence.map((entry) => JSON.parse(JSON.stringify(entry)))
}

function buildSnapshotComment(snapshot, enemyNames) {
  const playerNote = `HP${snapshot.player.hp}/MP${snapshot.player.mana}`
  const handTitles = snapshot.hand.map((card) => card.title).join('・') || '手札0'
  const enemyNote = snapshot.enemies
    .map((enemy) => `${enemyNames[enemy.id] ?? `敵${enemy.id}`}=${enemy.hp}`)
    .join(', ')
  return `// 確認: ${playerNote}, 手札[${handTitles}], 敵HP[${enemyNote}]`
}

function describeEntry(entry, context, enemyNames, cardNameMap, animationBatchesOverride) {
  const { type } = entry
  if (type === 'start-player-turn') {
    context.turn += 1
  }
  const animations = flattenAnimationBatches(
    animationBatchesOverride ?? resolveAnimationBatches(entry),
  )
  switch (type) {
    case 'battle-start':
      return 'バトル開始：初期手札と敵HPを描画'
    case 'start-player-turn': {
      const draw = animations[0]?.metadata?.draw ?? 0
      return `ターン${context.turn}開始：${draw}枚ドロー`
    }
    case 'play-card': {
      const cardTitle =
        entry.card !== undefined ? cardNameMap.get(entry.card) ?? `カードID${entry.card}` : 'カード'
      const targetOp = entry.operations?.find((op) => op.type === 'target-enemy')
      const targetName = targetOp ? enemyNames[targetOp.payload] ?? `敵${targetOp.payload}` : undefined
      const action = targetName ? `${cardTitle}で${targetName}を攻撃/支援` : `${cardTitle}を使用`
      return `ターン${context.turn} プレイヤー行動：${action}`
    }
    case 'end-player-turn':
      return `ターン${context.turn}終了：敵行動フェイズへ`
    case 'enemy-act': {
      const highlight = animations.find((anim) => anim.metadata?.stage === 'enemy-highlight')
      const enemyId = highlight?.metadata?.enemyId
      const enemyName = enemyId !== undefined ? enemyNames[enemyId] ?? `敵${enemyId}` : '敵'
      const actionName = highlight?.metadata?.actionName ?? '行動'
      const skipped = highlight?.metadata?.skipped ? '（行動不能）' : ''
      return `敵フェイズ：${enemyName}が${actionName}を実行${skipped}`
    }
    case 'player-event':
      return `プレイヤーイベント解決（${entry.eventId ?? 'event'}）`
    case 'state-event': {
      const subjectId = animations[0]?.metadata?.subjectId
      const subjectName = subjectId !== undefined ? enemyNames[subjectId] ?? `対象${subjectId}` : '対象'
      const stateId = animations[0]?.metadata?.stateId ?? 'state'
      const result = animations[0]?.metadata?.payload?.result ?? 'resolve'
      return `ステートイベント：${subjectName}の${stateId}が${result}`
    }
    case 'victory':
      return '勝利処理：リザルト表示'
    default:
      return `ログ：${type}`
  }
}

function stageComment(stage, metadata) {
  switch (stage) {
    case 'battle-start':
      return '[バトル開始] 初期手札と盤面を描画'
    case 'turn-start':
      return '[ターン開始] フェーズ開始を通知'
    case 'card-trash':
      return `[カード廃棄] ${(describeCardList(metadata) || describeCardFromMetadata(metadata))} を捨て札へ移動`
    case 'card-eliminate':
      return `[カード除外] ${(describeCardList(metadata) || describeCardFromMetadata(metadata))} を消費`
    case 'damage':
      return `[ダメージ演出] ${describeCardFromMetadata(metadata)} の攻撃結果`
    case 'player-damage':
      return `[被ダメージ] プレイヤーへの攻撃結果`
    case 'enemy-highlight':
      return '[敵行動ハイライト] 敵の行動を強調'
    case 'deck-draw':
      return '[ドロー] 山札から手札にカードを追加'
    case 'turn-end':
      return '[ターン終了] 敵ターン移行直前'
    case 'mana':
      return '[マナ] マナゲージを変化'
    case 'create-state-card':
      return `[状態異常カード生成] ${(describeCardList(metadata) || '不明カード')} を手札へ`
    case 'memory-card':
      return `[記憶カード生成] ${(describeCardList(metadata) || '不明カード')} を手札へ`
    case 'audio':
      return `[サウンド] soundId=${metadata?.soundId ?? 'unknown'} を再生`
    case 'already-acted-enemy':
      return '[行動済み敵] 行動済みの敵が何もしなかったことを表示'
    case 'defeat':
      return '[撃破演出] 撃破された敵を退場'
    case 'escape':
      return '[逃走] 敵カードを退場'
    case 'victory':
      return '[勝利] リザルトオーバーレイを表示'
    default:
      return `[${stage ?? '不明'}] アニメーション`
  }
}

function buildConstName(index, type) {
  const idx = String(index + 1).padStart(2, '0')
  const typeSlug = type.replace(/-/g, '_').toUpperCase()
  return `ACTION_LOG_ENTRY_${idx}_${typeSlug}`
}

function mergeDamageOutcomes(metadata, damageOutcomes) {
  if (!damageOutcomes || damageOutcomes.length === 0) {
    return metadata ? { ...metadata } : metadata
  }
  const base = metadata ? { ...metadata } : {}
  base.damageOutcomes = damageOutcomes
  return base
}

function formatScenario({ logPath, marker, output, enemyNames }) {
  const summary = useFixtureSource
    ? loadSummaryFromFixture(output)
    : extractSummary(logPath, marker)
  const cardNameMap = buildCardNameMap(summary)
  const scenarioConfig = scenarioSpecificAdjustments[output] ?? {}
  const normalizationContext = {
    cardNameMap,
    scenarioConfig,
    pendingEnemyStages: [],
    entryIndex: 0,
    previousSnapshot: null,
  }
  const lines = []
  lines.push('// 自動生成: do not edit manually. Update via LOG_BATTLE_SAMPLE*_SUMMARY pipeline.')
  lines.push('import type { ActionLogEntrySummary } from \'../integration/utils/battleLogTestUtils\'')
  lines.push('')
  const constNames = []
  const context = { turn: 0 }
  let previousSnapshot = null
  summary.forEach((entry, index) => {
    const constName = buildConstName(index, entry.type)
    constNames.push(constName)
    const rawBatches = resolveAnimationBatches(entry)
    normalizationContext.entryIndex = index
    normalizationContext.previousSnapshot = previousSnapshot
    const animationBatches = normalizeAnimationStructure(entry, rawBatches, normalizationContext)
    const latestSnapshot =
      animationBatches.length > 0
        ? animationBatches.at(-1)?.snapshot ?? animationBatches[0]?.snapshot ?? previousSnapshot
        : previousSnapshot
    previousSnapshot = latestSnapshot ?? previousSnapshot
    const entryComment = describeEntry(entry, context, enemyNames, cardNameMap, animationBatches)
    lines.push(`// ${entryComment}`)
    lines.push(`export const ${constName}: ActionLogEntrySummary = {`)
    lines.push(`  type: '${entry.type}',`)
    if (entry.card !== undefined) {
      lines.push(`  card: ${entry.card},`)
    }
    if (entry.operations) {
      lines.push(`  operations: ${toInlineObject(entry.operations)},`)
    }
    if (entry.eventId) {
      lines.push(`  eventId: '${entry.eventId}',`)
    }
    lines.push('  animationBatches: [')
    animationBatches.forEach((batch) => {
      lines.push('    {')
      lines.push(`      batchId: '${batch.batchId}',`)
      if (batch.snapshot) {
        const snapshotLine = toInlineObject(batch.snapshot)
        const snapshotComment = buildSnapshotComment(batch.snapshot, enemyNames)
        lines.push(`      snapshot: ${snapshotLine}, ${snapshotComment}`)
      }
      if (batch.patch) {
        lines.push(`      patch: ${toInlineObject(batch.patch)},`)
      }
      lines.push('      instructions: [')
      batch.instructions.forEach((instruction) => {
        const animComment = stageComment(instruction.metadata?.stage, instruction.metadata)
        lines.push(`        // ${animComment}`)
        lines.push('        {')
        lines.push(`          waitMs: ${instruction.waitMs},`)
        if (instruction.metadata) {
          lines.push(`          metadata: ${toInlineObject(instruction.metadata)},`)
        }
        lines.push('        },')
      })
      lines.push('      ],')
      lines.push('    },')
    })
    lines.push('  ],')
    lines.push('}')
    lines.push('')
  })
  lines.push('export const ACTION_LOG_ENTRY_SEQUENCE = [')
  constNames.forEach((name, idx) => {
    lines.push(`  ${name}${idx === constNames.length - 1 ? '' : ','}`)
  })
  lines.push('] as const')
  fs.writeFileSync(path.join(process.cwd(), output), `${lines.join('\n')}\n`)
}

scenarios.forEach(formatScenario)
