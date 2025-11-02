// このテストファイルでは、被虐のオーラ戦闘シナリオの進行と副作用を網羅的に検証する。
// 各テストは「状況設定」「結果検証」の2セクションで構成し、あらゆるexpect直前に検証意図を日本語コメントで明記する。
// さらに、手札が変動するケースでは必ず手札枚数の検証を含める。
import { describe, it, expect } from 'vitest'

import {
  AccelerationState,
  AcidSpitAction,
  BattleDanceAction,
  CorrosionState,
  FlurryAction,
  MucusShotAction,
  SkipTurnAction,
  StickyState,
  StrengthState,
  TackleAction,
  createBattleSampleScenario,
  createBattleSampleScenarioPattern2,
  createBattleSampleScenarioPattern3,
  requireCardId,
} from '../fixtures/battleSampleScenario'

const battleSampleScenario = createBattleSampleScenario()
const Steps = battleSampleScenario.steps as Record<string, number>
const Refs = battleSampleScenario.references
const firstHeavenChainId = Refs.heavenChainIds[0]!
const secondHeavenChainId = Refs.heavenChainIds[1]!
const thirdHeavenChainId = Refs.heavenChainIds[2]!
const firstBattlePrepId = Refs.battlePrepIds[0]!
const fourthHeavenChainId = Refs.heavenChainIds[3]!
const secondBattlePrepId = Refs.battlePrepIds[1]!
const fifthHeavenChainId = Refs.heavenChainIds[4]!

function runScenario(stepIndex: number | undefined) {
  if (stepIndex === undefined) {
    throw new Error('Step index is undefined')
  }
  // ActionLogReplayerで指定インデックスまで再生し、試験用のバトル状態を取得するユーティリティ
  return battleSampleScenario.replayer.run(stepIndex)
}

const battleSampleScenarioPattern2 = createBattleSampleScenarioPattern2()
const StepsPattern2 = battleSampleScenarioPattern2.steps as Record<string, number>
const RefsPattern2 = battleSampleScenarioPattern2.references
const fifthHeavenChainIdPattern2 = RefsPattern2.heavenChainIds[4]!

function runScenarioPattern2(stepIndex: number | undefined) {
  if (stepIndex === undefined) {
    throw new Error('Step index is undefined')
  }
  return battleSampleScenarioPattern2.replayer.run(stepIndex)
}

const battleSampleScenarioPattern3 = createBattleSampleScenarioPattern3()
const StepsPattern3 = battleSampleScenarioPattern3.steps as Record<string, number>
const RefsPattern3 = battleSampleScenarioPattern3.references

function runScenarioPattern3(stepIndex: number | undefined) {
  if (stepIndex === undefined) {
    throw new Error('Step index is undefined')
  }
  return battleSampleScenarioPattern3.replayer.run(stepIndex)
}

