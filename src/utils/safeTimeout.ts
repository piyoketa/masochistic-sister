/**
 * SSR/jsdom 環境でも安全にタイマーを扱うためのユーティリティ。
 * window が未定義の場合は no-op とし、返却値は null に統一する。
 */
export type SafeTimeoutHandle = ReturnType<typeof setTimeout> | null

export function safeSetTimeout(handler: () => void, delayMs: number): SafeTimeoutHandle {
  const set = typeof globalThis.setTimeout === 'function' ? globalThis.setTimeout : null
  if (!set) {
    return null
  }
  return set(handler, delayMs) as SafeTimeoutHandle
}

export function safeClearTimeout(handle: SafeTimeoutHandle): void {
  if (!handle) {
    return
  }
  const clear = typeof globalThis.clearTimeout === 'function' ? globalThis.clearTimeout : null
  if (!clear) {
    return
  }
  clear(handle as any)
}
