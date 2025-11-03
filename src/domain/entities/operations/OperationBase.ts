/*
OperationBase.ts の責務:
- アクション入力を表す Operation 抽象クラスと関連型（OperationContext / CardOperation）を定義し、各種操作のライフサイクルを統一的に扱えるようにする。
- Operation の完了状態管理とメタデータ出力の骨格を提供し、派生クラスが入力検証や結果生成に集中できる環境を整える。

責務ではないこと:
- 各 Operation がどのようなドメイン知識で入力を解釈するか（例：敵/カード検索）は派生クラス側の実装に委ねる。
- Operation を実際に要求するかどうかの判断や、操作結果の利用方法（ターゲット選択後の処理など）は `Action` 側が担う。

主要な通信相手とインターフェース:
- `ActionBase`（`prepareContext`）: Operation を生成して `complete` を呼び出し、結果や `toMetadata` の情報を ActionContext へ取り込む。
- `Battle` / `Player`: OperationContext として渡され、操作解決時に戦闘状態へアクセスするための橋渡しを担う。
- 派生 Operation クラス（TargetEnemyOperation など）: `resolve` を実装して入力検証や検索処理を行い、必要に応じて `toMetadata` でビュー層へ追加情報を提供する。
*/
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'

export type OperationStatus = 'pending' | 'completed'

export interface OperationContext {
  battle: Battle
  player: Player
}

export interface CardOperation {
  type: string
  payload?: unknown
  status?: OperationStatus
}

export abstract class Operation<TResult = unknown> {
  readonly type: string
  protected statusValue: OperationStatus = 'pending'
  protected resultValue?: TResult

  protected constructor(type: string) {
    this.type = type
  }

  get status(): OperationStatus {
    return this.statusValue
  }

  isCompleted(): boolean {
    return this.statusValue === 'completed'
  }

  complete(payload: unknown, context: OperationContext): void {
    this.resultValue = this.resolve(payload, context)
    this.statusValue = 'completed'
  }

  protected abstract resolve(payload: unknown, context: OperationContext): TResult

  toMetadata(): Record<string, unknown> {
    return {}
  }
}
