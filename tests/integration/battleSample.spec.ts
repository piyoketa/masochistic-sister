// このテストファイルでは、被虐のオーラ戦闘シナリオの進行と副作用を網羅的に検証する。
// どのステップで何を確認しているかが一目で分かるよう、日本語コメントを豊富に配置している。
import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { ActionLog } from '@/domain/battle/ActionLog'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { BattleDanceAction } from '@/domain/entities/actions/BattleDanceAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '@/domain/entities/enemies'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { AccelerationState } from '@/domain/entities/states/AccelerationState'
import { StrengthState } from '@/domain/entities/states/StrengthState'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'

type ScenarioSteps = {
  battleStart: number
  playerTurn1Start: number
  playMasochisticAura: number
  playHeavenChainOnOrc: number
  playBattlePrep: number
  endPlayerTurn1: number
  startEnemyTurn1: number
  orcActs: number
  orcDancerActs: number
  tentacleActs: number
  snailActs: number
  endEnemyTurn1: number
  startPlayerTurn2: number
  playHeavenChainOnTentacle: number
  playHeavenChainOnSnail: number
  playAcidSpitOnSnail: number
  endPlayerTurn2: number
  startEnemyTurn2: number
  orcActsSecond: number
  orcDancerActsSecond: number
  tentacleActsSecond: number
  snailActsSecond: number
  endEnemyTurn2: number
  startPlayerTurn3: number
  playFlurryOnSnail: number
  endPlayerTurn3: number
  startEnemyTurn3: number
  orcActsThird: number
}

function requireCardId(card: Card | undefined): number {
  if (!card || card.numericId === undefined) {
    throw new Error('Card missing repository id')
  }

  return card.numericId
}

interface BattleScenario {
  replayer: ActionLogReplayer
  steps: ScenarioSteps
  references: {
    masochisticAuraId: number
    heavenChainIds: number[]
    battlePrepIds: number[]
    enemyIds: {
      orc: number
      orcDancer: number
      tentacle: number
      snail: number
    }
  }
}

const battleSampleScenario = createBattleSampleScenario()
const Steps = battleSampleScenario.steps
const Refs = battleSampleScenario.references
const firstHeavenChainId = Refs.heavenChainIds[0]!
const secondHeavenChainId = Refs.heavenChainIds[1]!
const thirdHeavenChainId = Refs.heavenChainIds[2]!
const firstBattlePrepId = Refs.battlePrepIds[0]!
const fourthHeavenChainId = Refs.heavenChainIds[3]!
const secondBattlePrepId = Refs.battlePrepIds[1]!
const fifthHeavenChainId = Refs.heavenChainIds[4]!

function runScenario(stepIndex: number) {
  // ActionLogReplayerで指定インデックスまで再生し、試験用のバトル状態を取得するユーティリティ
  return battleSampleScenario.replayer.run(stepIndex)
}

