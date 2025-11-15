import type { DamageOutcome } from '@/domain/entities/Damages'

function asset(path: string): string {
  return `/sounds/${path}`
}

const slamSounds = [
  { threshold: 30, src: asset('slam/kurage-kosho_gun-fire02.mp3') },
  { threshold: 20, src: asset('slam/soundeffect-lab_punch3.mp3') },
  { threshold: 10, src: asset('slam/on-jin_punch04.mp3') },
  { threshold: 0, src: asset('slam/taira-komori_punch2a.mp3') },
]

const slashSounds = [
  { threshold: 20, src: asset('slash/taira-komori_kick1.mp3') },
  { threshold: 15, src: asset('slash/taira-komori_heavy_punch1.mp3') },
  { threshold: 10, src: asset('slash/taira-komori_medium_punch1.mp3') },
  { threshold: 0, src: asset('slash/taira-komori_punch2a.mp3') },
]

const spitSound = asset('spit/on-jin_nukarumu01.mp3')
const poisonSound = asset('poison/kurage-kosho_poison3.mp3')

export interface ResolvedSound {
  id: string
  src: string
}

export const damageSoundAssets: ResolvedSound[] = [
  ...slamSounds.map((entry) => ({ id: `slam-${entry.threshold}`, src: entry.src })),
  ...slashSounds.map((entry) => ({ id: `slash-${entry.threshold}`, src: entry.src })),
  { id: 'spit', src: spitSound },
  { id: 'poison', src: poisonSound },
]

export function resolveDamageSound(outcome: DamageOutcome): ResolvedSound {
  const damage = outcome.damage
  switch (outcome.effectType) {
    case 'slash':
      return pickBandedSound('slash', slashSounds, damage)
    case 'slam':
      return pickBandedSound('slam', slamSounds, damage)
    case 'spit':
      return { id: 'spit', src: spitSound }
    case 'poison':
      return { id: 'poison', src: poisonSound }
    default: {
      const fallbackType = outcome.damage > 1 ? 'slash' : 'slam'
      const bands = fallbackType === 'slash' ? slashSounds : slamSounds
      return pickBandedSound(fallbackType, bands, damage)
    }
  }
}

export function resolveDefaultSound(damage: number): ResolvedSound {
  const bands = damage > 1 ? slashSounds : slamSounds
  const type = damage > 1 ? 'slash' : 'slam'
  return pickBandedSound(type, bands, damage)
}

function pickBandedSound(
  label: string,
  bands: Array<{ threshold: number; src: string }>,
  damage: number,
): ResolvedSound {
  const band = bands.find((entry) => damage >= entry.threshold) ?? bands[bands.length - 1]
  return { id: `${label}-${band.threshold}`, src: band.src }
}
