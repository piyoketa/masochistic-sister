import { vi } from 'vitest'

// jsdom では HTMLCanvasElement.getContext が未実装のため、警告/例外を抑制するスタブを差し込む
if (typeof HTMLCanvasElement !== 'undefined') {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
}
