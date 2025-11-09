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

function buildCardNameMap(summary) {
  const map = new Map()
  summary.forEach((entry) => {
    entry.animations?.forEach((animation) => {
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
  switch (type) {
    case 'battle-start':
      return 'バトル開始：初期手札と敵HPを描画'
    case 'start-player-turn': {
      const draw = entry.animations?.[0]?.metadata?.draw ?? 0
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
      const highlight = entry.animations?.find((anim) => anim.metadata?.stage === 'enemy-highlight')
      const enemyId = highlight?.metadata?.enemyId
      const enemyName = enemyId !== undefined ? enemyNames[enemyId] ?? `敵${enemyId}` : '敵'
      const actionId = highlight?.metadata?.actionId ?? '行動'
      const skipped = highlight?.metadata?.skipped ? '（行動不能）' : ''
      return `敵フェイズ：${enemyName}が${actionId}を実行${skipped}`
    }
    case 'player-event':
      return `プレイヤーイベント解決（${entry.eventId ?? 'event'}）`
    case 'state-event': {
      const subjectId = entry.animations?.[0]?.metadata?.subjectId
      const subjectName = subjectId !== undefined ? enemyNames[subjectId] ?? `対象${subjectId}` : '対象'
      const stateId = entry.animations?.[0]?.metadata?.stateId ?? 'state'
      const result = entry.animations?.[0]?.metadata?.payload?.result ?? 'resolve'
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
      return '[ターン開始] ドロー後の手札/山札を反映'
    case 'card-move':
      return `[カード移動] cardId=${metadata?.cardId ?? 'unknown'} の移動`
    case 'damage':
      if (metadata?.enemyId !== undefined) {
        return `[ダメージ演出] ${metadata.enemyId}番目の敵 (${metadata.actionId ?? '攻撃'})`
      }
      return `[ダメージ演出] cardId=${metadata?.cardId ?? 'unknown'} の攻撃結果`
    case 'enemy-highlight':
      return '[敵行動ハイライト] 敵の行動を強調'
    case 'memory-card':
      return '[手札追加] 敵攻撃の記憶カードを手札へ'
    case 'turn-end':
      return '[ターン終了] 敵ターン移行直前'
    case 'player-event':
      return '[プレイヤーイベント] 予約効果を解決'
    case 'state-event':
      return '[ステートイベント] 状態効果を反映'
    case 'defeat':
      return '[撃破演出] 撃破された敵を退場'
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

function formatScenario({ logPath, marker, output, enemyNames }) {
  const summary = extractSummary(logPath, marker)
  const cardNameMap = buildCardNameMap(summary)
  const lines = []
  lines.push('// 自動生成: do not edit manually. Update via LOG_BATTLE_SAMPLE*_SUMMARY pipeline.')
  lines.push(\"import type { ActionLogEntrySummary } from '../integration/utils/battleLogTestUtils'\")
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
    lines.push('  animations: [')
    entry.animations?.forEach((animation) => {
      const animComment = stageComment(animation.metadata?.stage, animation.metadata)
      lines.push(`    // ${animComment}`)
      lines.push('    {')
      lines.push(`      waitMs: ${animation.waitMs},`)
      if (animation.metadata) {
        lines.push(`      metadata: ${toInlineObject(animation.metadata)},`)
      }
      if (animation.damageOutcomes) {
        lines.push(`      damageOutcomes: ${toInlineObject(animation.damageOutcomes)},`)
      }
      if (animation.snapshot) {
        const snapshotLine = toInlineObject(animation.snapshot)
        const snapshotComment = buildSnapshotComment(animation.snapshot, enemyNames)
        lines.push(`      snapshot: ${snapshotLine}, ${snapshotComment}`)
      }
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
  fs.writeFileSync(path.join(process.cwd(), output), lines.join('\\n'))
}

scenarios.forEach(formatScenario)
