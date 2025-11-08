// 自動生成: tests/fixtures/battleSample2ExpectedActionLog.ts
export const ACTION_LOG_SUMMARY_STAGE2 = [
  {
    type: 'battle-start',
    animations: [
      // [バトル開始] 初期手札と盤面を描画
      {
              waitMs: 0,
              metadata: {
                stage: 'battle-start',
              },
              snapshot: {
                player: {
                  hp: 150,
                  mana: 3,
                },
                hand: [
                  {
                    id: 0,
                    title: '天の鎖',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                ],
                discardCount: 0,
                exileCount: 0,
                deckCount: 6,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'start-player-turn',
    animations: [
      // [ターン開始] ドロー後の手札/山札を反映
      {
              waitMs: 0,
              metadata: {
                stage: 'turn-start',
                draw: 2,
              },
              snapshot: {
                player: {
                  hp: 150,
                  mana: 3,
                },
                hand: [
                  {
                    id: 0,
                    title: '天の鎖',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                  {
                    id: 4,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                ],
                discardCount: 0,
                exileCount: 0,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 4,
    operations: [
          {
            type: 'target-enemy',
            payload: 2,
          },
        ],
    animations: [
      // [カード移動] cardId=4 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 4,
              },
              snapshot: {
                player: {
                  hp: 150,
                  mana: 3,
                },
                hand: [
                  {
                    id: 0,
                    title: '天の鎖',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                ],
                discardCount: 1,
                exileCount: 0,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=4 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 4,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 145,
                  mana: 2,
                },
                hand: [
                  {
                    id: 0,
                    title: '天の鎖',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 1,
                exileCount: 0,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 0,
    operations: [
          {
            type: 'target-enemy',
            payload: 3,
          },
        ],
    animations: [
      // [カード移動] cardId=0 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 0,
              },
              snapshot: {
                player: {
                  hp: 145,
                  mana: 2,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 1,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=0 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 0,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 145,
                  mana: 1,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 1,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 6,
    animations: [
      // [カード移動] cardId=6 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 6,
              },
              snapshot: {
                player: {
                  hp: 145,
                  mana: 1,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=6 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 6,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 145,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'end-player-turn',
    animations: [
      // [ターン終了] 敵ターンへ移行する直前の状態
      {
              waitMs: 0,
              metadata: {
                stage: 'turn-end',
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 0,
                actionId: '戦いの舞い',
                skipped: false,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 1,
                actionId: '乱れ突き',
                skipped: false,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] 敵1の乱れ突き結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                enemyId: 1,
                actionId: '乱れ突き',
              },
              damageOutcomes: [
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
              ],
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [手札追加] 敵攻撃の記憶カードを手札へ
      {
              waitMs: 0,
              metadata: {
                stage: 'memory-card',
                enemyId: 1,
                cards: [
                  '乱れ突き',
                ],
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 2,
                actionId: '行動済み',
                skipped: true,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 3,
                actionId: '足止め',
                skipped: false,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'start-player-turn',
    animations: [
      // [ターン開始] ドロー後の手札/山札を反映
      {
              waitMs: 0,
              metadata: {
                stage: 'turn-start',
                draw: 2,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 4,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'player-event',
    eventId: 'battle-event-1',
    animations: [
      // [プレイヤーイベント] 予約された効果を解決
      {
              waitMs: 200,
              metadata: {
                stage: 'player-event',
                eventId: 'battle-event-1',
                payload: {
                  type: 'mana',
                  payload: {
                    amount: 1,
                  },
                  scheduledTurn: 2,
                },
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 4,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 11,
    operations: [
          {
            type: 'target-enemy',
            payload: 2,
          },
        ],
    animations: [
      // [カード移動] cardId=11 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 11,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 4,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 3,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 10,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=11 の攻撃結果
      {
              waitMs: 800,
              metadata: {
                stage: 'damage',
                cardId: 11,
                defeatedEnemyIds: [
                  2,
                ],
              },
              damageOutcomes: [
                {
                  damage: 0,
                  effectType: 'guarded',
                },
                {
                  damage: 0,
                  effectType: 'guarded',
                },
                {
                  damage: 0,
                  effectType: 'guarded',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
              ],
              snapshot: {
                player: {
                  hp: 120,
                  mana: 3,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 3,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              metadata: {
                stage: 'defeat',
                cardId: 11,
                defeatedEnemyIds: [
                  2,
                ],
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 3,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 3,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 5,
    operations: [
          {
            type: 'target-enemy',
            payload: 0,
          },
        ],
    animations: [
      // [カード移動] cardId=5 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 5,
              },
              snapshot: {
                player: {
                  hp: 120,
                  mana: 3,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                ],
                discardCount: 4,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=5 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 5,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 80,
                  mana: 2,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 4,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 12,
    operations: [
          {
            type: 'target-enemy',
            payload: 0,
          },
        ],
    animations: [
      // [カード移動] cardId=12 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 12,
              },
              snapshot: {
                player: {
                  hp: 80,
                  mana: 2,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                ],
                discardCount: 5,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=12 の攻撃結果
      {
              waitMs: 600,
              metadata: {
                stage: 'damage',
                cardId: 12,
                defeatedEnemyIds: [
                  0,
                ],
              },
              damageOutcomes: [
                {
                  damage: 10,
                  effectType: 'slash',
                },
                {
                  damage: 10,
                  effectType: 'slash',
                },
                {
                  damage: 10,
                  effectType: 'slash',
                },
                {
                  damage: 10,
                  effectType: 'slash',
                },
              ],
              snapshot: {
                player: {
                  hp: 80,
                  mana: 1,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                ],
                discardCount: 5,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              metadata: {
                stage: 'defeat',
                cardId: 12,
                defeatedEnemyIds: [
                  0,
                ],
              },
              snapshot: {
                player: {
                  hp: 80,
                  mana: 1,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                ],
                discardCount: 5,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 7,
    animations: [
      // [カード移動] cardId=7 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 7,
              },
              snapshot: {
                player: {
                  hp: 80,
                  mana: 1,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=7 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 7,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 80,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'end-player-turn',
    animations: [
      // [ターン終了] 敵ターンへ移行する直前の状態
      {
              waitMs: 0,
              metadata: {
                stage: 'turn-end',
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 0,
                actionId: '戦闘不能',
                skipped: true,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 1,
                actionId: '追い風',
                skipped: false,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 2,
                actionId: '戦闘不能',
                skipped: true,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'enemy-act',
    animations: [
      // [敵行動ハイライト] 次に行動する敵を強調
      {
              waitMs: 0,
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 3,
                actionId: '酸を吐く',
                skipped: false,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] 敵3の酸を吐く結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                enemyId: 3,
                actionId: '酸を吐く',
              },
              damageOutcomes: [
                {
                  damage: 5,
                  effectType: 'slash',
                },
              ],
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [手札追加] 敵攻撃の記憶カードを手札へ
      {
              waitMs: 0,
              metadata: {
                stage: 'memory-card',
                enemyId: 3,
                cards: [
                  '腐食',
                  '酸を吐く',
                ],
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 0,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 0,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'start-player-turn',
    animations: [
      // [ターン開始] ドロー後の手札/山札を反映
      {
              waitMs: 0,
              metadata: {
                stage: 'turn-start',
                draw: 2,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 3,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '再装填',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 4,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                ],
                discardCount: 0,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 8,
    animations: [
      // [カード移動] cardId=8 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 8,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 3,
                },
                hand: [
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 4,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 6,
                    title: '戦いの準備',
                  },
                ],
                discardCount: 1,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=8 の攻撃結果
      {
              waitMs: 0,
              metadata: {
                stage: 'damage',
                cardId: 8,
                defeatedEnemyIds: [],
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 2,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 11,
                    title: '乱れ突き',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 1,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 11,
    operations: [
          {
            type: 'target-enemy',
            payload: 1,
          },
        ],
    animations: [
      // [カード移動] cardId=11 を次ゾーンへ移動
      {
              waitMs: 0,
              metadata: {
                stage: 'card-move',
                cardId: 11,
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 2,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'active',
                  },
                ],
              },
            },
      // [ダメージ演出] cardId=11 の攻撃結果
      {
              waitMs: 800,
              metadata: {
                stage: 'damage',
                cardId: 11,
                defeatedEnemyIds: [
                  1,
                ],
              },
              damageOutcomes: [
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
                {
                  damage: 5,
                  effectType: 'slash',
                },
              ],
              snapshot: {
                player: {
                  hp: 75,
                  mana: 1,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 0,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'escaped',
                  },
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              metadata: {
                stage: 'defeat',
                cardId: 11,
                defeatedEnemyIds: [
                  1,
                ],
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 1,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'escaped',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'state-event',
    animations: [
      // [ステートイベント] 状態効果により敵が退場
      {
              waitMs: 200,
              metadata: {
                stage: 'state-event',
                subject: 'enemy',
                subjectId: 3,
                stateId: 'trait-coward',
                payload: {
                  result: 'escape',
                },
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 1,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'escaped',
                  },
                ],
              },
            },
    ],
  },
  {
    type: 'victory',
    animations: [
      // [勝利] リザルトオーバーレイを表示
      {
              waitMs: 400,
              metadata: {
                stage: 'victory',
              },
              snapshot: {
                player: {
                  hp: 75,
                  mana: 1,
                },
                hand: [
                  {
                    id: 9,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '腐食',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 12,
                    title: '乱れ突き',
                  },
                  {
                    id: 7,
                    title: '日課',
                  },
                  {
                    id: 14,
                    title: '酸を吐く',
                  },
                  {
                    id: 1,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 2,
                exileCount: 1,
                deckCount: 4,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 30,
                    status: 'escaped',
                  },
                ],
              },
            },
    ],
  },
]