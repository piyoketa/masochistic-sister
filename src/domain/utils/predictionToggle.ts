/*
predictionToggle.ts の責務:
- プレイヤーHP予測（predictPlayerHpAfterEndTurn）を環境変数で無効化するためのフラグ判定を提供する。
- Model層（Battle/OperationRunner）が共通のトグルを参照できるようにする。

責務ではないこと:
- 予測計算そのものやキャッシュ制御。利用側で適宜ハンドリングする。
*/

export function isPredictionDisabled(): boolean {
  const envFlag =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DISABLE_HP_PREDICTION) ??
    (typeof process !== 'undefined' ? process.env?.VITE_DISABLE_HP_PREDICTION : undefined)
  return envFlag === 'true'
}
