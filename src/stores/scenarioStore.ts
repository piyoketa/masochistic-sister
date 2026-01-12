/**
 * ScenarioStore の責務:
 * - シナリオスクリプトをキューとして保持し、現在表示すべきノードを管理する。
 * - 次のノードに進む/シナリオを差し替えるといった進行制御を提供する。
 *
 * 責務ではないこと:
 * - テキスト表示や演出の描画。表示は TextWindowOverlayLayer など View 側が担当する。
 * - 音楽・画像・報酬などの演出実行。将来拡張は行うが、ここではデータ保持のみ。
 *
 * 主な通信相手とインターフェース:
 * - App.vue / TextWindowOverlayLayer.vue が useScenarioStore を通じて参照/操作する。
 *   - setScenario(nodes): シナリオを新規に差し替える。
 *   - advance(): 現在位置を 1 つ進める。
 *   - clearScenario(): 進行中シナリオを破棄する。
 * - ScenarioNode はシナリオ構成要素の型で、現状は ScenarioTextNode のみ。
 *   - 将来的に音楽再生などのノードを追加するが、TextNode と混同しないため union で管理する。
 */
import { defineStore } from 'pinia'

export type ScenarioTextNode =
  | {
      type: 'text'
      kind: 'narration'
      text: string
    }
  | {
      type: 'text'
      kind: 'speech'
      speaker: string
      text: string
    }

export type ScenarioNode = ScenarioTextNode

interface ScenarioState {
  nodes: ScenarioNode[]
  currentIndex: number
}

export const useScenarioStore = defineStore('scenario', {
  state: (): ScenarioState => ({
    nodes: [],
    currentIndex: 0,
  }),
  getters: {
    hasRemaining: (state) => state.currentIndex < state.nodes.length,
    currentNode: (state) => state.nodes[state.currentIndex] ?? null,
  },
  actions: {
    setScenario(nodes: ScenarioNode[]) {
      // 進行中のシナリオは丸ごと差し替える前提で初期位置に戻す。
      this.nodes = nodes
      this.currentIndex = 0
    },
    clearScenario() {
      // 画面遷移時に残留しないよう、空配列に戻して明示的に終了させる。
      this.nodes = []
      this.currentIndex = 0
    },
    advance() {
      // shift を使うと履歴が失われるため、インデックスでキュー消費を表現する設計。
      if (this.currentIndex < this.nodes.length) {
        this.currentIndex += 1
      }
    },
  },
})
