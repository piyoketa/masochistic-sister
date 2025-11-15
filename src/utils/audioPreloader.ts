/**
 * audioPreloader.ts の責務:
 * - 効果音ファイルを事前に読み込み、再生時の遅延を抑える。
 *
 * 責務ではないこと:
 * - 効果音の再生キュー管理。呼び出し側のコンポーネントで扱う。
 */

export interface AudioAsset {
  id: string
  src: string
}

const loadedAudios = new Map<string, HTMLAudioElement>()

export interface AudioPreloadReport {
  id: string
  element: HTMLAudioElement
}

export async function preloadAudioAssets(assets: AudioAsset[]): Promise<AudioPreloadReport[]> {
  const reports: AudioPreloadReport[] = []
  await Promise.all(
    assets.map(async (asset) => {
      if (loadedAudios.has(asset.id)) {
        reports.push({ id: asset.id, element: loadedAudios.get(asset.id)! })
        return
      }
      const audio = new Audio(asset.src)
      audio.preload = 'auto'
      try {
        await audio.decode?.()
      } catch {
        // ブラウザによって decode が存在しないため無視
      }
      loadedAudios.set(asset.id, audio)
      reports.push({ id: asset.id, element: audio })
    }),
  )
  return reports
}

export function getPreloadedAudio(id: string): HTMLAudioElement | undefined {
  return loadedAudios.get(id)
}
