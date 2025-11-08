import { describe, it, expect } from 'vitest'

import {
  createBattleScenario2,
  requireCardId,
  FlurryAction,
  MucusShotAction,
  HeavenChainAction,
  MasochisticAuraAction,
  CorrosionState,
  StickyState,
} from '../fixtures/battleSampleScenario2'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { BarrierState } from '@/domain/entities/states/BarrierState'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import type { BattleActionLogEntry } from '@/domain/battle/ActionLog'

const battleSampleScenario = createBattleScenario2()
const Steps = battleSampleScenario.steps
const Refs = battleSampleScenario.references
const actionLog = battleSampleScenario.replayer.getActionLog()
const stripAnimations = (entry: BattleActionLogEntry): BattleActionLogEntry => {
  if (!entry.animations) {
    return entry
  }
  const { animations: _ignored, ...rest } = entry
  return rest as BattleActionLogEntry
}

const readEntryType = (index: number): string | undefined => {
  const entry = actionLog.at(index)
  return (entry as { type?: string })?.type
}

const readStepEntryType = (stepKey: keyof typeof Steps, offset = 0): string | undefined => {
  const baseIndex = Steps[stepKey]
  if (baseIndex === undefined) {
    return undefined
  }
  return readEntryType(baseIndex + offset)
}

function runScenario(stepKey: keyof typeof Steps) {
  const index = Steps[stepKey]
  if (index === undefined) {
    throw new Error(`Step ${String(stepKey)} is not defined in scenario 2`)
  }

  return battleSampleScenario.replayer.run(index)
}

describe('OperationLogとActionLogの整合性', () => {
  it('シナリオ2のOperationLogからActionLogを再構築できる', () => {
    const opReplayer = new OperationLogReplayer({
      createBattle: battleSampleScenario.createBattle,
      operationLog: battleSampleScenario.operationLog,
    })
    const { actionLog } = opReplayer.buildActionLog()
    const expected = battleSampleScenario.replayer.getActionLog().toArray().map(stripAnimations)
    const actual = actionLog.toArray().map(stripAnimations)
    expect(actual).toEqual(expected)
  })
})

