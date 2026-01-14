# BattleView/BattleEnemyArea の jsdom 未定義 `window` 対策計画

## 背景
- `src/views/__tests__/BattleView.spec.ts` 実行時に、`window is not defined` / DOM クリーンアップ不足が原因の Unhandled Errors が多数発生。
- 主因となっている箇所
  - `src/components/battle/BattleEnemyArea.vue` の `triggerEnemyHighlight` で `window.setTimeout` / `clearTimeout` を直接使用。
  - `src/views/BattleView.vue` の `showTransientError` / `clearErrorOverlayTimer` で `window.setTimeout` / `clearTimeout` を直接使用。
  - テスト終了後にタイマーが生きていることで DOM 破棄後に patch が走り、`__vnode` へのアクセスエラーも併発。

## 目的
- jsdom 環境や SSR 相当の実行でも安全に動くよう、`window` 依存を排除またはガードし、タイマーをライフサイクル内で確実に解放する。
- BattleView の単体テストをエラーなしで通す準備をする。

## 実施ステップ案
1. **対象箇所の網羅調査**
   - `rg "window\\.(setTimeout|clearTimeout)" src/components src/views` などで直接参照を洗い出し、テストに関わる部分をリストアップ。
2. **タイマーラッパの導入/利用**
   - `globalThis` ベースで `setTimeout` / `clearTimeout` を安全に呼び出すヘルパを用意するか、各所で `typeof window !== 'undefined' ? window.setTimeout : setTimeout` のようにガードする。
   - 既存実装に無理がなければ、小さなユーティリティ（例: `useSafeTimeout` composable やローカル関数）を導入して再利用。
3. **ライフサイクルでの確実な解放**
   - `onBeforeUnmount` / `onUnmounted` で保持しているタイマーを必ず `clearTimeout` する。
   - テストで `ViewManager` 再初期化やコンポーネントアンマウントが走っても後処理が漏れないようにする。
4. **BattleView 内のエラーメッセージタイマーも同様にガード**
   - `showTransientError` / `clearErrorOverlayTimer` を上記ヘルパ経由に置き換え、`errorOverlayTimer` を null 管理する。
5. **テスト側での後処理確認（必要なら）**
   - もしコンポーネント側で十分にクリーンアップしてもテスト tear down 後のエラーが残る場合、テストの `afterEach` で `wrapper.unmount()` を明示する等の補助を検討。
6. **再実行・確認**
   - `npx vitest src/views/__tests__/BattleView.spec.ts` を実行し、Unhandled Errors が解消されることを確認。

## 不明点・意思決定が必要な点
- **ヘルパ配置**: タイマーガードをどこに置くか（各コンポーネント内のローカル関数 / 共通 composable / ユーティリティファイル）。  
  - 選択肢:  
    1. 各ファイルにローカル関数を追加（影響範囲最小）。  
    2. `src/utils/safeTimer.ts` のような共通ヘルパを追加し、両コンポーネントから利用。  
  - おすすめ: 今回は影響範囲が限定的なので **共通ヘルパを1つ作り、両者で利用**（重複回避・再発防止）。
- **テスト側の補助**: コンポーネント側対応で十分か、それでも残る場合にテストに `afterEach` で明示的 unmount を入れるか。  
  - おすすめ: まずコンポーネント側のガードとタイマー解放で解決を試み、必要に応じてテスト補助を最小限追加。

この計画で進めて問題ないか確認をお願いします。必要ならヘルパ配置やテスト側での補助の方針をご指定ください。  
