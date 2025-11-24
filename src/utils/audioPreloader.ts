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

type LoadedAudioEntry = {
  element: HTMLAudioElement
  objectUrl?: string
}

const loadedAudios = new Map<string, LoadedAudioEntry>()

export interface AudioPreloadReport {
  id: string
  element: HTMLAudioElement
}

export async function preloadAudioAssets(assets: AudioAsset[]): Promise<AudioPreloadReport[]> {
  const reports: AudioPreloadReport[] = []
  await Promise.all(
    assets.map(async (asset) => {
      if (loadedAudios.has(asset.id)) {
        reports.push({ id: asset.id, element: loadedAudios.get(asset.id)!.element })
        return
      }
      try {
        // ネットワーク経由で取得し、オブジェクトURL化してキャッシュすることで
        // cloneNode してもネットワークを叩かずメモリ上のデータを再利用できる。
        const response = await fetch(asset.src)
        if (!response.ok) {
          throw new Error(`Failed to preload audio: ${asset.src} (${response.status})`)
        }
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)
        audio.preload = 'auto'
        const decodable = audio as HTMLAudioElement & { decode?: () => Promise<void> }
        await decodable.decode?.()
        loadedAudios.set(asset.id, { element: audio, objectUrl })
        reports.push({ id: asset.id, element: audio })
      } catch (error) {
        // フェッチに失敗した場合は従来どおり直接パスを使うが、decode の有無は環境依存。
        const fallback = new Audio(asset.src)
        fallback.preload = 'auto'
        const decodable = fallback as HTMLAudioElement & { decode?: () => Promise<void> }
        try {
          await decodable.decode?.()
        } catch {
          // decode が存在しない場合は無視
        }
        loadedAudios.set(asset.id, { element: fallback })
        reports.push({ id: asset.id, element: fallback })
        if (import.meta.env?.DEV) {
          console.warn('[audioPreloader] fetch failed, fallback to direct src', asset.src, error)
        }
      }
    }),
  )
  return reports
}

export function getPreloadedAudio(id: string): HTMLAudioElement | undefined {
  return loadedAudios.get(id)?.element
}
