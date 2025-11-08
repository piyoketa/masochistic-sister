// 自動生成: tests/fixtures/battleSampleExpectedActionLog.ts
export const ACTION_LOG_SUMMARY = [
  {
    type: 'battle-start',
    animations: [
      // [バトル開始] 初期手札と盤面を描画
      {
              waitMs: 0,
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
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'battle-start',
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
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'turn-start',
                draw: 2,
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
            payload: 3,
          },
        ],
    animations: [
      // [カード移動] cardId=4 を次ゾーンへ移動
      {
              waitMs: 0,
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
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 4,
              },
            },
      // [ダメージ演出] cardId=4 の攻撃結果
      {
              waitMs: 0,
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
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
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
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'damage',
                cardId: 4,
                defeatedEnemyIds: [],
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 2,
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
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 7,
              },
            },
      // [ダメージ演出] cardId=7 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 145,
                  mana: 1,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                ],
                discardCount: 2,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'damage',
                cardId: 7,
                defeatedEnemyIds: [],
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
              snapshot: {
                player: {
                  hp: 145,
                  mana: 1,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 6,
              },
            },
      // [ダメージ演出] cardId=6 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 145,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'damage',
                cardId: 6,
                defeatedEnemyIds: [],
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'turn-end',
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 0,
                actionId: 'たいあたり',
                skipped: false,
              },
            },
      // [ダメージ演出] 敵0のたいあたり結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              damageOutcomes: [
                {
                  damage: 30,
                  effectType: 'slash',
                },
              ],
              metadata: {
                stage: 'damage',
                enemyId: 0,
                actionId: 'たいあたり',
              },
            },
      // [手札追加] 敵攻撃の記憶カードを手札へ
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'memory-card',
                enemyId: 0,
                cards: [
                  'たいあたり',
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 1,
                actionId: '戦いの舞い',
                skipped: false,
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 2,
                actionId: '粘液飛ばし',
                skipped: false,
              },
            },
      // [ダメージ演出] 敵2の粘液飛ばし結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              damageOutcomes: [
                {
                  damage: 15,
                  effectType: 'slash',
                },
              ],
              metadata: {
                stage: 'damage',
                enemyId: 2,
                actionId: '粘液飛ばし',
              },
            },
      // [手札追加] 敵攻撃の記憶カードを手札へ
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'memory-card',
                enemyId: 2,
                cards: [
                  'ねばねば',
                  '粘液飛ばし',
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 2,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 3,
                actionId: '行動済み',
                skipped: true,
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 4,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'turn-start',
                draw: 2,
                handOverflow: true,
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
              snapshot: {
                player: {
                  hp: 100,
                  mana: 4,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 11,
                    title: 'たいあたり',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 3,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
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
            },
    ],
  },
  {
    type: 'play-card',
    card: 11,
    operations: [
          {
            type: 'target-enemy',
            payload: 3,
          },
        ],
    animations: [
      // [カード移動] cardId=11 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 4,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 4,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 10,
                    status: 'active',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 11,
              },
            },
      // [ダメージ演出] cardId=11 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 4,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'active',
                  },
                ],
              },
              damageOutcomes: [
                {
                  damage: 10,
                  effectType: 'slash',
                },
              ],
              metadata: {
                stage: 'damage',
                cardId: 11,
                defeatedEnemyIds: [
                  3,
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              snapshot: {
                player: {
                  hp: 100,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 4,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'defeat',
                cardId: 11,
                defeatedEnemyIds: [
                  3,
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 10,
    operations: [
          {
            type: 'target-enemy',
            payload: 2,
          },
        ],
    animations: [
      // [カード移動] cardId=10 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 5,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 25,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 10,
              },
            },
      // [ダメージ演出] cardId=10 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 13,
                    title: '粘液飛ばし',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 5,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              damageOutcomes: [
                {
                  damage: 5,
                  effectType: 'slash',
                },
              ],
              metadata: {
                stage: 'damage',
                cardId: 10,
                defeatedEnemyIds: [],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 13,
    operations: [
          {
            type: 'target-enemy',
            payload: 2,
          },
        ],
    animations: [
      // [カード移動] cardId=13 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 6,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 20,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 13,
              },
            },
      // [ダメージ演出] cardId=13 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 1,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 6,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'active',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              damageOutcomes: [
                {
                  damage: 20,
                  effectType: 'slash',
                },
              ],
              metadata: {
                stage: 'damage',
                cardId: 13,
                defeatedEnemyIds: [
                  2,
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 1,
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
                    id: 9,
                    title: '腐食',
                  },
                  {
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 6,
                exileCount: 0,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'defeat',
                cardId: 13,
                defeatedEnemyIds: [
                  2,
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 9,
    animations: [
      // [カード移動] cardId=9 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 1,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 9,
              },
            },
      // [ダメージ演出] cardId=9 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 100,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'damage',
                cardId: 9,
                defeatedEnemyIds: [],
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'turn-end',
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 0,
                actionId: 'ビルドアップ',
                skipped: false,
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 1,
                actionId: '乱れ突き',
                skipped: false,
              },
            },
      // [ダメージ演出] 敵1の乱れ突き結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
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
              metadata: {
                stage: 'damage',
                enemyId: 1,
                actionId: '乱れ突き',
              },
            },
      // [手札追加] 敵攻撃の記憶カードを手札へ
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'memory-card',
                enemyId: 1,
                cards: [
                  '乱れ突き',
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 2,
                actionId: '戦闘不能',
                skipped: true,
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 6,
                exileCount: 1,
                deckCount: 1,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'enemy-highlight',
                enemyId: 3,
                actionId: '戦闘不能',
                skipped: true,
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
              snapshot: {
                player: {
                  hp: 60,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 8,
                    title: '疼き',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 0,
                exileCount: 1,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'turn-start',
                draw: 2,
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 8,
    operations: [
          {
            type: 'select-hand-card',
            payload: 14,
          },
        ],
    animations: [
      // [カード移動] cardId=8 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 0,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 8,
              },
            },
      // [ダメージ演出] cardId=8 の攻撃結果
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 14,
                    title: '乱れ突き',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 15,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 0,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'damage',
                cardId: 8,
                defeatedEnemyIds: [],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 14,
    operations: [
          {
            type: 'target-enemy',
            payload: 0,
          },
        ],
    animations: [
      // [カード移動] cardId=14 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 15,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 1,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 14,
              },
            },
      // [ダメージ演出] cardId=14 の攻撃結果
      {
              waitMs: 600,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 1,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 15,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 1,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'active',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
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
              metadata: {
                stage: 'damage',
                cardId: 14,
                defeatedEnemyIds: [
                  0,
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 1,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                  {
                    id: 15,
                    title: '乱れ突き',
                  },
                ],
                discardCount: 1,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'defeat',
                cardId: 14,
                defeatedEnemyIds: [
                  0,
                ],
              },
            },
    ],
  },
  {
    type: 'play-card',
    card: 15,
    operations: [
          {
            type: 'target-enemy',
            payload: 1,
          },
        ],
    animations: [
      // [カード移動] cardId=15 を次ゾーンへ移動
      {
              waitMs: 0,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 1,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 2,
                exileCount: 2,
                deckCount: 5,
                enemies: [
                  {
                    id: 0,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 1,
                    hp: 40,
                    status: 'active',
                  },
                  {
                    id: 2,
                    hp: 0,
                    status: 'defeated',
                  },
                  {
                    id: 3,
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'card-move',
                cardId: 15,
              },
            },
      // [ダメージ演出] cardId=15 の攻撃結果
      {
              waitMs: 600,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 2,
                exileCount: 2,
                deckCount: 5,
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
                    hp: 0,
                    status: 'defeated',
                  },
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
              metadata: {
                stage: 'damage',
                cardId: 15,
                defeatedEnemyIds: [
                  1,
                ],
              },
            },
      // [撃破演出] 撃破された敵を退場
      {
              waitMs: 1000,
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 2,
                exileCount: 2,
                deckCount: 5,
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
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'defeat',
                cardId: 15,
                defeatedEnemyIds: [
                  1,
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
              snapshot: {
                player: {
                  hp: 60,
                  mana: 0,
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
                    id: 2,
                    title: '天の鎖',
                  },
                  {
                    id: 12,
                    title: 'ねばねば',
                  },
                  {
                    id: 5,
                    title: '被虐のオーラ',
                  },
                  {
                    id: 3,
                    title: '天の鎖',
                  },
                  {
                    id: 10,
                    title: '酸を吐く',
                  },
                ],
                discardCount: 2,
                exileCount: 2,
                deckCount: 5,
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
                    hp: 0,
                    status: 'defeated',
                  },
                ],
              },
              metadata: {
                stage: 'victory',
              },
            },
    ],
  },
]