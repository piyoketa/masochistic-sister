import type { Enemy } from '../Enemy'

export type EnemyFactoryWithLevel = (level: number) => Enemy

/**
 * ボーナスレベルをメンバー数に応じてランダム配分し、各メンバーのレベル値を返す。
 * - 基本レベルはすべて1とし、bonusLevels 回だけランダムに+1する。
 * - 同じ個体に複数回加算されることもある。
 */
export function buildMemberLevels(count: number, bonusLevels: number, rng: () => number = Math.random): number[] {
  const safeCount = Math.max(0, count)
  const safeBonus = Math.max(0, bonusLevels)
  const levels = Array.from({ length: safeCount }, () => 1)

  if (safeCount === 0) {
    return levels
  }

  for (let i = 0; i < safeBonus; i += 1) {
    const idx = Math.min(safeCount - 1, Math.max(0, Math.floor(rng() * safeCount)))
    levels[idx] = (levels[idx] ?? 1) + 1
  }

  return levels
}

/**
 * メンバーごとのレベルを算出し、対応するファクトリで Enemy を生成する。
 */
export function createMembersWithLevels(
  factories: EnemyFactoryWithLevel[],
  bonusLevels = 0,
  rng: () => number = createBonusLevelRng(),
): Enemy[] {
  const levels = buildMemberLevels(factories.length, bonusLevels, rng)
  return factories.map((factory, idx) => factory(levels[idx] ?? 1))
}

/**
 * bonusLevels を同一バトル内で deterministic にするための RNG を生成する。
 * - Undo / Retry 時に再生成されても同じ配分になるよう seed 付き PRNG を使用する。
 * - seed 未指定時は既存挙動を維持するため Math.random を返す。
 */
export function createBonusLevelRng(seed?: number | string, fallback: () => number = Math.random): () => number {
  if (seed === undefined) {
    return fallback
  }
  return createMulberry32(seed)
}

function createMulberry32(seed: number | string): () => number {
  let t = typeof seed === 'number' ? seed : hashString(seed)
  return function () {
    t += 0x6d2b79f5
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h >>> 0) || 1
}
