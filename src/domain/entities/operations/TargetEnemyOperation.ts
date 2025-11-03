/*
TargetEnemyOperation.ts の責務:
- プレイヤー／敵が操作対象とする敵キャラクターを識別し、Action へ渡すための `Operation` 実装を提供する。
- 入力された敵ID（数値／オブジェクト）を検証し、`Battle.enemyTeam` 経由で実体を解決する。
- 完了後はターゲットIDをメタデータとして返し、ビュー層やログ出力が参照できるようにする。

責務ではないこと:
- ターゲット操作を必須とするかどうか、または選択後の効果適用（攻撃・状態付与など）の実行。
- 敵IDの採番やリポジトリ管理、敵行動のスケジューリング。これらは `EnemyRepository` や `Enemy` クラスが担当する。

主要な通信相手とインターフェース:
- `OperationContext`（`battle.enemyTeam.findEnemyByNumericId`）: 数値IDから敵インスタンスを取得し、存在しなければ例外を発生させる。
- `ActionBase` / `Attack` など: resolve 済みの `TargetEnemyOperation` を利用してターゲット決定および `metadata.targetEnemyId` を参照する。
- 類似する `SelectHandCardOperation`: いずれも入力バリデーションを担うが、こちらは敵、向こうはプレイヤー手札に対する操作という点で役割が異なる。
*/
import type { Enemy } from '../Enemy'
import { Operation, type OperationContext } from './OperationBase'

export class TargetEnemyOperation extends Operation<Enemy> {
  static readonly TYPE = 'target-enemy'

  constructor() {
    super(TargetEnemyOperation.TYPE)
  }

  protected resolve(payload: unknown, context: OperationContext): Enemy {
    const enemyId = this.extractEnemyId(payload)
    const enemy = context.battle.enemyTeam.findEnemyByNumericId(enemyId)
    if (!enemy) {
      throw new Error(`Enemy ${enemyId} not found`)
    }

    return enemy
  }

  override toMetadata(): Record<string, unknown> {
    const enemy = this.enemy
    const id = enemy.numericId
    if (id === undefined) {
      throw new Error('Enemy missing repository id')
    }

    return { targetEnemyId: id }
  }

  get enemy(): Enemy {
    if (!this.resultValue) {
      throw new Error('Operation not completed')
    }

    return this.resultValue
  }

  private extractEnemyId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const value = (payload as { enemyId?: number; targetEnemyId?: number }).enemyId ??
        (payload as { targetEnemyId?: number }).targetEnemyId
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
        return value
      }
    }

    throw new Error('Operation requires a valid numeric enemy id')
  }
}
