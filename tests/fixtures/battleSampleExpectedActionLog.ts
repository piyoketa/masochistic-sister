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
      batchId: 'turn-start:1',
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:4,title:'被虐のオーラ'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・被虐のオーラ・日課], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:2',
      metadata: {stage:'deck-draw',cardIds:[4,7]},
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
    // [カード移動] 被虐のオーラ の移動
    {
      waitMs: 0,
      batchId: 'card-move:3',
      metadata: {stage:'card-move',cardId:4,cardTitle:'被虐のオーラ'},
      snapshot: {player:{hp:150,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP3, 手札[天の鎖・天の鎖・戦いの準備・日課], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:4',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:150,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'}],discardCount:0,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP150/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：かたつむりが酸を吐くを実行
export const ACTION_LOG_ENTRY_04_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:5',
      metadata: {stage:'enemy-highlight',enemyId:3,actionId:'酸を吐く',skipped:false},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:6',
      metadata: {stage:'player-damage',enemyId:3,actionId:'酸を吐く'},
      damageOutcomes: [{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [手札追加] 敵攻撃の記憶カード (腐食・酸を吐く) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:7',
      metadata: {stage:'card-create',enemyId:3,cards:['腐食','酸を吐く']},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:7,title:'日課'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:1,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・日課・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン1 プレイヤー行動：日課を使用
export const ACTION_LOG_ENTRY_05_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 7,
  animations: [
    // [カード廃棄] 日課 を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:8',
      metadata: {stage:'card-trash',cardId:7,cardTitle:'日課'},
      snapshot: {player:{hp:145,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:0,deckCount:4,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP2, 手札[天の鎖・天の鎖・戦いの準備・腐食・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:9',
      metadata: {stage:'deck-draw',cardIds:[2,8]},
      snapshot: {player:{hp:145,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:2,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・天の鎖・戦いの準備・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:10',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:145,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:6,title:'戦いの準備'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:2,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・天の鎖・戦いの準備・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
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
      batchId: 'card-trash:11',
      metadata: {stage:'card-trash',cardId:6,cardTitle:'戦いの準備'},
      snapshot: {player:{hp:145,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP1, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:12',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:145,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
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
      batchId: 'turn-end:13',
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:145,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP145/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：オークがたいあたりを実行
export const ACTION_LOG_ENTRY_08_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:14',
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'たいあたり',skipped:false},
      snapshot: {player:{hp:115,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP115/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:15',
      metadata: {stage:'player-damage',enemyId:0,actionId:'たいあたり'},
      damageOutcomes: [{damage:30,effectType:'slash'}],
      snapshot: {player:{hp:115,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP115/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [手札追加] 敵攻撃の記憶カード (たいあたり) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:16',
      metadata: {stage:'card-create',enemyId:0,cards:['たいあたり']},
      snapshot: {player:{hp:115,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP115/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：オークダンサーが戦いの舞いを実行
export const ACTION_LOG_ENTRY_09_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:17',
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'戦いの舞い',skipped:false},
      snapshot: {player:{hp:115,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP115/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [状態更新] 敵ステータスを反映
    {
      waitMs: 0,
      batchId: 'state-update:18',
      metadata: {stage:'state-update',enemyStates:[{enemyId:1,states:[{id:'state-acceleration',magnitude:1}]}]},
      snapshot: {player:{hp:115,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP115/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：触手が粘液飛ばしを実行
export const ACTION_LOG_ENTRY_10_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:19',
      metadata: {stage:'enemy-highlight',enemyId:2,actionId:'粘液飛ばし',skipped:false},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:20',
      metadata: {stage:'player-damage',enemyId:2,actionId:'粘液飛ばし'},
      damageOutcomes: [{damage:15,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [手札追加] 敵攻撃の記憶カード (ねばねば・粘液飛ばし) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:21',
      metadata: {stage:'card-create',enemyId:2,cards:['ねばねば','粘液飛ばし']},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'}],discardCount:3,exileCount:0,deckCount:2,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_11_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// ターン2開始：2枚ドロー
export const ACTION_LOG_ENTRY_12_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      batchId: 'turn-start:22',
      metadata: {stage:'turn-start',draw:2,handOverflow:true},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:23',
      metadata: {stage:'deck-draw',cardIds:[5]},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
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
      batchId: 'mana:24',
      metadata: {stage:'mana',eventId:'battle-event-1',amount:1},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:11,title:'たいあたり'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:3,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・たいあたり・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
  ],
}

// ターン2 プレイヤー行動：たいあたりでかたつむりを攻撃/支援
export const ACTION_LOG_ENTRY_14_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 11,
  operations: [{type:'target-enemy',payload:3}],
  animations: [
    // [カード廃棄] たいあたり を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:25',
      metadata: {stage:'card-trash',cardId:11,cardTitle:'たいあたり'},
      snapshot: {player:{hp:100,mana:4},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:10,status:'active'}]}, // 確認: HP100/MP4, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=10]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:26',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
    // [ダメージ演出] たいあたり の攻撃結果
    {
      waitMs: 0,
      batchId: 'damage:27',
      metadata: {stage:'damage',cardId:11,cardTitle:'たいあたり'},
      damageOutcomes: [{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'active'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:28',
      metadata: {stage:'defeat',defeatedEnemyIds:[3],cardId:11,cardTitle:'たいあたり'},
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:10,title:'酸を吐く'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:4,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・酸を吐く・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：酸を吐くで触手を攻撃/支援
export const ACTION_LOG_ENTRY_15_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 10,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード廃棄] 酸を吐く を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:29',
      metadata: {stage:'card-trash',cardId:10,cardTitle:'酸を吐く'},
      snapshot: {player:{hp:100,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:5,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:25,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP3, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=25, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:30',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:100,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:5,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:20,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP2, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=20, かたつむり=0]
    },
    // [ダメージ演出] 酸を吐く の攻撃結果
    {
      waitMs: 0,
      batchId: 'damage:31',
      metadata: {stage:'damage',cardId:10,cardTitle:'酸を吐く'},
      damageOutcomes: [{damage:5,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:13,title:'粘液飛ばし'},{id:5,title:'被虐のオーラ'}],discardCount:5,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:20,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP2, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・粘液飛ばし・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=20, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：粘液飛ばしで触手を攻撃/支援
export const ACTION_LOG_ENTRY_16_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 13,
  operations: [{type:'target-enemy',payload:2}],
  animations: [
    // [カード廃棄] 粘液飛ばし を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:32',
      metadata: {stage:'card-trash',cardId:13,cardTitle:'粘液飛ばし'},
      snapshot: {player:{hp:100,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:20,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP2, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=20, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:33',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] 粘液飛ばし の攻撃結果
    {
      waitMs: 0,
      batchId: 'damage:34',
      metadata: {stage:'damage',cardId:13,cardTitle:'粘液飛ばし'},
      damageOutcomes: [{damage:20,effectType:'slash'}],
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'active'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:35',
      metadata: {stage:'defeat',defeatedEnemyIds:[2],cardId:13,cardTitle:'粘液飛ばし'},
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:9,title:'腐食'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:0,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・腐食・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン2 プレイヤー行動：腐食を使用
export const ACTION_LOG_ENTRY_17_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 9,
  animations: [
    // [カード移動] 腐食 の移動
    {
      waitMs: 0,
      batchId: 'card-move:36',
      metadata: {stage:'card-move',cardId:9,cardTitle:'腐食'},
      snapshot: {player:{hp:100,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP1, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:37',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン2終了：敵行動フェイズへ
export const ACTION_LOG_ENTRY_18_END_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'end-player-turn',
  animations: [
    // [ターン終了] 敵ターン移行直前
    {
      waitMs: 0,
      batchId: 'turn-end:38',
      metadata: {stage:'turn-end'},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：オークがビルドアップを実行
export const ACTION_LOG_ENTRY_19_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:39',
      metadata: {stage:'enemy-highlight',enemyId:0,actionId:'ビルドアップ',skipped:false},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [状態更新] 敵ステータスを反映
    {
      waitMs: 0,
      batchId: 'state-update:40',
      metadata: {stage:'state-update',enemyStates:[{enemyId:0,states:[{id:'state-strength',magnitude:10}]}]},
      snapshot: {player:{hp:100,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP100/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：オークダンサーが乱れ突きを実行
export const ACTION_LOG_ENTRY_20_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
    // [敵行動ハイライト] 敵の行動を強調
    {
      waitMs: 0,
      batchId: 'enemy-highlight:41',
      metadata: {stage:'enemy-highlight',enemyId:1,actionId:'乱れ突き',skipped:false},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [被ダメージ] プレイヤーへの攻撃結果
    {
      waitMs: 0,
      batchId: 'player-damage:42',
      metadata: {stage:'player-damage',enemyId:1,actionId:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [手札追加] 敵攻撃の記憶カード (乱れ突き) を手札へ
    {
      waitMs: 0,
      batchId: 'card-create:43',
      metadata: {stage:'card-create',enemyId:1,cards:['乱れ突き']},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'}],discardCount:6,exileCount:1,deckCount:1,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_21_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// 敵フェイズ：敵が行動を実行
export const ACTION_LOG_ENTRY_22_ENEMY_ACT: ActionLogEntrySummary = {
  type: 'enemy-act',
  animations: [
  ],
}

// ターン3開始：2枚ドロー
export const ACTION_LOG_ENTRY_23_START_PLAYER_TURN: ActionLogEntrySummary = {
  type: 'start-player-turn',
  animations: [
    // [ターン開始] ドロー後の手札/山札を反映
    {
      waitMs: 0,
      batchId: 'turn-start:44',
      metadata: {stage:'turn-start',draw:2},
      snapshot: {player:{hp:60,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:0,exileCount:1,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP3, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ドロー] 山札から手札にカードを追加
    {
      waitMs: 0,
      batchId: 'card-move:45',
      metadata: {stage:'deck-draw',cardIds:[3,10]},
      snapshot: {player:{hp:60,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:8,title:'疼き'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:0,exileCount:1,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP3, 手札[天の鎖・天の鎖・天の鎖・疼き・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：疼きを使用
export const ACTION_LOG_ENTRY_24_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 8,
  operations: [{type:'select-hand-card',payload:14}],
  animations: [
    // [カード移動] 疼き の移動
    {
      waitMs: 0,
      batchId: 'card-move:46',
      metadata: {stage:'card-move',cardId:8,cardTitle:'疼き'},
      snapshot: {player:{hp:60,mana:3},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:0,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP3, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:47',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:60,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:14,title:'乱れ突き'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:0,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP2, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・乱れ突き・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：乱れ突きでオークを攻撃/支援
export const ACTION_LOG_ENTRY_25_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 14,
  operations: [{type:'target-enemy',payload:0}],
  animations: [
    // [カード廃棄] 乱れ突き を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:48',
      metadata: {stage:'card-trash',cardId:14,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:60,mana:2},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:40,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP2, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=40, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:49',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] 乱れ突き の攻撃結果
    {
      waitMs: 600,
      batchId: 'damage:50',
      metadata: {stage:'damage',cardId:14,cardTitle:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'active'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:51',
      metadata: {stage:'defeat',defeatedEnemyIds:[0],cardId:14,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'},{id:15,title:'乱れ突き'}],discardCount:1,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く・乱れ突き], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
  ],
}

// ターン3 プレイヤー行動：乱れ突きでオークダンサーを攻撃/支援
export const ACTION_LOG_ENTRY_26_PLAY_CARD: ActionLogEntrySummary = {
  type: 'play-card',
  card: 15,
  operations: [{type:'target-enemy',payload:1}],
  animations: [
    // [カード廃棄] 乱れ突き を捨て札へ移動
    {
      waitMs: 0,
      batchId: 'card-trash:52',
      metadata: {stage:'card-trash',cardId:15,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:60,mana:1},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:40,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP1, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=40, 触手=0, かたつむり=0]
    },
    // [マナ] マナゲージを変化
    {
      waitMs: 0,
      batchId: 'mana:53',
      metadata: {stage:'mana',amount:-1},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
    // [ダメージ演出] 乱れ突き の攻撃結果
    {
      waitMs: 600,
      batchId: 'damage:54',
      metadata: {stage:'damage',cardId:15,cardTitle:'乱れ突き'},
      damageOutcomes: [{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'},{damage:10,effectType:'slash'}],
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'active'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
    // [撃破演出] 撃破された敵を退場
    {
      waitMs: 1000,
      batchId: 'defeat:55',
      metadata: {stage:'defeat',defeatedEnemyIds:[1],cardId:15,cardTitle:'乱れ突き'},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
    },
  ],
}

// 勝利処理：リザルト表示
export const ACTION_LOG_ENTRY_27_VICTORY: ActionLogEntrySummary = {
  type: 'victory',
  animations: [
    // [勝利] リザルトオーバーレイを表示
    {
      waitMs: 400,
      batchId: 'victory:56',
      metadata: {stage:'victory'},
      snapshot: {player:{hp:60,mana:0},hand:[{id:0,title:'天の鎖'},{id:1,title:'天の鎖'},{id:2,title:'天の鎖'},{id:12,title:'ねばねば'},{id:5,title:'被虐のオーラ'},{id:3,title:'天の鎖'},{id:10,title:'酸を吐く'}],discardCount:2,exileCount:2,deckCount:5,enemies:[{id:0,hp:0,status:'defeated'},{id:1,hp:0,status:'defeated'},{id:2,hp:0,status:'defeated'},{id:3,hp:0,status:'defeated'}]}, // 確認: HP60/MP0, 手札[天の鎖・天の鎖・天の鎖・ねばねば・被虐のオーラ・天の鎖・酸を吐く], 敵HP[オーク=0, オークダンサー=0, 触手=0, かたつむり=0]
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
  ACTION_LOG_ENTRY_16_PLAY_CARD,
  ACTION_LOG_ENTRY_17_PLAY_CARD,
  ACTION_LOG_ENTRY_18_END_PLAYER_TURN,
  ACTION_LOG_ENTRY_19_ENEMY_ACT,
  ACTION_LOG_ENTRY_20_ENEMY_ACT,
  ACTION_LOG_ENTRY_21_ENEMY_ACT,
  ACTION_LOG_ENTRY_22_ENEMY_ACT,
  ACTION_LOG_ENTRY_23_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_24_PLAY_CARD,
  ACTION_LOG_ENTRY_25_PLAY_CARD,
  ACTION_LOG_ENTRY_26_PLAY_CARD,
  ACTION_LOG_ENTRY_27_VICTORY
] as const