function createBattleSampleScenario(): BattleScenario {
  // ===== テスト専用のバトル初期化関数 =====
  // 1. 既定デッキを生成しカードIDを採取
  // 2. 敵チームはRNGを固定して行動パターンを決定論的にする
  // 3. ActionLogを構築し、再生用の環境を返す
  const createBattle = (): Battle => {
    const cardRepository = new CardRepository()
    const defaultDeck = buildDefaultDeck(cardRepository)
    const player = new ProtagonistPlayer()
    const enemyTeam = new EnemyTeam({
      id: 'enemy-team-snail-encounter',
      members: [
        new OrcEnemy({ rng: () => 0.05 }),
        new OrcDancerEnemy({ rng: () => 0.85 }),
        new TentacleEnemy({ rng: () => 0.85 }),
        new SnailEnemy({ rng: () => 0.95 }),
      ],
    })

    return new Battle({
      id: 'battle-1',
      cardRepository,
      player,
      enemyTeam,
      deck: new Deck(defaultDeck.deck),
      hand: new Hand(),
      discardPile: new DiscardPile(),
      exilePile: new ExilePile(),
      events: new BattleEventQueue(),
      log: new BattleLog(),
      turn: new TurnManager(),
    })
  }

  const sampleBattle = createBattle()
  const sampleSnapshot = sampleBattle.getSnapshot()

  // ===== デッキ内カードのIDを抽出 =====
  const collectCardIdsByTitle = (title: string): number[] =>
    sampleSnapshot.deck.filter((card) => card.title === title).map((card) => requireCardId(card))

  const heavenChainIds = collectCardIdsByTitle('天の鎖')
  const battlePrepIds = collectCardIdsByTitle('戦いの準備')

  if (heavenChainIds.length < 3) {
    throw new Error('デフォルトデッキに天の鎖が3枚未満です')
  }
  if (battlePrepIds.length < 1) {
    throw new Error('デフォルトデッキに戦いの準備が含まれていません')
  }

  const masochisticAuraId = requireCardId(
    sampleSnapshot.deck.find((card) => card.title === '被虐のオーラ'),
  )

  const findEnemyId = (name: string): number => {
    const enemy = sampleSnapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in sample snapshot`)
    }

    return enemy.numericId
  }

  const enemyIds = {
    orc: findEnemyId('オーク'),
   orcDancer: findEnemyId('オークダンサー（短剣）'),
   tentacle: findEnemyId('触手'),
   snail: findEnemyId('かたつむり'),
  }

  // ===== 再生する行動ログの構築 =====
  // 戦闘ログの順序は以下の通り
  //  - 1ターン目：プレイヤー開始 → 被虐のオーラ → 天の鎖（オーク） → 戦いの準備
  //  - 1ターン目敵：オーク → ダンサー → 触手 → かたつむり
  //  - 2ターン目：プレイヤー開始 → 天の鎖（触手） → 天の鎖（かたつむり） → 記憶：酸を吐く
  //  - 2ターン目敵：オーク → ダンサー → 触手 → かたつむり
  //  - 3ターン目開始確認ステップ
  const actionLog = new ActionLog()

  const steps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAura: actionLog.push({
      type: 'play-card',
      card: masochisticAuraId,
      operations: [{ type: 'target-enemy', payload: enemyIds.snail }],
    }),
    playHeavenChainOnOrc: actionLog.push({
      type: 'play-card',
      card: heavenChainIds[0]!,
      operations: [{ type: 'target-enemy', payload: enemyIds.orc }],
    }),
    playBattlePrep: actionLog.push({
      type: 'play-card',
      card: battlePrepIds[0]!,
    }),
    endPlayerTurn1: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn1: actionLog.push({ type: 'start-enemy-turn' }),
    orcActs: actionLog.push({ type: 'enemy-action', enemy: enemyIds.orc }),
    orcDancerActs: actionLog.push({ type: 'enemy-action', enemy: enemyIds.orcDancer }),
    tentacleActs: actionLog.push({ type: 'enemy-action', enemy: enemyIds.tentacle }),
    snailActs: actionLog.push({ type: 'enemy-action', enemy: enemyIds.snail }),
    endEnemyTurn1: actionLog.push({ type: 'end-player-turn' }),
    startPlayerTurn2: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playHeavenChainOnTentacle: actionLog.push({
      type: 'play-card',
      card: heavenChainIds[1]!,
      operations: [{ type: 'target-enemy', payload: enemyIds.tentacle }],
    }),
    playHeavenChainOnSnail: actionLog.push({
      type: 'play-card',
      card: heavenChainIds[2]!,
      operations: [{ type: 'target-enemy', payload: enemyIds.snail }],
    }),
    playAcidSpitOnSnail: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) => candidate.title === '記憶：酸を吐く')
        if (!card) {
          throw new Error('手札に記憶：酸を吐くのカードが存在しません')
        }

        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: enemyIds.snail }],
    }),
    endPlayerTurn2: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn2: actionLog.push({ type: 'start-enemy-turn' }),
    orcActsSecond: actionLog.push({ type: 'enemy-action', enemy: enemyIds.orc }),
    orcDancerActsSecond: actionLog.push({ type: 'enemy-action', enemy: enemyIds.orcDancer }),
    tentacleActsSecond: actionLog.push({ type: 'enemy-action', enemy: enemyIds.tentacle }),
    snailActsSecond: actionLog.push({ type: 'enemy-action', enemy: enemyIds.snail }),
    endEnemyTurn2: actionLog.push({ type: 'end-player-turn' }),
    startPlayerTurn3: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playFlurryOnSnail: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) => candidate.title === '記憶：乱れ突き')
        if (!card) {
          throw new Error('手札に記憶：乱れ突きが存在しません')
        }
        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: enemyIds.snail }],
    }),
    endPlayerTurn3: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn3: actionLog.push({ type: 'start-enemy-turn' }),
    orcActsThird: actionLog.push({ type: 'enemy-action', enemy: enemyIds.orc }),
  } as const

  const replayer = new ActionLogReplayer({
    createBattle,
    actionLog,
  })

  return {
    replayer,
    steps,
    references: {
      masochisticAuraId,
      heavenChainIds,
      battlePrepIds,
      enemyIds,
    },
  }
}

describe('Battle sample scenario', () => {
  it('初回ドローフェイズで5枚引く', () => {
    // --- 検証目的 ---
    // プレイヤーターン開始時の初回ドローが5枚であること
    // HP・マナが初期状態のまま維持されていること
    const { snapshot, initialSnapshot } = runScenario(Steps.playerTurn1Start)

    expect(snapshot.hand.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(0, 5).map(requireCardId),
    )
    expect(snapshot.deck.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(5).map(requireCardId),
    )
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.player.currentHp).toBe(100)
  })

  it('被虐のオーラを発動し、かたつむりを即座に行動させる', () => {
    // --- 検証目的 ---
    // ・被虐のオーラ使用でマナ・HPが所定の値に変化する
    // ・敵を即時行動させた結果、該当敵のターン済フラグが立つ
    // ・敵行動ログから対象敵IDが取得できる
    // ・放出された立ち絵カードが手札へ追加される
    const { battle, snapshot, lastEntry } = runScenario(Steps.playMasochisticAura)

    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.player.currentHp).toBe(95)
    expect(battle.hand.hasCardOf(AcidSpitAction)).toBe(true)
    expect(battle.hand.hasCardOf(CorrosionState)).toBe(true)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBe(Refs.masochisticAuraId)
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    const masochisticAuraId = Refs.masochisticAuraId
    expect(battle.cardRepository.findWithLocation(masochisticAuraId)).toMatchObject({
      location: 'discardPile',
    })
    expect(snapshot.exilePile).toHaveLength(0)

    const snail = snapshot.enemies.find((enemy) => enemy.name === 'かたつむり')
    expect(snail?.hasActedThisTurn).toBe(true)
  })

  it('天の鎖でオークの行動を封じる', () => {
    // --- 検証目的 ---
    // ・天の鎖で対象敵にスキップアクションが挿入される
    // ・カードが除外ゾーンに送られる（消費タグの反映）
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnOrc)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBe(firstHeavenChainId)
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.orc)
    }

    expect(snapshot.player.currentMana).toBe(1)
    expect(snapshot.exilePile.map(requireCardId)).toContain(firstHeavenChainId)

    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    expect(orc).toBeDefined()
    expect(orc?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    expect(orc?.hasActedThisTurn).toBe(false)
  })

  it('戦いの準備でマナを使い切りカードを捨て札に送る', () => {
    // --- 検証目的 ---
    // ・非ターゲットスキルの操作引数が空であること
    // ・マナがゼロになること、および捨て札枚数が期待通りであること
    const { snapshot, lastEntry } = runScenario(Steps.playBattlePrep)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBe(firstBattlePrepId)
      expect(lastEntry.operations).toHaveLength(0)
    }

    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.discardPile.map(requireCardId)).toEqual([
      Refs.masochisticAuraId,
      firstBattlePrepId,
    ])
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        type: 'mana',
        scheduledTurn: 2,
        payload: expect.objectContaining({ amount: 1 }),
      }),
    ])
  })

  it('オークは封印されたため行動をスキップする', () => {
    // --- 検証目的 ---
    // ・天の鎖で即時行動キューに積まれたSkipTurnActionが実行されること
    // ・行動後、敵HPやプレイヤーHPに変化が出ないこと
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActs)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    expect(snapshot.player.currentHp).toBe(95)

    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    expect(orc?.hasActedThisTurn).toBe(true)
    const history = orc?.actionLog ?? []
    const finalAction = history[history.length - 1]
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('オークダンサーが戦いの舞いで加速(1)を得る', () => {
    // --- 検証目的 ---
    // ・戦いの舞いがAccelerationStateを自身に付与する
    // ・ログ上で対象敵IDを判別できること
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcDancerActs)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orcDancer)
    }

    const orcDancer = battle.enemyTeam.findEnemy(Refs.enemyIds.orcDancer)
    const history = orcDancer?.actionLog ?? []
    const finalAction = history[history.length - 1]
    expect(finalAction).toBeInstanceOf(BattleDanceAction)

    const orcDancerSnapshot = snapshot.enemies.find(
      (enemy) => enemy.numericId === Refs.enemyIds.orcDancer,
    )
    expect(orcDancerSnapshot?.states.some((state) => state instanceof AccelerationState)).toBe(true)
    expect(snapshot.player.currentHp).toBe(95)
  })

  it('触手の粘液飛ばしでプレイヤーが15ダメージを受け、被弾カードが手札に追加される', () => {
    // --- 検証目的 ---
    // ・粘液飛ばしによるダメージが適用され、対応する記憶カードがプレイヤーの手札へ追加される
    const { battle, snapshot, lastEntry } = runScenario(Steps.tentacleActs)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.tentacle)
    }

    expect(snapshot.player.currentHp).toBe(80)
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(true)
  })

  it('かたつむりは被虐のオーラで既に行動済みのため敵ターンでは何もしない', () => {
    // --- 検証目的 ---
    // ・被虐のオーラによる即時行動後は、敵ターンに再度行動しない
    // ・プレイヤーHPに追加ダメージが入らず、手札内容も増えない
    const { battle, snapshot, lastEntry } = runScenario(Steps.snailActs)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.snail)
    }

    expect(snapshot.player.currentHp).toBe(80)

    const hand = battle.hand.list()
    const acidMemoryCount = hand.filter((card) => card.title === '記憶：酸を吐く').length
    expect(acidMemoryCount).toBe(1)
    expect(hand.some((card) => card.title === '記憶：たいあたり')).toBe(false)
    expect(battle.hand.hasCardOf(TackleAction)).toBe(false)
  })

  it('２ターン目のドローフェイズで手札が整い、マナが４になる', () => {
    const { snapshot, lastEntry } = runScenario(Steps.startPlayerTurn2)

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(snapshot.player.currentMana).toBe(4)
    expect(snapshot.hand).toHaveLength(7)

    const handIds = snapshot.hand.map(requireCardId)
    expect(handIds).toEqual(
      expect.arrayContaining([
        secondHeavenChainId,
        thirdHeavenChainId,
        fourthHeavenChainId,
        secondBattlePrepId,
      ]),
    )
    expect(snapshot.events).toHaveLength(0)
    expect(snapshot.deck.map(requireCardId)).toEqual([fifthHeavenChainId])
  })

  it('２ターン目に天の鎖で触手を封じる', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnTentacle)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBe(secondHeavenChainId)
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.tentacle)
    }

    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.hand.map(requireCardId)).not.toContain(secondHeavenChainId)
    expect(snapshot.exilePile.map(requireCardId)).toContain(secondHeavenChainId)
    expect(battle.cardRepository.findWithLocation(secondHeavenChainId)).toMatchObject({
      location: 'exilePile',
    })

    const tentacle = battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    expect(tentacle?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    expect(tentacle?.hasActedThisTurn).toBe(false)
  })

  it('２ターン目に天の鎖でかたつむりを封じる', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnSnail)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBe(thirdHeavenChainId)
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.exilePile.map(requireCardId)).toContain(thirdHeavenChainId)
    expect(snapshot.hand.map(requireCardId)).not.toContain(thirdHeavenChainId)
    expect(battle.cardRepository.findWithLocation(thirdHeavenChainId)).toMatchObject({
      location: 'exilePile',
    })

    const snail = battle.enemyTeam.findEnemy(Refs.enemyIds.snail)
    expect(snail?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    expect(snail?.hasActedThisTurn).toBe(false)
  })

  it('酸を吐くでかたつむりに腐食(1)を付与する', () => {
    const { snapshot, battle, lastEntry } = runScenario(Steps.playAcidSpitOnSnail)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    expect(snapshot.player.currentMana).toBe(1)

    const snail = snapshot.enemies.find((enemy) => enemy.numericId === Refs.enemyIds.snail)
    expect(snail?.currentHp).toBe(10)
    expect(snail?.states.some((state) => state instanceof CorrosionState && state.magnitude === 1)).toBe(true)

    expect(snapshot.discardPile.some((card) => card.title === '記憶：酸を吐く')).toBe(true)
    expect(battle.hand.hasCardOf(AcidSpitAction)).toBe(false)
  })

  it('２ターン目の敵ターン開始で敵側フェーズへ移行する', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.startEnemyTurn2)

    expect(lastEntry?.type).toBe('start-enemy-turn')
    expect(battle.turn.current.activeSide).toBe('enemy')
    expect(snapshot.player.currentMana).toBe(1)
  })

  it('２ターン目の敵ターンでオークがビルドアップを行う', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActsSecond)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    expect(snapshot.player.currentHp).toBe(80)

    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    expect(orc?.states.some((state) => state instanceof StrengthState && state.magnitude === 10)).toBe(true)
  })

  it('２ターン目の敵ターンでオークダンサーが強化された乱れ突きを行う', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcDancerActsSecond)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orcDancer)
    }

    expect(snapshot.player.currentHp).toBe(20)
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(true)
    expect(battle.hand.hasCardOf(CorrosionState)).toBe(true)

    const rememberedFlurry = battle.hand
      .list()
      .find((card) => card.title === '記憶：乱れ突き')
    expect(rememberedFlurry).toBeDefined()
    const action = rememberedFlurry?.action
    expect(action).toBeInstanceOf(FlurryAction)
    if (action instanceof FlurryAction) {
      expect(action.baseDamages.amount).toBe(20)
      expect(action.baseDamages.count).toBe(3)
    }
  })

  it('２ターン目の敵ターンで天の鎖を受けた触手は行動できない', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.tentacleActsSecond)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.tentacle)
    }

    expect(snapshot.player.currentHp).toBe(20)
    const tentacle = battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    const history = tentacle?.actionLog ?? []
    const finalAction = history[history.length - 1]
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('２ターン目の敵ターンで天の鎖を受けたかたつむりは行動できない', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.snailActsSecond)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.snail)
    }

    expect(snapshot.player.currentHp).toBe(20)
    const snail = battle.enemyTeam.findEnemy(Refs.enemyIds.snail)
    const history = snail?.actionLog ?? []
    const finalAction = history[history.length - 1]
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('３ターン目のドローフェイズで山札がリフレッシュされる', () => {
    const { snapshot, lastEntry } = runScenario(Steps.startPlayerTurn3)

    expect(lastEntry?.type).toBe('start-player-turn')
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.hand.map(requireCardId)).toEqual(expect.arrayContaining([fifthHeavenChainId]))
    expect(snapshot.hand.some((card) => card.title === '記憶：酸を吐く')).toBe(true)
    expect(snapshot.discardPile).toHaveLength(0)
    expect(snapshot.deck.map(requireCardId)).toEqual(
      expect.arrayContaining([Refs.masochisticAuraId, firstBattlePrepId]),
    )
    expect(snapshot.deck).toHaveLength(2)
  })

  it('記憶：乱れ突きでかたつむりを撃破する', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.playFlurryOnSnail)

    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      expect(lastEntry.cardId).toBeDefined()
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    expect(snapshot.player.currentMana).toBe(2)

    const snail = snapshot.enemies.find((enemy) => enemy.numericId === Refs.enemyIds.snail)
    expect(snail?.currentHp).toBe(0)
    expect(snail?.states.some((state) => state instanceof CorrosionState)).toBe(true)
    expect(snapshot.discardPile.some((card) => card.title === '記憶：乱れ突き')).toBe(true)
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(false)
  })

  it('３ターン目の敵ターンでオークのたいあたりが決着を付ける', () => {
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActsThird)

    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    expect(snapshot.player.currentHp).toBe(0)

    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    const history = orc?.actionLog ?? []
    const finalAction = history[history.length - 1]
    expect(finalAction).toBeInstanceOf(TackleAction)
  })
})