describe('シナリオ2: 鉄花チームとの交戦', () => {
  describe('ActionLogエントリ構造（計画ベース）', () => {

    it('ターン2開始イベントは player-event で処理される', () => {
      expect(readStepEntryType('playerTurn2Start', 1)).toBe('player-event')
    })

    it('ターン2終了後も enemy-act が並び、最後はなめくじの行動で締める', () => {
      const types = [1, 2, 3, 4].map((offset) =>
        readStepEntryType('endPlayerTurn2', offset),
      )
      expect(types).toEqual(['enemy-act', 'enemy-act', 'enemy-act', 'enemy-act'])
    })

    it('かまいたち撃破後の逃走は state-event になる', () => {
      expect(readStepEntryType('playFlurryOnKamaitachi', 1)).toBe('state-event')
    })
  })
  it('バトル開始で初期3枚の手札が配られる', () => {
    const { snapshot, initialSnapshot, lastEntry } = runScenario('battleStart')

    expect(lastEntry?.type).toBe('battle-start')
    expect(snapshot.player.currentHp).toBe(150)
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.hand).toHaveLength(3)
    expect(snapshot.deck).toHaveLength(initialSnapshot.deck.length - 3)
    expect(snapshot.hand.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(0, 3).map(requireCardId),
    )
    expect(snapshot.deck.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(3).map(requireCardId),
    )
    expect(snapshot.status).toBe('in-progress')
  })

  it('バトル開始の初期3枚 + ターン開始の2枚で手札5枚が揃う', () => {
    const { battle, snapshot, initialSnapshot, lastEntry } = runScenario('playerTurn1Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(lastEntry?.draw).toBe(2)
    expect(snapshot.hand).toHaveLength(5)
    expect(snapshot.hand.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(0, 5).map(requireCardId),
    )
    expect(snapshot.deck.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(5).map(requireCardId),
    )

    const ironBloomSnapshot = snapshot.enemies.find(
      (enemy) => enemy.id === Refs.enemyIds.ironBloom,
    )
    expect(
      ironBloomSnapshot?.states.some(
        (state) => state instanceof BarrierState && (state.magnitude ?? 0) === 3,
      ),
    ).toBe(true)
  })

  it('被虐のオーラで鉄花が粘液飛ばしを即時発動し、状態カードを獲得する', () => {
    const { battle, snapshot, lastEntry } = runScenario('playMasochisticAuraOnIronBloom')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.player.currentHp).toBe(145)
    expect(battle.hand.hasCardOf(MasochisticAuraAction)).toBe(false)
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(true)
    expect(battle.hand.hasCardOf(StickyState)).toBe(true)
    expect(battle.player.getStates().some((state) => state instanceof StickyState)).toBe(true)

    const ironBloom = battle.enemyTeam.findEnemy(Refs.enemyIds.ironBloom)
    expect(ironBloom?.hasActedThisTurn).toBe(true)
  })

  it('天の鎖でなめくじの行動を封じる', () => {
    const { battle, snapshot, lastEntry } = runScenario('playHeavenChainOnSlug')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(1)
    expect(battle.hand.hasCardOf(HeavenChainAction)).toBe(true)
    const slug = battle.enemyTeam.findEnemy(Refs.enemyIds.slug)
    expect(slug?.hasActedThisTurn).toBe(false)
    const nextAction = slug?.queuedActions[0]
    expect(nextAction instanceof SkipTurnAction).toBe(true)
  })

  it('戦いの準備で次ターンのマナイベントを予約する', () => {
    const { snapshot, lastEntry } = runScenario('playBattlePrep')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.hand).toHaveLength(4)
    expect(snapshot.discardPile.map((card) => card.title)).toContain('戦いの準備')
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        type: 'mana',
        scheduledTurn: 2,
        payload: expect.objectContaining({ amount: 1 }),
      }),
    ])
  })

  it('敵ターン1で想定通りの連撃と追加カードが発生する', () => {
    const { battle, snapshot, lastEntry } = runScenario('endPlayerTurn1')

    const resolved = lastEntry as { type?: string; enemyActions?: unknown }
    expect(resolved?.type).toBe('end-player-turn')
    expect(resolved?.enemyActions).toBeUndefined()

    expect(snapshot.player.currentHp).toBe(120)
    expect(snapshot.hand).toHaveLength(5)
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(true)
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(true)
    expect(battle.player.getStates().some((state) => state instanceof StickyState)).toBe(true)
    expect(battle.player.getStates().some((state) => state instanceof CorrosionState)).toBe(false)
  })

  it('ターン2開始時に2枚ドローしマナ+1される', () => {
    const { snapshot, lastEntry } = runScenario('playerTurn2Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(lastEntry?.draw).toBe(2)
    expect(snapshot.hand).toHaveLength(7)
    expect(snapshot.player.currentMana).toBe(4)
    expect(readStepEntryType('playerTurn2Start', 1)).toBe('player-event')
    expect(snapshot.hand.map((card) => card.title)).toEqual([
      '天の鎖',
      '日課',
      'ねばねば',
      '粘液飛ばし',
      '乱れ突き',
      '天の鎖',
      '被虐のオーラ',
    ])
  })

  it('乱れ突き(5×5)で鉄花のバリアを削りつつ撃破する', () => {
    const { battle, snapshot, lastEntry } = runScenario('playFlurryOnIronBloom')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(3)
    const ironBloom = battle.enemyTeam.findEnemy(Refs.enemyIds.ironBloom)
    expect(ironBloom?.currentHp).toBe(0)
    expect(ironBloom?.status).toBe('defeated')
    expect(snapshot.discardPile.some((card) => card.title === '乱れ突き')).toBe(true)
  })

  it('被虐のオーラでオークランサーの乱れ突きを誘発し、記憶カードを得る', () => {
    const { battle, snapshot, lastEntry } = runScenario('playMasochisticAuraOnOrcLancer')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.player.currentHp).toBe(80)
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(true)
    const orcLancer = battle.enemyTeam.findEnemy(Refs.enemyIds.orcLancer)
    expect(orcLancer?.hasActedThisTurn).toBe(true)
  })

  it('乱れ突き(10×4)でオークランサーを撃破する', () => {
    const { battle, snapshot, lastEntry } = runScenario('playFlurryOnOrcLancer')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(1)
    const orcLancer = battle.enemyTeam.findEnemy(Refs.enemyIds.orcLancer)
    expect(orcLancer?.currentHp).toBe(0)
    expect(orcLancer?.status).toBe('defeated')
  })

  it('日課で再装填と天の鎖を引き込み、手札が整理される', () => {
    const { snapshot, lastEntry } = runScenario('playDailyRoutine')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.hand.map((card) => card.title)).toEqual([
      '天の鎖',
      'ねばねば',
      '粘液飛ばし',
      '天の鎖',
      '再装填',
      '天の鎖',
    ])
  })

  it('敵ターン2で追い風は不発となり、なめくじの酸を吐くを受ける', () => {
    const { battle, snapshot, lastEntry } = runScenario('endPlayerTurn2')

    const resolved = lastEntry as { type?: string; enemyActions?: unknown }
    expect(resolved?.type).toBe('end-player-turn')
    expect(resolved?.enemyActions).toBeUndefined()

    expect(snapshot.player.currentHp).toBe(75)
    expect(snapshot.hand).toHaveLength(8)
    const states = battle.player.getStates()
    expect(states.some((state) => state instanceof StickyState)).toBe(true)
    expect(states.some((state) => state instanceof CorrosionState)).toBe(true)
  })

  it('ターン3開始で山札を再構築し、2枚ドローする', () => {
    const { snapshot, lastEntry } = runScenario('playerTurn3Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(lastEntry?.draw).toBe(2)
    expect(snapshot.hand).toHaveLength(10)
    expect(snapshot.player.currentMana).toBe(3)
  })

  it('再装填で状態異常以外の手札を捨て、7枚引き直す', () => {
    const { battle, snapshot, lastEntry } = runScenario('playReload')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.hand).toHaveLength(9)
    const statusCards = battle.hand.list().filter((card) => card.definition.cardType === 'status')
    expect(statusCards.map((card) => card.title)).toEqual(['ねばねば', '腐食'])
  })

  it('乱れ突き(5×5)でかまいたちを撃破すると、なめくじが逃走する', () => {
    const { battle, snapshot, lastEntry } = runScenario('playFlurryOnKamaitachi')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(1)
    expect(readStepEntryType('playFlurryOnKamaitachi', 1)).toBe('state-event')

    const kamaitachi = battle.enemyTeam.findEnemy(Refs.enemyIds.kamaitachi)
    expect(kamaitachi?.status).toBe('defeated')

    const slug = battle.enemyTeam.findEnemy(Refs.enemyIds.slug)
    expect(slug?.status).toBe('escaped')
  })

  it('勝利エントリでバトルが終了し、最終盤面が期待通りになる', () => {
    const { snapshot, lastEntry } = runScenario('victory')

    expect(lastEntry?.type).toBe('victory')
    expect(snapshot.status).toBe('victory')
    expect(snapshot.player.currentHp).toBe(75)
    expect(snapshot.player.currentMana).toBe(1)
    expect(snapshot.enemies.map((enemy) => enemy.status)).toEqual([
      'defeated',
      'defeated',
      'defeated',
      'escaped',
    ])
  })
})
