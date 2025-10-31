# 戦闘ドメイン モデリングガイド

戦闘システム（`src/domain` 配下）はフロントエンドから独立した TypeScript のドメイン層として設計されています。本書では主要クラス・プロパティ・メソッドの役割と、攻撃処理の流れを整理します。

---

## Battle ― 戦闘全体の集約
| 役割 | 1 回の戦闘状況を表す集約ルート。ID 採番、カード移動、ターン管理などの戦闘進行機能を司る。 |
| --- | --- |
| 主なプロパティ | `player` (`Player`)、`enemyTeam` (`EnemyTeam`)、`deck` / `hand` / `discardPile` / `exilePile`、`events`、`cardRepository` |
| 主なメソッド | `playCard(cardId, operations)` / `performEnemyAction(enemyId)` / `damagePlayer(amount)` / `addCardToPlayerHand(card)` / `getSnapshot()` |

- `cardRepository`: 戦闘中のカード ID を一括管理し、記憶カード生成などのユーティリティも提供します。
- `playCard` は `Card` インスタンスへ委譲するだけの薄いラッパー。操作バリデーション（ターン確認など）だけを担い、ドメインロジックを `Card`/`Action` に寄せています。

---

## Card ― カード本体
| 役割 | アクションカードまたは状態カード 1 枚を表す。 |
| --- | --- |
| 主なプロパティ | `action` (`Action`)、`state` (`State`)、`cardTags`、`definition`（タイトル・コスト等の表示用定義） |
| 主なメソッド | `play(battle, operations)` / `copyWith(overrides)` |

- `play` 内で `Action.prepareContext` を呼び、Operation 収集→バリデーション→対象選択→効果実行→墓地/除外移動までを順序立てて処理します。
- `copyWith` はデッキ生成などで同一アクションを別定義で扱いたい場合に使用します。

---

## Action と Attack
### Action (基底)
| メソッド/プロパティ | 説明 |
| --- | --- |
| `prepareContext({ battle, source, operations })` | 操作入力を `Operation` クラスへ委譲して検証し、`ActionContext` を生成します。ここで `resolveTarget` を呼び出し、`context.target` をセットします。 |
| `buildOperations()` / `shouldRequireOperation()` | 必須 Operation の宣言と要否判定。攻撃以外の特殊アクションにも使えるよう、Hook で判断可能。 |
| `resolveTarget(context)` | 既定実装は `TargetEnemyOperation` から敵を取得します。敵選択不要なアクションは `buildOperations` で `TargetEnemyOperation` を返さないことで、`context.target` が `undefined` のままになります。 |

### Attack (Action の派生)
| 追加プロパティ/メソッド | 説明 |
| --- | --- |
| `baseDamages` (`Damages`) | 技の基本ダメージ定義。ダメージ量・回数・参照 State の記録をまとめて扱います。 |
| `execute(context)` | 攻撃共通フロー（事前処理→ダメージ計算→HP 減算→記憶カード生成）を実装。`beforeAttack`/`onAfterDamage` で個別の副次効果を差し込めます。 |
| `calcDamages(attacker, defender)` | 筋力/加速/腐食/硬い殻 など双方の `State` を走査して最終ダメージを算出し、参照した State を `Damages` 内に格納します。 |
| `cloneWithDamages(damages, overrides)` | 同一アクションをダメージのみ変更した「記憶カード」として複製するためのユーティリティ。 |
| `setOverrideDamages(damages)` | `beforeAttack` などでダメージを上書きしたいときに使用します。`calcDamages` 呼び出し前に 1 度だけ有効。 |

> ※ `Attack.execute` の冒頭にある日本語コメントは、ターゲット解決やプレイヤー被弾時の記憶カード生成など共通処理の意図を説明しています。

---

## Damages
`amount`（1 回の与ダメ量）、`count`（ヒット数）、`type`（single/multi）、`attackerStates` / `defenderStates`（ダメージ補正に利用した状態の記録）をまとめた値オブジェクト。`Attack.calcDamages` の結果として利用し、記憶カードにも同じ値を転写します。

