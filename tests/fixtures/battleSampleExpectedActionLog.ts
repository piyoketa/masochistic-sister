// 自動生成: do not edit manually. Update via LOG_BATTLE_SAMPLE*_SUMMARY pipeline.
import type { ActionLogEntrySummary } from '../integration/utils/battleLogTestUtils'

// バトル開始：初期手札と敵HPを描画
export const ACTION_LOG_ENTRY_01_BATTLE_START: ActionLogEntrySummary = {
  type: 'battle-start',
  animations: [
    // [バトル開始] 初期手札と盤面を描画
    {
      waitMs: 0,
      metadata: {stage:'battle-start'},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'}],discardCount:0,exileCount:0,deckCount:6,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1開始：2枚ドロー
export const ACTION_LOG_ENTRY_02_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:4,title:'被虐のオーラ'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・被虐のオーラ・日課], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1 プレイヤー行動：被虐のオーラでかたつむりを攻撃/支援
export const ACTION_LOG_ENTRY_03_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 4,
  operations: [{type:'target-enemy',payload:3}],
  animations: [
    // [カード移動] cardId=4 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:4},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・日課], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] cardId=4 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:4,defeatedEnemyIds:[]},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1 プレイヤー行動：日課を使用
export const ACTION_LOG_ENTRY_04_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 7,
  animations: [
    // [カード移動] cardId=7 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:7},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] cardId=7 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:7,defeatedEnemyIds:[]},
      snapshot: {player:{hp:145,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:2,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・天の鎖・戦いの準備・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1 プレイヤー行動：戦いの準備を使用
export const ACTION_LOG_ENTRY_05_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 6,
  animations: [
    // [カード移動] cardId=6 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:6},
      snapshot: {player:{hp:145,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] cardId=6 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:6,defeatedEnemyIds:[]},
      snapshot: {player:{hp:145,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1終了：敵行動フェイズへ
export const ACTION_LOG_ENTRY_06_END_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'end-player-turn',
  animations: [
    // [ターン終了] 敵ターン移行直前
    {
      waitMs: 0,
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：オークがたいあたりを実行
export const ACTION_LOG_ENTRY_07_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'たいあたり',skipped:false},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] 0番目の敵 (たいあたり)
    {
      waitMs: 0,
      metadata: {stage:'damage',enemyId:0,actionId:'たいあたり'},
      damageOutcomes: [{damage:30,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [手札追加] 敵攻撃の記憶カードを手札へ
    {
      waitMs: 0,
      metadata: {stage:'memory-card',enemyId:0,cards:['たいあたり']},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：オークダンサーが戦いの舞いを実行
export const ACTION_LOG_ENTRY_08_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'戦いの舞い',skipped:false},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：触手が粘液飛ばしを実行
export const ACTION_LOG_ENTRY_09_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:2,actionId:'粘液飛ばし',skipped:false},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] 2番目の敵 (粘液飛ばし)
    {
      waitMs: 0,
      metadata: {stage:'damage',enemyId:2,actionId:'粘液飛ばし'},
      damageOutcomes: [{damage:15,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [手札追加] 敵攻撃の記憶カードを手札へ
    {
      waitMs: 0,
      metadata: {stage:'memory-card',enemyId:2,cards:['ねばねば','粘液飛ばし']},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：かたつむりが行動済みを実行（行動不能）
export const ACTION_LOG_ENTRY_10_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:3,actionId:'行動済み',skipped:true},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン2開始：2枚ドロー
export const ACTION_LOG_ENTRY_11_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      metadata: {stage:'turn-start',draw:2,handOverflow:true},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// プレイヤーイベント解決（battle-event-1）
export const ACTION_LOG_ENTRY_12_PLAYER_EVENT: ActionLogEntrySummary = {
  type: 'player-event',
  eventId: 'battle-event-1',
  animations: [
    // [プレイヤーイベント] 予約効果を解決
    {
      waitMs: 200,
      metadata: {stage:'player-event',eventId:'battle-event-1',payload:{type:'mana',payload:{amount:1},scheduledTurn:2}},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン2 プレイヤー行動：たいあたりでかたつむりを攻撃/支援
export const ACTION_LOG_ENTRY_13_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 11,
  operations: [{type:'target-enemy',payload:3}],
  animations: [
    // [カード移動] cardId=11 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:11},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ダメージ演出] cardId=11 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:11,defeatedEnemyIds:[3]},
      damageOutcomes: [{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'active'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      metadata: {stage:'defeat',cardId:11,defeatedEnemyIds:[3]},
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：酸を吐くで触手を攻撃/支援
export const ACTION_LOG_ENTRY_14_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 10,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード移動] cardId=10 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:10},
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:5,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
    // [ダメージ演出] cardId=10 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:10,defeatedEnemyIds:[]},
      damageOutcomes: [{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:5,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:20,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP2, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=20, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：粘液飛ばしで触手を攻撃/支援
export const ACTION_LOG_ENTRY_15_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 13,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード移動] cardId=13 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:13},
      snapshot: {player:{hp:100,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:20,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP2, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=20, かたつむり=0]
    },
    // [ダメージ演出] cardId=13 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:13,defeatedEnemyIds:[2]},
      damageOutcomes: [{damage:20,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      metadata: {stage:'defeat',cardId:13,defeatedEnemyIds:[2]},
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：腐食を使用
export const ACTION_LOG_ENTRY_16_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 9,
  animations: [
    // [カード移動] cardId=9 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:9},
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] cardId=9 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:9,defeatedEnemyIds:[]},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン2終了：敵行動フェイズへ
export const ACTION_LOG_ENTRY_17_END_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'end-player-turn',
  animations: [
    // [ターン終了] 敵ターン移行直前
    {
      waitMs: 0,
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：オークがビルドアップを実行
export const ACTION_LOG_ENTRY_18_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'ビルドアップ',skipped:false},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：オークダンサーが乱れ突きを実行
export const ACTION_LOG_ENTRY_19_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'乱れ突き',skipped:false},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] 1番目の敵 (乱れ突き)
    {
      waitMs: 0,
      metadata: {stage:'damage',enemyId:1,actionId:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [手札追加] 敵攻撃の記憶カードを手札へ
    {
      waitMs: 0,
      metadata: {stage:'memory-card',enemyId:1,cards:['乱れ突き']},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：触手が戦闘不能を実行（行動不能）
export const ACTION_LOG_ENTRY_20_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:2,actionId:'戦闘不能',skipped:true},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：かたつむりが戦闘不能を実行（行動不能）
export const ACTION_LOG_ENTRY_21_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      metadata: {stage:'enemy-highlight',enemyId:3,actionId:'戦闘不能',skipped:true},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3開始：2枚ドロー
export const ACTION_LOG_ENTRY_22_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:60,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:0,exileCount:1,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP3, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：疼きを使用
export const ACTION_LOG_ENTRY_23_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 8,
  operations: [{type:'select-hand-card',payload:14}],
  animations: [
    // [カード移動] cardId=8 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:8},
      snapshot: {player:{hp:60,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:0,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP3, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] cardId=8 の攻撃結果
    {
      waitMs: 0,
      metadata: {stage:'damage',cardId:8,defeatedEnemyIds:[]},
      snapshot: {player:{hp:60,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:0,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP2, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：乱れ突きでオークを攻撃/支援
export const ACTION_LOG_ENTRY_24_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 14,
  operations: [{type:'target-enemy',payload:0}],
  animations: [
    // [カード移動] cardId=14 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:14},
      snapshot: {player:{hp:60,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP2, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] cardId=14 の攻撃結果
    {
      waitMs: 600,
      metadata: {stage:'damage',cardId:14,defeatedEnemyIds:[0]},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      metadata: {stage:'defeat',cardId:14,defeatedEnemyIds:[0]},
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：乱れ突きでオークダンサーを攻撃/支援
export const ACTION_LOG_ENTRY_25_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 15,
  operations: [{type:'target-enemy',payload:1}],
  animations: [
    // [カード移動] cardId=15 の移動
    {
      waitMs: 0,
      metadata: {stage:'card-move',cardId:15},
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] cardId=15 の攻撃結果
    {
      waitMs: 600,
      metadata: {stage:'damage',cardId:15,defeatedEnemyIds:[1]},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      metadata: {stage:'defeat',cardId:15,defeatedEnemyIds:[1]},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
  ],
}

// 勝利処理：リザルト表示
export const ACTION_LOG_ENTRY_26_VICTORY: ActionLogEntrySummary = {
  type: 'victory',
  animations: [
    // [勝利] リザルトオーバーレイを表示
    {
      waitMs: 400,
      metadata: {stage:'victory'},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
  ],
}

export const ACTION_LOG_ENTRY_SEQUENCE = [
  ACTION_LOG_ENTRY_01_BATTLE_START,
  ACTION_LOG_ENTRY_02_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_03_PLAY_CARD,
  ACTION_LOG_ENTRY_04_PLAY_CARD,
  ACTION_LOG_ENTRY_05_PLAY_CARD,
  ACTION_LOG_ENTRY_06_END_PLAYER_TURN,
  ACTION_LOG_ENTRY_07_ENEMY_ACT,
  ACTION_LOG_ENTRY_08_ENEMY_ACT,
  ACTION_LOG_ENTRY_09_ENEMY_ACT,
  ACTION_LOG_ENTRY_10_ENEMY_ACT,
  ACTION_LOG_ENTRY_11_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_12_PLAYER_EVENT,
  ACTION_LOG_ENTRY_13_PLAY_CARD,
  ACTION_LOG_ENTRY_14_PLAY_CARD,
  ACTION_LOG_ENTRY_15_PLAY_CARD,
  ACTION_LOG_ENTRY_16_PLAY_CARD,
  ACTION_LOG_ENTRY_17_END_PLAYER_TURN,
  ACTION_LOG_ENTRY_18_ENEMY_ACT,
  ACTION_LOG_ENTRY_19_ENEMY_ACT,
  ACTION_LOG_ENTRY_20_ENEMY_ACT,
  ACTION_LOG_ENTRY_21_ENEMY_ACT,
  ACTION_LOG_ENTRY_22_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_23_PLAY_CARD,
  ACTION_LOG_ENTRY_24_PLAY_CARD,
  ACTION_LOG_ENTRY_25_PLAY_CARD,
  ACTION_LOG_ENTRY_26_VICTORY
] as const