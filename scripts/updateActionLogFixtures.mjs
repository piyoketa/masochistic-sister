import fs from 'node:fs'
import path from 'node:path'

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
    const animations = flattenAnimationBatches(resolveAnimationBatches(entry))
    animations.forEach((animation) => {
      animation.snapshot?.hand?.forEach((card) => {
        if (card?.id !== undefined && card?.title) {
          map.set(card.id, card.title)
        }
      })
    })
  })
  return map
}

function buildSnapshotComment(snapshot, enemyNames) {
  const playerNote = `HP${snapshot.player.hp}/MP${snapshot.player.mana}`
  const handTitles = snapshot.hand.map((card) => card.title).join('・') || '手札0'
  const enemyNote = snapshot.enemies
    .map((enemy) => `${enemyNames[enemy.id] ?? `敵${enemy.id}`}=${enemy.hp}`)
    .join(', ')
  return `// 確認: ${playerNote}, 手札[${handTitles}], 敵HP[${enemyNote}]`
}

function describeEntry(entry, context, enemyNames, cardNameMap) {
  const { type } = entry
  if (type === 'start-player-turn') {
    context.turn += 1
  }
  const animations = flattenAnimationBatches(resolveAnimationBatches(entry))
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
  const summary = extractSummary(logPath, marker)
  const cardNameMap = buildCardNameMap(summary)
  const lines = []
  lines.push('// 自動生成: do not edit manually. Update via LOG_BATTLE_SAMPLE*_SUMMARY pipeline.')
  lines.push('import type { ActionLogEntrySummary } from \'../integration/utils/battleLogTestUtils\'')
  lines.push('')
  const constNames = []
  const context = { turn: 0 }
  summary.forEach((entry, index) => {
    const constName = buildConstName(index, entry.type)
    constNames.push(constName)
    const entryComment = describeEntry(entry, context, enemyNames, cardNameMap)
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
    const animationBatches = resolveAnimationBatches(entry)
    lines.push('  animationBatches: [')
    animationBatches.forEach((batch) => {
      lines.push('    {')
      lines.push(`      batchId: '${batch.batchId}',`)
      if (batch.snapshot) {
        const snapshotLine = toInlineObject(batch.snapshot)
        const snapshotComment = buildSnapshotComment(batch.snapshot, enemyNames)
        lines.push(`      snapshot: ${snapshotLine}, ${snapshotComment}`)
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
