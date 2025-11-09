// 自動生成: do not edit manually. Update via LOG_BATTLE_SAMPLE*_SUMMARY pipeline.
import type { ActionLogEntrySummary } from '../integration/utils/battleLogTestUtils'

// バトル開始：初期手札と敵HPを描画
export const ACTION_LOG_ENTRY_01_BATTLE_START: ActionLogEntrySummary = {
  type: 'battle-start',
  animations: [
    // [バトル開始] 初期手札と盤面を描画
    {
      waitMs: 0,
      batchId: 'battle-start:0',
      metadata: {stage:'battle-start'},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'}],discardCount:0,exileCount:0,deckCount:6,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
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
      batchId: 'turn-start:1',
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:4,title:'被虐のオーラ'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・被虐のオーラ・日課], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:2',
      metadata: {stage:'deck-draw',cardIds:[4,7]},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:4,title:'被虐のオーラ'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・被虐のオーラ・日課], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン1 プレイヤー行動：被虐のオーラで鉄花を攻撃/支援
export const ACTION_LOG_ENTRY_03_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 4,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード移動] 被虐のオーラ の移動
    {
      waitMs: 0,
      batchId: 'card-move:3',
      metadata: {stage:'card-move',cardId:4,cardTitle:'被虐のオーラ'},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・日課], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:4',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:150,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP150/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// 敵フェイズ：鉄花が粘液飛ばしを実行
