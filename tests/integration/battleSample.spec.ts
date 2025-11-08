import { describe, it, expect } from 'vitest'

import {
  AccelerationState,
  AcidSpitAction,
  BattleDanceAction,
  CorrosionState,
  FlurryAction,
  MucusShotAction,
  StickyState,
  StrengthState,
  TackleAction,
  createBattleSampleScenario,
  requireCardId,
} from '../fixtures/battleSampleScenario'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'

const battleSampleScenario = createBattleSampleScenario()
const Steps = battleSampleScenario.steps as Record<string, number>
const Refs = battleSampleScenario.references
const actionLog = battleSampleScenario.replayer.getActionLog()

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

const isMemoryCard = (card: { cardTags?: Array<{ id: string }>; title: string }): boolean =>
  (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory')

const countMemoryCards = (
  cards: Array<{ cardTags?: Array<{ id: string }>; title: string }>,
  title: string,
): number => cards.filter((card) => isMemoryCard(card) && card.title === title).length

function runScenario(stepKey: keyof typeof Steps) {
  const index = Steps[stepKey]
  if (index === undefined) {
    throw new Error(`Step ${String(stepKey)} is not defined`)
  }

  return battleSampleScenario.replayer.run(index)
}

describe('OperationLogとActionLogの整合性', () => {
  it('OperationLogから生成したActionLogがシナリオ定義と一致する', () => {
    const opReplayer = new OperationLogReplayer({
      createBattle: battleSampleScenario.createBattle,
      operationLog: battleSampleScenario.operationLog,
    })
    const { actionLog } = opReplayer.buildActionLog()
    expect(actionLog.toArray()).toEqual(battleSampleScenario.replayer.getActionLog().toArray())
  })
})

describe('新戦闘シナリオ: 記憶を操る初期ターン', () => {
  describe('ActionLogエントリ構造（計画ベース）', () => {

    it('ターン1の敵行動は enemy-act 連鎖で管理される', () => {
      const types = [1, 2, 3, 4].map((offset) => readStepEntryType('endPlayerTurn1', offset))
      expect(types).toEqual(['enemy-act', 'enemy-act', 'enemy-act', 'enemy-act'])
    })

    it('ターン2開始イベントは player-event エントリで処理される', () => {
      expect(readStepEntryType('playerTurn2Start', 1)).toBe('player-event')
    })

    it('ターン2の敵行動も enemy-act 連鎖で記録される', () => {
      const types = [1, 2, 3, 4].map((offset) => readStepEntryType('endPlayerTurn2', offset))
      expect(types).toEqual(['enemy-act', 'enemy-act', 'enemy-act', 'enemy-act'])
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

  it('ターン開始時は追加で2枚ドローし、山札順序が維持される', () => {
    const { snapshot, initialSnapshot, lastEntry } = runScenario('playerTurn1Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(lastEntry?.draw).toBe(2)
    expect(snapshot.hand).toHaveLength(5)
    expect(snapshot.hand.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(0, 5).map(requireCardId),
    )
    expect(snapshot.deck.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(5).map(requireCardId),
    )
  })

  it('被虐のオーラでかたつむりが即座に行動し記憶・腐食カードを得る', () => {
    const { battle, snapshot, lastEntry } = runScenario('playMasochisticAuraOnSnail')

    expect(lastEntry?.type).toBe('play-card')
    expect(lastEntry?.type === 'play-card' ? lastEntry.cardId : undefined).toBe(
      Refs.masochisticAuraIds[0],
    )
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.player.currentHp).toBe(145)
    expect(snapshot.hand).toHaveLength(6)
    expect(snapshot.discardPile.map(requireCardId)).toEqual([Refs.masochisticAuraIds[0]])

    expect(battle.hand.hasCardOf(AcidSpitAction)).toBe(true)
    expect(battle.hand.hasCardOf(CorrosionState)).toBe(true)
    expect(battle.player.getStates().some((state) => state instanceof CorrosionState)).toBe(true)

    const snail = snapshot.enemies.find((enemy) => enemy.id === Refs.enemyIds.snail)
    expect(snail?.hasActedThisTurn).toBe(true)
  })

  it('日課で追加2ドローし、天の鎖と疼きが手札に入る', () => {
    const { snapshot, lastEntry } = runScenario('playDailyRoutine')

    expect(lastEntry?.type).toBe('play-card')
    expect(lastEntry?.type === 'play-card' ? lastEntry.cardId : undefined).toBe(
      Refs.dailyRoutineId,
    )
    expect(snapshot.player.currentMana).toBe(1)
    expect(snapshot.hand.map((card) => card.title)).toEqual([
      '天の鎖',
      '天の鎖',
      '戦いの準備',
      '腐食',
      '酸を吐く',
      '天の鎖',
      '疼き',
    ])
  })

  it('戦いの準備でイベントが予約され、手札とマナが更新される', () => {
    const { snapshot, lastEntry } = runScenario('playBattlePrep')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.hand).toHaveLength(6)
    expect(snapshot.discardPile.map((card) => card.title)).toEqual([
      '被虐のオーラ',
      '日課',
      '戦いの準備',
    ])
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        type: 'mana',
        scheduledTurn: 2,
        payload: expect.objectContaining({ amount: 1 }),
      }),
    ])
  })

  it('敵ターン1でログと手札・状態が期待通り変化する', () => {
    const { battle, snapshot, lastEntry } = runScenario('endPlayerTurn1')

    const resolved = lastEntry as { type?: string; enemyActions?: unknown }
    expect(resolved?.type).toBe('end-player-turn')
    expect(resolved?.enemyActions).toBeUndefined()

    expect(snapshot.player.currentHp).toBe(100)
    expect(snapshot.hand).toHaveLength(9)
    expect(battle.hand.hasCardOf(TackleAction)).toBe(true)
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(true)
    expect(battle.hand.hasCardOf(StickyState)).toBe(true)

    const states = battle.player.getStates()
    expect(states.some((state) => state instanceof CorrosionState)).toBe(true)
    expect(states.some((state) => state instanceof StickyState)).toBe(true)
  })

  it('ターン2開始時、手札上限により1枚のみドローされマナ＋1される', () => {
    const { snapshot, lastEntry } = runScenario('playerTurn2Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(lastEntry?.handOverflow).toBe(true)
    expect(snapshot.hand).toHaveLength(10)
    expect(snapshot.player.currentMana).toBe(4)
    expect(readStepEntryType('playerTurn2Start', 1)).toBe('player-event')
  })

  it('たいあたりでかたつむりを撃破し、手札と捨て札が更新される', () => {
    const { battle, snapshot, lastEntry } = runScenario('playTackleOnSnail')

    expect(lastEntry?.type).toBe('play-card')
    expect(snapshot.player.currentMana).toBe(3)
    const snail = battle.enemyTeam.findEnemy(Refs.enemyIds.snail)
    expect(snail?.currentHp).toBe(0)
    expect(snapshot.hand).toHaveLength(9)
    expect(snapshot.discardPile.some((card) => card.title === 'たいあたり')).toBe(true)
  })

  it('酸を吐くと粘液飛ばしで触手を撃破し、腐食を手放す', () => {
    const afterAcid = runScenario('playAcidSpitOnTentacle')
    expect(afterAcid.snapshot.player.currentMana).toBe(2)
    const tentacleAfterAcid = afterAcid.battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    expect(tentacleAfterAcid?.currentHp).toBe(20)
    expect(tentacleAfterAcid?.states.some((state) => state instanceof CorrosionState)).toBe(true)

    const { battle, snapshot } = runScenario('playMucusShotOnTentacle')
    expect(snapshot.player.currentMana).toBe(1)
    const tentacle = battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    expect(tentacle?.currentHp).toBe(0)
    expect(snapshot.hand).toHaveLength(7)

    const afterCorrosion = runScenario('playCorrosion')
    expect(afterCorrosion.snapshot.player.currentMana).toBe(0)
    expect(afterCorrosion.snapshot.hand).toHaveLength(6)
    expect(afterCorrosion.snapshot.exilePile.map((card) => card.title)).toContain('腐食')
    const remainingStates = afterCorrosion.battle.player.getStates()
    expect(remainingStates.some((state) => state instanceof StickyState)).toBe(true)
    expect(remainingStates.some((state) => state instanceof CorrosionState)).toBe(false)
  })

  it('敵ターン2で筋力と加速が付与され、乱れ突きの記憶を得る', () => {
    const { battle, snapshot, lastEntry } = runScenario('endPlayerTurn2')

    const resolved = lastEntry as { type?: string; enemyActions?: unknown }
    expect(resolved?.type).toBe('end-player-turn')
    expect(resolved?.enemyActions).toBeUndefined()

    expect(snapshot.player.currentHp).toBe(60)
    expect(snapshot.hand).toHaveLength(7)
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(true)

    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    expect(orc?.states.some((state) => state instanceof StrengthState)).toBe(true)
    const dancer = battle.enemyTeam.findEnemy(Refs.enemyIds.orcDancer)
    expect(dancer?.states.some((state) => state instanceof AccelerationState)).toBe(true)
  })

  it('ターン3開始時に山札リロードと2ドローが行われる', () => {
    const { snapshot, lastEntry } = runScenario('playerTurn3Start')

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(snapshot.hand).toHaveLength(9)
    expect(snapshot.hand.filter((card) => card.title === '天の鎖')).toHaveLength(4)
    expect(snapshot.hand.some((card) => card.title === '酸を吐く')).toBe(true)
  })

  it('疼きで乱れ突きを複製し、オークとオークダンサーを撃破して勝利する', () => {
    const afterAche = runScenario('playAcheOnFlurry')
    expect(afterAche.snapshot.player.currentMana).toBe(2)
    const flurryCount = countMemoryCards(afterAche.snapshot.hand, '乱れ突き')
    expect(flurryCount).toBe(2)
    expect(afterAche.snapshot.exilePile.map((card) => card.title)).toContain('疼き')

    const afterFirstFlurry = runScenario('playFlurryOnOrc')
    const orc = afterFirstFlurry.battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    expect(afterFirstFlurry.snapshot.player.currentMana).toBe(1)
    expect(orc?.currentHp).toBe(0)

    const afterSecondFlurry = runScenario('playFlurryOnOrcDancer')
    const dancer = afterSecondFlurry.battle.enemyTeam.findEnemy(Refs.enemyIds.orcDancer)
    expect(afterSecondFlurry.snapshot.player.currentMana).toBe(0)
    expect(dancer?.currentHp).toBe(0)

    const { snapshot, battle, lastEntry } = runScenario('victory')
    expect(lastEntry?.type).toBe('victory')
    expect(battle.status).toBe('victory')
    expect(snapshot.enemies.every((enemy) => enemy.currentHp === 0)).toBe(true)
  })
})