---

## Operation
| クラス | 用途 |
| --- | --- |
| `TargetEnemyOperation` | `payload` から敵のリポジトリ ID を取得し、`Battle.enemyTeam` から `Enemy` を検索する。 |
| `SelectHandCardOperation` | 手札のカード ID を受け取り、`Hand` から該当カードを返す。 |

Operation は `Action.prepareContext` 内で順番に解決され、`ActionContext.operations` に保存されます。各 Operation は `toMetadata()` を返し、`ActionContext.metadata` にマージされるため、追加情報が必要な特殊アクションでも活用できます。

---

## Player / Enemy
### Player
| プロパティ | 説明 |
| --- | --- |
| `states` | プレイヤーに付与された状態異常（`State` 配列）。 |
| `addState(state, { battle? })` | 状態追加と同時に、対応する状態カードを手札へ記憶。`battle` が渡された場合のみカード化します。※コードに日本語コメントあり。 |

### Enemy
| プロパティ | 説明 |
| --- | --- |
| `actions` | 敵が順番に使用する `Action` 配列。 |
| `traits` / `states` | 固有特性・戦闘中の状態異常。 |
| `act(battle)` | 次の `Action` を取得し、`prepareContext` → `execute` までを実行。 |

`EnemyTeam` は敵リポジトリを保持し、数値 ID 管理・行動順の決定を担当します。

---

## CardRepository
| ユーティリティ | 説明 |
| --- | --- |
| `create<T>(factory)` / `register(card)` | 戦闘中カードの ID 採番と登録。 |
| `createNewAttack(damages, baseAttack)` | 元アクションを `cloneWithDamages` で複製し、記憶カード定義を上書き。 |
| `memoryEnemyAttack(damages, baseAttack, battle?)` | 記憶カードを生成し、バトルが指定されていれば手札に直接追加。※内部コメントあり。 |
| `createStateCard(state)` / `memoryState(state, battle)` | 状態異常をカード化し、手札に追加するヘルパー。 |

---

## State
状態異常・特性の共通表現。`magnitude`（威力）、`description`、`cardDefinition`（カード化時の定義）を持ちます。特定の行動で参照される ID は以下が代表例です。

| State ID | 効果 |
| --- | --- |
| `state-strength` | ダメージ量に加算。 |
| `state-acceleration` | 攻撃ヒット数を増加。 |
| `state-corrosion` | 被ダメージに +10 を加算。 |
| `state-hard-shell` | 被ダメージから一定量を減算。 |

---

## 攻撃処理の時系列まとめ
1. `Card.play` → `Action.prepareContext`
   - 必須 Operation を解決し、`ActionContext` を構築 (`context.target` も決まる)。
2. `Attack.execute`
   1. 事前フック `beforeAttack`（カードコスト消費・選択カード破棄など）。
   2. `calcDamages` でダメージと参照 State を算出。
   3. HP 変動 (`Battle.damagePlayer` / `Enemy.takeDamage`)。
   4. 事後フック `onAfterDamage`（状態異常付与など）。
   5. プレイヤー被弾時は `CardRepository.memoryEnemyAttack` で記憶カードを生成・手札追加。
3. `Card` 自身は `moveToNextZone` で捨て札 or 除外処理。

---

## documents から読むべきポイント
- `Attack.execute` / `calcDamages` には日本語コメントを添付し、共通処理の意図が読み取りやすくなっています。
- `Player.addState` や `CardRepository.memoryEnemyAttack` にもコメントを加え、状態カード追加や記憶カード生成のトリガータイミングを補足しています。

この構成により、敵/プレイヤー双方が同じ `Action`・`State` を共有しつつ、攻撃のダメージ計算・記憶カード生成・状態管理が統一されたパイプラインで処理できるようになっています。今後新しい技を追加する際は、`Action` のフック (`beforeAttack` / `onAfterDamage`) と `Damages` の再利用を意識すると、安全かつ効率的に拡張できます。