describe('Battle sample scenario', () => {
  it('初回ドローフェイズで5枚引く', () => {
    // -- 状況設定 --
    // プレイヤーターン開始直後のドローフェイズのスナップショットを取得する
    const { snapshot, initialSnapshot } = runScenario(Steps.playerTurn1Start)

    // -- 結果検証 --
    // 手札枚数が5枚であることを確認する
    expect(snapshot.hand).toHaveLength(5)
    // 手札のカードIDが初期山札の先頭5枚と一致することを確認する
    expect(snapshot.hand.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(0, 5).map(requireCardId),
    )
    // 山札の内容が初期山札の6枚目以降と一致することを確認する
    expect(snapshot.deck.map(requireCardId)).toEqual(
      initialSnapshot.deck.slice(5).map(requireCardId),
    )
    // プレイヤーの現在マナが3のままであることを確認する
    expect(snapshot.player.currentMana).toBe(3)
    // プレイヤーの現在HPが100のままであることを確認する
    expect(snapshot.player.currentHp).toBe(100)
  })

  
  it('被虐のオーラを発動し、かたつむりを即座に行動させる', () => {
    // -- 状況設定 --
    // プレイヤーターン1で被虐のオーラをプレイした直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.playMasochisticAura)
    // 状況確認：被虐のオーラがかたつむりを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 被虐のオーラがプレイされたことを確認する
      expect(lastEntry.cardId).toBe(Refs.masochisticAuraId)
      // 対象敵がかたつむりであることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが2に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(2)
    // プレイヤーの現在HPが95に減少していることを確認する
    expect(snapshot.player.currentHp).toBe(95)
    // 手札枚数が6枚になっていることを確認する
    expect(snapshot.hand).toHaveLength(6)
    // 手札に記憶：酸を吐くが存在することを確認する
    expect(battle.hand.hasCardOf(AcidSpitAction)).toBe(true)
    // 手札に状態カード：腐食が存在することを確認する
    expect(battle.hand.hasCardOf(CorrosionState)).toBe(true)
    const masochisticAuraId = Refs.masochisticAuraId
    // 被虐のオーラが捨て札に移動していることを確認する
    expect(battle.cardRepository.findWithLocation(masochisticAuraId)).toMatchObject({
      location: 'discardPile',
    })
    // 除外ゾーンが空であることを確認する
    expect(snapshot.exilePile).toHaveLength(0)
    const snail = snapshot.enemies.find((enemy) => enemy.name === 'かたつむり')
    // かたつむりが行動済み状態になっていることを確認する
    expect(snail?.hasActedThisTurn).toBe(true)
  })

  it('天の鎖でオークの行動を封じる', () => {
    // -- 状況設定 --
    // プレイヤーターン1で天の鎖をオークへ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnOrc)
    // 状況確認：天の鎖がオークを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが１枚目の天の鎖であることを確認する
      expect(lastEntry.cardId).toBe(firstHeavenChainId)
      // 対象敵がオークであることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.orc)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが1に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(1)
    // 手札枚数が5枚になっていることを確認する
    expect(snapshot.hand).toHaveLength(5)
    // 除外ゾーンに天の鎖が移動していることを確認する
    expect(snapshot.exilePile.map(requireCardId)).toContain(firstHeavenChainId)
    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    // オークのインスタンスが取得できていることを確認する
    expect(orc).toBeDefined()
    // オークの行動キュー先頭がSkipTurnActionであることを確認する
    expect(orc?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    // オークがまだ行動していないことを確認する
    expect(orc?.hasActedThisTurn).toBe(false)
  })

  it('戦いの準備でマナを使い切りカードを捨て札に送る', () => {
    // -- 状況設定 --
    // プレイヤーターン1で戦いの準備をプレイした直後のスナップショットを取得する
    const { snapshot, lastEntry } = runScenario(Steps.playBattlePrep)
    // 状況確認：戦いの準備が操作指定なしでプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが戦いの準備であることを確認する
      expect(lastEntry.cardId).toBe(firstBattlePrepId)
      // 操作キューが空であることを確認する
      expect(lastEntry.operations).toHaveLength(0)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが0になっていることを確認する
    expect(snapshot.player.currentMana).toBe(0)
    // 手札枚数が4枚になっていることを確認する
    expect(snapshot.hand).toHaveLength(4)
    // 捨て札に被虐のオーラと戦いの準備が並んでいることを確認する
    expect(snapshot.discardPile.map(requireCardId)).toEqual([
      Refs.masochisticAuraId,
      firstBattlePrepId,
    ])
    // ターン2開始でマナが1回復するイベントが予約されていることを確認する
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        type: 'mana',
        scheduledTurn: 2,
        payload: expect.objectContaining({ amount: 1 }),
      }),
    ])
  })

  it('オークは封印されたため行動をスキップする', () => {
    // -- 状況設定 --
    // オークが敵ターンで行動処理された直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActs)
    // 状況確認：オークの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが95で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(95)
    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    // オークが行動済み状態になっていることを確認する
    expect(orc?.hasActedThisTurn).toBe(true)
    const history = orc?.actionLog ?? []
    const finalAction = history[history.length - 1]
    // 最後に実行された行動がSkipTurnActionであることを確認する
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('オークダンサーが戦いの舞いで加速(1)を得る', () => {
    // -- 状況設定 --
    // オークダンサーの戦いの舞いが実行された直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcDancerActs)
    // 状況確認：オークダンサーの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークダンサーであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orcDancer)
    }

    // -- 結果検証 --
    const orcDancer = battle.enemyTeam.findEnemy(Refs.enemyIds.orcDancer)
    const history = orcDancer?.actionLog ?? []
    const finalAction = history[history.length - 1]
    // 最後の行動がBattleDanceActionであることを確認する
    expect(finalAction).toBeInstanceOf(BattleDanceAction)
    const orcDancerSnapshot = snapshot.enemies.find(
      (enemy) => enemy.numericId === Refs.enemyIds.orcDancer,
    )
    // オークダンサーにAccelerationStateが付与されていることを確認する
    expect(orcDancerSnapshot?.states.some((state) => state instanceof AccelerationState)).toBe(true)
    // プレイヤーの現在HPが95で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(95)
  })

  it('触手の粘液飛ばしでプレイヤーが15ダメージを受け、被弾カードが手札に追加される', () => {
    // -- 状況設定 --
    // 触手の粘液飛ばしが解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.tentacleActs)
    // 状況確認：触手の行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵が触手であることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.tentacle)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが80まで減少していることを確認する
    expect(snapshot.player.currentHp).toBe(80)
    const currentHandSize = battle.hand.list().length
    // 敵攻撃後の手札枚数が6枚であることを確認する
    expect(currentHandSize).toBe(6)
    // 手札に「記憶：粘液飛ばし」と「状態異常：ねばねば」が追加されていることを確認する
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(true)
    expect(battle.hand.hasCardOf(StickyState)).toBe(true)
  })

  it('かたつむりは被虐のオーラで既に行動済みのため敵ターンでは何もしない', () => {
    // -- 状況設定 --
    // かたつむりの敵ターン処理が行われた直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.snailActs)
    // 状況確認：かたつむりの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がかたつむりであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが80で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(80)
    const hand = battle.hand.list()
    // 手札枚数が5枚のままであることを確認する
    expect(hand).toHaveLength(5)
    // 手札内の記憶：酸を吐くの枚数が1枚であることを確認する
    const acidMemoryCount = hand.filter((card) => card.title === '記憶：酸を吐く').length
    // 記憶：酸を吐くの枚数が1枚に保たれていることを確認する
    expect(acidMemoryCount).toBe(1)
    // 手札に記憶：たいあたりが存在しないことを確認する
    expect(hand.some((card) => card.title === '記憶：たいあたり')).toBe(false)
    // 手札にTackleActionカードが存在しないことを確認する
    expect(battle.hand.hasCardOf(TackleAction)).toBe(false)
  })

  it('２ターン目のドローフェイズで手札が整い、マナが４になる', () => {
    // -- 状況設定 --
    // ２ターン目開始時のドローフェイズ直後のスナップショットを取得する
    const { snapshot, lastEntry } = runScenario(Steps.startPlayerTurn2)
    // 状況確認：プレイヤーターン開始イベントが記録されていることを確認する
    expect(lastEntry?.type).toBe('start-player-turn')

    // -- 結果検証 --
    // プレイヤーの現在マナが4になっていることを確認する
    expect(snapshot.player.currentMana).toBe(4)
    // ドロー後の手札枚数が7枚であることを確認する
    expect(snapshot.hand).toHaveLength(7)
    const handIds = snapshot.hand.map(requireCardId)
    // 手札に指定したカードID群が含まれていることを確認する
    expect(handIds).toEqual(
      expect.arrayContaining([
        secondHeavenChainId,
        thirdHeavenChainId,
        fourthHeavenChainId,
        secondBattlePrepId,
      ]),
    )
    // 予約イベントが空であることを確認する
    expect(snapshot.events).toHaveLength(0)
    // 山札の内容が想定どおり1枚だけ残っていることを確認する
    expect(snapshot.deck.map(requireCardId)).toEqual([fifthHeavenChainId])
  })

  it('２ターン目に天の鎖で触手を封じる', () => {
    // -- 状況設定 --
    // ２ターン目に天の鎖を触手へ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnTentacle)
    // 状況確認：天の鎖が触手を対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが２枚目の天の鎖であることを確認する
      expect(lastEntry.cardId).toBe(secondHeavenChainId)
      // 対象敵が触手であることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.tentacle)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが3に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(3)
    // プレイ後の手札枚数が7枚であることを確認する
    expect(snapshot.hand).toHaveLength(7)
    // 手札から天の鎖が取り除かれていることを確認する
    expect(snapshot.hand.map(requireCardId)).not.toContain(secondHeavenChainId)
    // 除外ゾーンに天の鎖が移動していることを確認する
    expect(snapshot.exilePile.map(requireCardId)).toContain(secondHeavenChainId)
    // カードリポジトリ上でも除外ゾーン扱いになっていることを確認する
    expect(battle.cardRepository.findWithLocation(secondHeavenChainId)).toMatchObject({
      location: 'exilePile',
    })
    const tentacle = battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    // 触手の行動キュー先頭がSkipTurnActionであることを確認する
    expect(tentacle?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    // 触手がまだ行動していないことを確認する
    expect(tentacle?.hasActedThisTurn).toBe(false)
  })

  it('２ターン目に天の鎖でかたつむりを封じる', () => {
    // -- 状況設定 --
    // ２ターン目に天の鎖をかたつむりへ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.playHeavenChainOnSnail)
    // 状況確認：天の鎖がかたつむりを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが３枚目の天の鎖であることを確認する
      expect(lastEntry.cardId).toBe(thirdHeavenChainId)
      // 対象敵がかたつむりであることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが2に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(2)
    // プレイ後の手札枚数が6枚であることを確認する
    expect(snapshot.hand).toHaveLength(6)
    // 除外ゾーンに対象の天の鎖が移動していることを確認する
    expect(snapshot.exilePile.map(requireCardId)).toContain(thirdHeavenChainId)
    // 手札から天の鎖が取り除かれていることを確認する
    expect(snapshot.hand.map(requireCardId)).not.toContain(thirdHeavenChainId)
    // カードリポジトリ上でも除外ゾーン扱いになっていることを確認する
    expect(battle.cardRepository.findWithLocation(thirdHeavenChainId)).toMatchObject({
      location: 'exilePile',
    })
    const snail = battle.enemyTeam.findEnemy(Refs.enemyIds.snail)
    // かたつむりの行動キュー先頭がSkipTurnActionであることを確認する
    expect(snail?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
    // かたつむりがまだ行動していないことを確認する
    expect(snail?.hasActedThisTurn).toBe(false)
  })

  it('酸を吐くでかたつむりに腐食(1)を付与する', () => {
    // -- 状況設定 --
    // 記憶：酸を吐くをかたつむりへ使用した直後のスナップショットを取得する
    const { snapshot, battle, lastEntry } = runScenario(Steps.playAcidSpitOnSnail)
    // 状況確認：記憶：酸を吐くがかたつむりを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象敵がかたつむりであることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが1に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(1)
    // プレイ後の手札枚数が5枚であることを確認する
    expect(snapshot.hand).toHaveLength(5)
    const snail = snapshot.enemies.find((enemy) => enemy.numericId === Refs.enemyIds.snail)
    // かたつむりの現在HPが10になっていることを確認する
    expect(snail?.currentHp).toBe(10)
    // かたつむりに腐食(1)が付与されていることを確認する
    expect(
      snail?.states.some((state) => state instanceof CorrosionState && state.magnitude === 1),
    ).toBe(true)
    // 使用した記憶：酸を吐くが捨て札に移動していることを確認する
    expect(snapshot.discardPile.some((card) => card.title === '記憶：酸を吐く')).toBe(true)
    // 手札から記憶：酸を吐くがなくなっていることを確認する
    expect(battle.hand.hasCardOf(AcidSpitAction)).toBe(false)
  })

  it('２ターン目の敵ターン開始で敵側フェーズへ移行する', () => {
    // -- 状況設定 --
    // ２ターン目プレイヤーフェイズ終了後、敵ターン開始イベント直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.startEnemyTurn2)
    // 状況確認：敵ターン開始イベントが記録されていることを確認する
    expect(lastEntry?.type).toBe('start-enemy-turn')

    // -- 結果検証 --
    // ターンマネージャのアクティブサイドが敵になっていることを確認する
    expect(battle.turn.current.activeSide).toBe('enemy')
    // プレイヤーの現在マナが1であることを確認する
    expect(snapshot.player.currentMana).toBe(1)
  })

  it('２ターン目の敵ターンでオークがビルドアップを行う', () => {
    // -- 状況設定 --
    // ２ターン目敵ターンでオークの行動が解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActsSecond)
    // 状況確認：オークの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが80で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(80)
    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    // オークにStrengthState(10)が付与されていることを確認する
    expect(
      orc?.states.some((state) => state instanceof StrengthState && state.magnitude === 10),
    ).toBe(true)
  })

  it('２ターン目の敵ターンでオークダンサーが強化された乱れ突きを行う', () => {
    // -- 状況設定 --
    // ２ターン目敵ターンでオークダンサーの行動が解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcDancerActsSecond)
    // 状況確認：オークダンサーの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークダンサーであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orcDancer)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが20まで減少していることを確認する
    expect(snapshot.player.currentHp).toBe(20)
    const currentHandSize = battle.hand.list().length
    // 乱れ突きの記憶が追加され手札が増えていることを確認する
    expect(currentHandSize).toBeGreaterThan(5)
    // 手札に記憶：乱れ突きが存在することを確認する
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(true)
    // 手札に状態カード：腐食が残っていることを確認する
    expect(battle.hand.hasCardOf(CorrosionState)).toBe(true)

    const rememberedFlurry = battle.hand
      .list()
      .find((card) => card.title === '記憶：乱れ突き')
    // 追加された記憶カードが存在することを確認する
    expect(rememberedFlurry).toBeDefined()
    const action = rememberedFlurry?.action
    // 記憶カードのアクションがFlurryActionであることを確認する
    expect(action).toBeInstanceOf(FlurryAction)
    if (action instanceof FlurryAction) {
      // 乱れ突きの基礎ダメージが20であることを確認する
      expect(action.baseDamages.amount).toBe(20)
      // 乱れ突きのヒット数が3回であることを確認する
      expect(action.baseDamages.count).toBe(3)
    }
  })

  it('２ターン目の敵ターンで天の鎖を受けた触手は行動できない', () => {
    // -- 状況設定 --
    // ２ターン目敵ターンで触手の行動が解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.tentacleActsSecond)
    // 状況確認：触手の行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵が触手であることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.tentacle)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが20で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(20)
    const tentacle = battle.enemyTeam.findEnemy(Refs.enemyIds.tentacle)
    const history = tentacle?.actionLog ?? []
    const finalAction = history[history.length - 1]
    // 最後に実行された行動がSkipTurnActionであることを確認する
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('２ターン目の敵ターンで天の鎖を受けたかたつむりは行動できない', () => {
    // -- 状況設定 --
    // ２ターン目敵ターンでかたつむりの行動が解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.snailActsSecond)
    // 状況確認：かたつむりの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がかたつむりであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが20で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(20)
    const snail = battle.enemyTeam.findEnemy(Refs.enemyIds.snail)
    const history = snail?.actionLog ?? []
    const finalAction = history[history.length - 1]
    // 最後に実行された行動がSkipTurnActionであることを確認する
    expect(finalAction).toBeInstanceOf(SkipTurnAction)
  })

  it('３ターン目のドローフェイズで山札がリフレッシュされる', () => {
    // -- 状況設定 --
    // ３ターン目開始時のドローフェイズ直後のスナップショットを取得する
    const { snapshot, lastEntry } = runScenario(Steps.startPlayerTurn3)
    // 状況確認：プレイヤーターン開始イベントが記録されていることを確認する
    expect(lastEntry?.type).toBe('start-player-turn')

    // -- 結果検証 --
    // プレイヤーの現在マナが3になっていることを確認する
    expect(snapshot.player.currentMana).toBe(3)
    // ドロー後の手札枚数が5枚以上であることを確認する
    expect(snapshot.hand.length).toBeGreaterThanOrEqual(5)
    // 手札に天の鎖（5枚目）が含まれていることを確認する
    expect(snapshot.hand.map(requireCardId)).toEqual(
      expect.arrayContaining([fifthHeavenChainId]),
    )
    // 手札に記憶：酸を吐くが含まれていることを確認する
    expect(snapshot.hand.some((card) => card.title === '記憶：酸を吐く')).toBe(true)
    // 捨て札が空であることを確認する
    expect(snapshot.discardPile).toHaveLength(0)
    // 山札に被虐のオーラと戦いの準備が戻っていることを確認する
    expect(snapshot.deck.map(requireCardId)).toEqual(
      expect.arrayContaining([Refs.masochisticAuraId, firstBattlePrepId]),
    )
    // 山札枚数が2枚であることを確認する
    expect(snapshot.deck).toHaveLength(2)
  })

  it('記憶：乱れ突きでかたつむりを撃破する', () => {
    // -- 状況設定 --
    // ３ターン目に記憶：乱れ突きをかたつむりへ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.playFlurryOnSnail)
    // 状況確認：記憶：乱れ突きがかたつむりを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 記憶：乱れ突きがプレイされていることを確認する
      expect(lastEntry.cardId).toBeDefined()
      // 対象敵がかたつむりであることを確認する
      expect(lastEntry.targetEnemyId).toBe(Refs.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが2に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(2)
    // プレイ後の手札枚数が4枚以下になっていることを確認する
    expect(snapshot.hand.length).toBeLessThanOrEqual(4)
    const snail = snapshot.enemies.find((enemy) => enemy.numericId === Refs.enemyIds.snail)
    // かたつむりのHPが0になっていることを確認する
    expect(snail?.currentHp).toBe(0)
    // 腐食状態が維持されていることを確認する
    expect(snail?.states.some((state) => state instanceof CorrosionState)).toBe(true)
    // 記憶：乱れ突きが捨て札に移動していることを確認する
    expect(snapshot.discardPile.some((card) => card.title === '記憶：乱れ突き')).toBe(true)
    // 手札から記憶：乱れ突きがなくなっていることを確認する
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(false)
  })

  it('３ターン目の敵ターンでオークのたいあたりが決着を付ける', () => {
    // -- 状況設定 --
    // ３ターン目敵ターンでオークのたいあたりが解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenario(Steps.orcActsThird)
    // 状況確認：オークの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークであることを確認する
      expect(lastEntry.enemy).toBe(Refs.enemyIds.orc)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが0になっていることを確認する
    expect(snapshot.player.currentHp).toBe(0)
    const orc = battle.enemyTeam.findEnemy(Refs.enemyIds.orc)
    const history = orc?.actionLog ?? []
    const finalAction = history[history.length - 1]
    // 最後に実行された行動がTackleActionであることを確認する
    expect(finalAction).toBeInstanceOf(TackleAction)
  })

  it('記憶：乱れ突きでオークを撃破する（パターン2）', () => {
    // -- 状況設定 --
    // パターン2で記憶：乱れ突きをオークへ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern2(StepsPattern2.playFlurryOnOrc)
    // 状況確認：記憶：乱れ突きがオークを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象敵がオークであることを確認する
      expect(lastEntry.targetEnemyId).toBe(RefsPattern2.enemyIds.orc)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが2に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(2)
    // プレイ後の手札枚数が減少していることを確認する
    expect(snapshot.hand.length).toBeLessThanOrEqual(4)
    const orc = snapshot.enemies.find((enemy) => enemy.numericId === RefsPattern2.enemyIds.orc)
    // オークのHPが0になっていることを確認する
    expect(orc?.currentHp).toBe(0)
    // 記憶：乱れ突きが捨て札に移動していることを確認する
    expect(snapshot.discardPile.some((card) => card.title === '記憶：乱れ突き')).toBe(true)
    // 手札から記憶：乱れ突きがなくなっていることを確認する
    expect(battle.hand.hasCardOf(FlurryAction)).toBe(false)
  })

  it('記憶：粘液飛ばしでオークダンサーにねばねばを付与する（パターン2）', () => {
    // -- 状況設定 --
    // パターン2で記憶：粘液飛ばしをオークダンサーへ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern2(
      StepsPattern2.playMucusShotOnOrcDancer,
    )
    // 状況確認：記憶：粘液飛ばしがオークダンサーを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象敵がオークダンサーであることを確認する
      expect(lastEntry.targetEnemyId).toBe(RefsPattern2.enemyIds.orcDancer)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが1に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(1)
    // プレイ後の手札枚数が減少していることを確認する
    expect(snapshot.hand.length).toBeLessThanOrEqual(4)
    const orcDancer = snapshot.enemies.find(
      (enemy) => enemy.numericId === RefsPattern2.enemyIds.orcDancer,
    )
    // オークダンサーのHPが35になっていることを確認する
    expect(orcDancer?.currentHp).toBe(35)
    const stickyMagnitude = (orcDancer?.states ?? [])
      .filter((state) => state instanceof StickyState)
      .reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    // ねばねばの付与量が1であることを確認する
    expect(stickyMagnitude).toBe(1)
    // 記憶：粘液飛ばしが捨て札に移動していることを確認する
    expect(snapshot.discardPile.some((card) => card.title === '記憶：粘液飛ばし')).toBe(true)
    // 手札から記憶：粘液飛ばしがなくなっていることを確認する
    expect(battle.hand.hasCardOf(MucusShotAction)).toBe(false)
  })

  it('３枚目の天の鎖で触手を拘束する（パターン2）', () => {
    // -- 状況設定 --
    // パターン2で３枚目の天の鎖を触手へ使用した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern2(
      StepsPattern2.playHeavenChainOnTentacleTurn3,
    )
    // 状況確認：天の鎖が触手を対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象敵が触手であることを確認する
      expect(lastEntry.targetEnemyId).toBe(RefsPattern2.enemyIds.tentacle)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが0になっていることを確認する
    expect(snapshot.player.currentMana).toBe(0)
    // プレイ後の手札枚数が減少していることを確認する
    expect(snapshot.hand.length).toBeLessThanOrEqual(3)
    // 除外ゾーンに天の鎖が移動していることを確認する
    expect(snapshot.exilePile.map(requireCardId)).toContain(fifthHeavenChainIdPattern2)
    const tentacle = battle.enemyTeam.findEnemy(RefsPattern2.enemyIds.tentacle)
    // 触手の行動キュー先頭がSkipTurnActionであることを確認する
    expect(tentacle?.queuedActions[0]).toBeInstanceOf(SkipTurnAction)
  })

  it('オークダンサーが戦いの舞いで加速(2)になる（パターン2）', () => {
    // -- 状況設定 --
    // パターン2でオークダンサーの戦いの舞いが解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern2(
      StepsPattern2.orcDancerActsThirdAlt,
    )
    // 状況確認：オークダンサーの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がオークダンサーであることを確認する
      expect(lastEntry.enemy).toBe(RefsPattern2.enemyIds.orcDancer)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが20で維持されていることを確認する
    expect(snapshot.player.currentHp).toBe(20)
    const orcDancer = battle.enemyTeam.findEnemy(RefsPattern2.enemyIds.orcDancer)
    const accelerationMagnitude = (orcDancer?.states ?? [])
      .filter((state) => state instanceof AccelerationState)
      .reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    // 加速状態の合計値が2であることを確認する
    expect(accelerationMagnitude).toBe(2)
  })

  it('かたつむりの酸を吐くでHPが5になり腐食が2枚になる（パターン2）', () => {
    // -- 状況設定 --
    // パターン2でかたつむりの酸を吐くが解決した直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern2(StepsPattern2.snailActsThirdAlt)
    // 状況確認：かたつむりの行動ログが記録されていることを確認する
    expect(lastEntry?.type).toBe('enemy-action')
    if (lastEntry?.type === 'enemy-action') {
      // 行動した敵がかたつむりであることを確認する
      expect(lastEntry.enemy).toBe(RefsPattern2.enemyIds.snail)
    }

    // -- 結果検証 --
    // プレイヤーの現在HPが5まで減少していることを確認する
    expect(snapshot.player.currentHp).toBe(5)
    const corrosionCards = battle.hand.list().filter((card) => card.state instanceof CorrosionState)
    // 手札に腐食状態カードが2枚あることを確認する
    expect(corrosionCards).toHaveLength(2)
    const totalCorrosion = battle.player
      .getStates()
      .filter((state) => state instanceof CorrosionState)
      .reduce((sum, state) => sum + (state.magnitude ?? 0), 0)
    // プレイヤーに累計腐食2が付与されていることを確認する
    expect(totalCorrosion).toBe(2)
  })
})

describe('Battle sample scenario pattern3（状態カード利用）', () => {
  it('被虐のオーラ使用直後に腐食カードと腐食(1)状態を得る', () => {
    // -- 状況設定 --
    // パターン3で被虐のオーラをプレイした直後のスナップショットを取得する
    const { battle, snapshot, lastEntry } = runScenarioPattern3(
      StepsPattern3.playMasochisticAura,
    )
    // 状況確認：被虐のオーラがかたつむりを対象にプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが被虐のオーラであることを確認する
      expect(lastEntry.cardId).toBe(RefsPattern3.masochisticAuraId)
      // 対象敵がかたつむりであることを確認する
      expect(lastEntry.targetEnemyId).toBe(RefsPattern3.enemyIds.snail)
    }

    // -- 結果検証 --
    // 手札に腐食カードが追加されていることを確認する
    const corrosionCard = battle.hand.list().find((card) => card.title === '腐食')
    // 腐食カードが手札に存在することを確認する
    expect(corrosionCard).toBeDefined()
    // 腐食カードがアクションを持たないことを確認する
    expect(corrosionCard?.action).toBeUndefined()
    // 腐食カードがCorrosionStateを参照していることを確認する
    expect(corrosionCard?.state).toBeInstanceOf(CorrosionState)

    // プレイヤーの現在マナが2に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(2)
    // 手札枚数が6枚以上になっていることを確認する
    expect(snapshot.hand.length).toBeGreaterThanOrEqual(6)
    // 手札に腐食カードが存在することを確認する
    expect(snapshot.hand.some((card) => card.title === '腐食')).toBe(true)

    const corrosionMagnitudes = battle.player
      .getStates()
      .filter((state) => state instanceof CorrosionState)
      .map((state) => state.magnitude ?? 0)
    // プレイヤーに腐食(1)が付与されていることを確認する
    expect(corrosionMagnitudes).toEqual([1])
  })

  it('腐食状態カードを使用すると除外され、腐食状態が解除される', () => {
    // -- 状況設定 --
    // 被虐のオーラ後に腐食カードを使用した直後のスナップショットを取得する
    const afterAura = runScenarioPattern3(StepsPattern3.playMasochisticAura)
    const corrosionCard = afterAura.battle.hand.list().find((card) => card.title === '腐食')
    // 事前状態として手札に腐食カードが存在することを確認する
    expect(corrosionCard).toBeDefined()
    const corrosionCardId = requireCardId(corrosionCard)

    const { battle, snapshot, lastEntry } = runScenarioPattern3(
      StepsPattern3.playCorrosionState,
    )

    // 状況確認：腐食カードが操作指定なしでプレイされたログであることを確認する
    expect(lastEntry?.type).toBe('play-card')
    if (lastEntry?.type === 'play-card') {
      // 対象カードが腐食であることを確認する
      expect(lastEntry.cardId).toBe(corrosionCardId)
      // 追加操作が要求されていないことを確認する
      expect(lastEntry.operations ?? []).toHaveLength(0)
    }

    // -- 結果検証 --
    // プレイヤーの現在マナが1に減少していることを確認する
    expect(snapshot.player.currentMana).toBe(1)
    // 手札から腐食が消え手札枚数が減少していることを確認する
    expect(snapshot.hand.length).toBeLessThanOrEqual(5)
    // 手札に腐食カードが残っていないことを確認する
    expect(snapshot.hand.some((card) => card.title === '腐食')).toBe(false)
    // 腐食カードが除外ゾーンへ移動していることを確認する
    expect(snapshot.exilePile.some((card) => card.title === '腐食')).toBe(true)
    // カードリポジトリでも除外扱いになっていることを確認する
    expect(
      battle.cardRepository.findWithLocation(corrosionCardId),
    ).toMatchObject({ location: 'exilePile' })
    // プレイヤーから腐食状態が解除されていることを確認する
    expect(
      battle.player.getStates().some((state) => state instanceof CorrosionState),
    ).toBe(false)
  })
})