export const ACTION_LOG_ENTRY_04_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:5',
      metadata: {stage:'enemy-highlight',enemyId:2,actionId:'粘液飛ばし',skipped:false},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:6',
      metadata: {stage:'player-damage',enemyId:2,actionId:'粘液飛ばし'},
      damageOutcomes: [{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [手札追加] 敵攻撃の記憶カード (ねばねば・粘液飛ばし) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:7',
      metadata: {stage:'card-create',enemyId:2,cards:['ねばねば','粘液飛ばし']},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン1 プレイヤー行動：天の鎖でなめくじを攻撃/支援
export const ACTION_LOG_ENTRY_05_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 0,
  operations: [{type:'target-enemy',payload:3}],
  animations: [
    // [カード移動] 天の鎖 の移動
    {
      waitMs: 0,
      batchId: 'card-move:8',
      metadata: {stage:'card-move',cardId:0,cardTitle:'天の鎖'},
      snapshot: {player:{hp:145,mana:2},hand:[{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・戦いの準備・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:9',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:145,mana:1},hand:[{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・戦いの準備・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン1 プレイヤー行動：戦いの準備を使用
export const ACTION_LOG_ENTRY_06_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 6,
  animations: [
    // [カード廃棄] 戦いの準備 を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:10',
      metadata: {stage:'card-trash',cardId:6,cardTitle:'戦いの準備'},
      snapshot: {player:{hp:145,mana:1},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:11',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:145,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン1終了：敵行動フェイズへ
export const ACTION_LOG_ENTRY_07_END_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'end-player-turn',
  animations: [
    // [ターン終了] 敵ターン移行直前
    {
      waitMs: 0,
      batchId: 'turn-end:12',
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:145,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// 敵フェイズ：オークランサーが戦いの舞いを実行
export const ACTION_LOG_ENTRY_08_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:13',
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'戦いの舞い',skipped:false},
      snapshot: {player:{hp:145,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [状態更新] 敵ステータスを反映
    {
      waitMs: 0,
      batchId: 'state-update:14',
      metadata: {stage:'state-update',enemyStates:[{enemyId:0,states:[{id:'state-acceleration',magnitude:1}]}]},
      snapshot: {player:{hp:145,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// 敵フェイズ：かまいたちが乱れ突きを実行
export const ACTION_LOG_ENTRY_09_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:15',
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'乱れ突き',skipped:false},
      snapshot: {player:{hp:120,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:16',
      metadata: {stage:'player-damage',enemyId:1,actionId:'乱れ突き'},
      damageOutcomes: [{damage:5,effectType:'slash'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:120,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [手札追加] 敵攻撃の記憶カード (乱れ突き) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:17',
      metadata: {stage:'card-create',enemyId:1,cards:['乱れ突き']},
      snapshot: {player:{hp:120,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_10_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// 敵フェイズ：なめくじが足止めを実行
export const ACTION_LOG_ENTRY_11_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:18',
      metadata: {stage:'enemy-highlight',enemyId:3,actionId:'足止め',skipped:false},
      snapshot: {player:{hp:120,mana:0},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP0, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン2開始：2枚ドロー
export const ACTION_LOG_ENTRY_12_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      batchId: 'turn-start:19',
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:120,mana:4},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:2,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP4, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:20',
      metadata: {stage:'deck-draw',cardIds:[2,5]},
      snapshot: {player:{hp:120,mana:4},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:2,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP4, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// プレイヤーイベント解決（battle-event-1）
export const ACTION_LOG_ENTRY_13_PLAYER_EVENT: ActionLogEntrySummary = {
  type: 'player-event',
  eventId: 'battle-event-1',
  animations: [
    // [マナ] マナゲージを変化
    {
      waitMs: 200,
      batchId: 'mana:21',
      metadata: {stage:'mana',eventId:'battle-event-1',amount:1},
      snapshot: {player:{hp:120,mana:4},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:11,title:'乱れ突き'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:2,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP4, 手札[天の鎖・日課・ねばねば・粘液飛ばし・乱れ突き・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
  ],
}

// ターン2 プレイヤー行動：乱れ突きで鉄花を攻撃/支援
export const ACTION_LOG_ENTRY_14_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 11,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード廃棄] 乱れ突き を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:22',
      metadata: {stage:'card-trash',cardId:11,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:120,mana:4},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:10,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP4, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=10, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:23',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:120,mana:3},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP3, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [ダメージ演出] 乱れ突き の攻撃結果
    {
      waitMs: 800,
      batchId: 'damage:24',
      metadata: {stage:'damage',cardId:11,cardTitle:'乱れ突き'},
      damageOutcomes: [{damage:0,effectType:'guarded'},{damage:0,effectType:'guarded'},{damage:0,effectType:'guarded'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:120,mana:3},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'active'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP3, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:25',
      metadata: {stage:'defeat',defeatedEnemyIds:[2],cardId:11,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:120,mana:3},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP3, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・被虐のオーラ], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン2 プレイヤー行動：被虐のオーラでオークランサーを攻撃/支援
export const ACTION_LOG_ENTRY_15_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 5,
  operations: [{type:'target-enemy',payload:0}],
  animations: [
    // [カード移動] 被虐のオーラ の移動
    {
      waitMs: 0,
      batchId: 'card-move:26',
      metadata: {stage:'card-move',cardId:5,cardTitle:'被虐のオーラ'},
      snapshot: {player:{hp:120,mana:3},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP3, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:27',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:120,mana:2},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:3,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP120/MP2, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// 敵フェイズ：オークランサーが乱れ突きを実行
export const ACTION_LOG_ENTRY_16_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:28',
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'乱れ突き',skipped:false},
      snapshot: {player:{hp:80,mana:2},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:12,title:'乱れ突き'}],discardCount:4,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP2, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:29',
      metadata: {stage:'player-damage',enemyId:0,actionId:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:80,mana:2},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:12,title:'乱れ突き'}],discardCount:4,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP2, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [手札追加] 敵攻撃の記憶カード (乱れ突き) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:30',
      metadata: {stage:'card-create',enemyId:0,cards:['乱れ突き']},
      snapshot: {player:{hp:80,mana:2},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:12,title:'乱れ突き'}],discardCount:4,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP2, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖・乱れ突き], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン2 プレイヤー行動：乱れ突きでオークランサーを攻撃/支援
export const ACTION_LOG_ENTRY_17_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 12,
  operations: [{type:'target-enemy',payload:0}],
  animations: [
    // [カード廃棄] 乱れ突き を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:31',
      metadata: {stage:'card-trash',cardId:12,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:80,mana:2},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:5,exileCount:1,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP2, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=40, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:32',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:80,mana:1},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:5,exileCount:1,deckCount:2,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP1, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [ダメージ演出] 乱れ突き の攻撃結果
    {
      waitMs: 600,
      batchId: 'damage:33',
      metadata: {stage:'damage',cardId:12,cardTitle:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:80,mana:1},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:5,exileCount:1,deckCount:2,enemies:[{id:0,hp:0,status:'active'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP1, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:34',
      metadata: {stage:'defeat',defeatedEnemyIds:[0],cardId:12,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:80,mana:1},hand:[{id:1,title:'天の鎖'},{id:7,title:'日課'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:5,exileCount:1,deckCount:2,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP1, 手札[天の鎖・日課・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン2 プレイヤー行動：日課を使用
export const ACTION_LOG_ENTRY_18_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 7,
  animations: [
    // [カード廃棄] 日課 を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:35',
      metadata: {stage:'card-trash',cardId:7,cardTitle:'日課'},
      snapshot: {player:{hp:80,mana:1},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'}],discardCount:6,exileCount:1,deckCount:2,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP1, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:36',
      metadata: {stage:'deck-draw',cardIds:[8,3]},
      snapshot: {player:{hp:80,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:37',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:80,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン2終了：敵行動フェイズへ
export const ACTION_LOG_ENTRY_19_END_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'end-player-turn',
  animations: [
    // [ターン終了] 敵ターン移行直前
    {
      waitMs: 0,
      batchId: 'turn-end:38',
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:80,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_20_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// 敵フェイズ：かまいたちが追い風を実行
export const ACTION_LOG_ENTRY_21_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:39',
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'追い風',skipped:false},
      snapshot: {player:{hp:80,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP80/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_22_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// 敵フェイズ：なめくじが酸を吐くを実行
export const ACTION_LOG_ENTRY_23_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:40',
      metadata: {stage:'enemy-highlight',enemyId:3,actionId:'酸を吐く',skipped:false},
      snapshot: {player:{hp:75,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖・腐食・酸を吐く], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:41',
      metadata: {stage:'player-damage',enemyId:3,actionId:'酸を吐く'},
      damageOutcomes: [{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:75,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖・腐食・酸を吐く], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [手札追加] 敵攻撃の記憶カード (腐食・酸を吐く) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:42',
      metadata: {stage:'card-create',enemyId:3,cards:['腐食','酸を吐く']},
      snapshot: {player:{hp:75,mana:0},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'}],discardCount:6,exileCount:1,deckCount:0,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP0, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖・腐食・酸を吐く], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン3開始：2枚ドロー
export const ACTION_LOG_ENTRY_24_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      batchId: 'turn-start:43',
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:75,mana:3},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'},{id:4,title:'被虐のオーラ'},{id:6,title:'戦いの準備'}],discardCount:0,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP3, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖・腐食・酸を吐く・被虐のオーラ・戦いの準備], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:44',
      metadata: {stage:'deck-draw',cardIds:[4,6]},
      snapshot: {player:{hp:75,mana:3},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:8,title:'再装填'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'},{id:4,title:'被虐のオーラ'},{id:6,title:'戦いの準備'}],discardCount:0,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP3, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・再装填・天の鎖・腐食・酸を吐く・被虐のオーラ・戦いの準備], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン3 プレイヤー行動：再装填を使用
export const ACTION_LOG_ENTRY_25_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 8,
  animations: [
    // [カード廃棄] 再装填 を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:45',
      metadata: {stage:'card-trash',cardId:8,cardTitle:'再装填'},
      snapshot: {player:{hp:75,mana:3},hand:[{id:1,title:'天の鎖'},{id:9,title:'ねばねば'},{id:10,title:'粘液飛ばし'},{id:2,title:'天の鎖'},{id:3,title:'天の鎖'},{id:13,title:'腐食'},{id:14,title:'酸を吐く'},{id:4,title:'被虐のオーラ'},{id:6,title:'戦いの準備'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP3, 手札[天の鎖・ねばねば・粘液飛ばし・天の鎖・天の鎖・腐食・酸を吐く・被虐のオーラ・戦いの準備], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:46',
      metadata: {stage:'deck-draw',cardIds:[11,5,12,7,14,1,10]},
      snapshot: {player:{hp:75,mana:2},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:11,title:'乱れ突き'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP2, 手札[ねばねば・腐食・乱れ突き・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:47',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:75,mana:2},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:11,title:'乱れ突き'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP2, 手札[ねばねば・腐食・乱れ突き・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [カード廃棄] 天の鎖・粘液飛ばし・天の鎖・天の鎖・酸を吐く・被虐のオーラ・戦いの準備 を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-move:46',
      metadata: {stage:'card-trash',cardIds:[1,10,2,3,14,4,6],cardTitles:['天の鎖','粘液飛ばし','天の鎖','天の鎖','酸を吐く','被虐のオーラ','戦いの準備']},
      snapshot: {player:{hp:75,mana:2},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:11,title:'乱れ突き'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:1,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP2, 手札[ねばねば・腐食・乱れ突き・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
  ],
}

// ターン3 プレイヤー行動：乱れ突きでかまいたちを攻撃/支援
export const ACTION_LOG_ENTRY_26_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 11,
  operations: [{type:'target-enemy',payload:1}],
  animations: [
    // [カード廃棄] 乱れ突き を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:48',
      metadata: {stage:'card-trash',cardId:11,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:75,mana:2},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:20,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'active'}]}, // 確認: HP75/MP2, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=20, 鉄花=0, なめくじ=30]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:49',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:75,mana:1},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'escaped'}]}, // 確認: HP75/MP1, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=0, 鉄花=0, なめくじ=30]
    },
    // [ダメージ演出] 乱れ突き の攻撃結果
    {
      waitMs: 800,
      batchId: 'damage:50',
      metadata: {stage:'damage',cardId:11,cardTitle:'乱れ突き'},
      damageOutcomes: [{damage:5,effectType:'slash'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'},{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:75,mana:1},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'escaped'}]}, // 確認: HP75/MP1, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=0, 鉄花=0, なめくじ=30]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:51',
      metadata: {stage:'defeat',defeatedEnemyIds:[1],cardId:11,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:75,mana:1},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'escaped'}]}, // 確認: HP75/MP1, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=0, 鉄花=0, なめくじ=30]
    },
  ],
}

// ステートイベント：なめくじのtrait-cowardがescape
export const ACTION_LOG_ENTRY_27_STATE_EVENT: ActionLogEntrySummary = {
  type: 'state-event',
  animations: [
    // [逃走] 敵カードを退場
    {
      waitMs: 1000,
      batchId: 'escape:52',
      metadata: {stage:'escape',subject:'enemy',subjectId:3,stateId:'trait-coward',payload:{result:'escape'}},
      snapshot: {player:{hp:75,mana:1},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'escaped'}]}, // 確認: HP75/MP1, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=0, 鉄花=0, なめくじ=30]
    },
  ],
}

// 勝利処理：リザルト表示
export const ACTION_LOG_ENTRY_28_VICTORY: ActionLogEntrySummary = {
  type: 'victory',
  animations: [
    // [勝利] リザルトオーバーレイを表示
    {
      waitMs: 400,
      batchId: 'victory:53',
      metadata: {stage:'victory'},
      snapshot: {player:{hp:75,mana:1},hand:[{id:9,title:'ねばねば'},{id:13,title:'腐食'},{id:5,title:'被虐のオーラ'},{id:12,title:'乱れ突き'},{id:7,title:'日課'},{id:14,title:'酸を吐く'},{id:1,title:'天の鎖'},{id:10,title:'粘液飛ばし'}],discardCount:2,exileCount:1,deckCount:4,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:30,status:'escaped'}]}, // 確認: HP75/MP1, 手札[ねばねば・腐食・被虐のオーラ・乱れ突き・日課・酸を吐く・天の鎖・粘液飛ばし], 敵HP[オークランサー=0, かまいたち=0, 鉄花=0, なめくじ=30]
    },
  ],
}

export const ACTION_LOG_ENTRY_SEQUENCE = [
  ACTION_LOG_ENTRY_01_BATTLE_START,
  ACTION_LOG_ENTRY_02_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_03_PLAY_CARD,
  ACTION_LOG_ENTRY_04_ENEMY_ACT,
  ACTION_LOG_ENTRY_05_PLAY_CARD,
  ACTION_LOG_ENTRY_06_PLAY_CARD,
  ACTION_LOG_ENTRY_07_END_PLAYER_TURN,
  ACTION_LOG_ENTRY_08_ENEMY_ACT,
  ACTION_LOG_ENTRY_09_ENEMY_ACT,
  ACTION_LOG_ENTRY_10_ENEMY_ACT,
  ACTION_LOG_ENTRY_11_ENEMY_ACT,
  ACTION_LOG_ENTRY_12_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_13_PLAYER_EVENT,
  ACTION_LOG_ENTRY_14_PLAY_CARD,
  ACTION_LOG_ENTRY_15_PLAY_CARD,
  ACTION_LOG_ENTRY_16_ENEMY_ACT,
  ACTION_LOG_ENTRY_17_PLAY_CARD,
  ACTION_LOG_ENTRY_18_PLAY_CARD,
  ACTION_LOG_ENTRY_19_END_PLAYER_TURN,
  ACTION_LOG_ENTRY_20_ENEMY_ACT,
  ACTION_LOG_ENTRY_21_ENEMY_ACT,
  ACTION_LOG_ENTRY_22_ENEMY_ACT,
  ACTION_LOG_ENTRY_23_ENEMY_ACT,
  ACTION_LOG_ENTRY_24_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_25_PLAY_CARD,
  ACTION_LOG_ENTRY_26_PLAY_CARD,
  ACTION_LOG_ENTRY_27_STATE_EVENT,
  ACTION_LOG_ENTRY_28_VICTORY
] as const
