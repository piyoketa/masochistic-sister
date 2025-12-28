import type { EnemyProps } from '../Enemy'

export type EnemyLevelConfig = {
  level: number
  apply: (props: EnemyProps, targetLevel: number) => EnemyProps
}

export interface EnemyLevelOption extends Partial<EnemyProps> {
  level?: number
}

/**
 * HP増強だけを標準で行うレベル設定を返す。
 * - Lv2: HP +hpStep
 * - Lv3+: HP +hpStep*2 （未定義レベルはここに張り付く）
 */
export function buildDefaultLevelConfigs(baseMaxHp: number, hpStep = 10): EnemyLevelConfig[] {
  return [
    {
      level: 2,
      apply: (props) => {
        const nextHp = baseMaxHp + hpStep
        return { ...props, maxHp: nextHp, currentHp: nextHp }
      },
    },
    {
      level: 3,
      apply: (props) => {
        const nextHp = baseMaxHp + hpStep * 2
        return { ...props, maxHp: nextHp, currentHp: nextHp }
      },
    },
  ]
}

/**
 * レベル設定を適用した上で、呼び出し元のオーバーライド（引数）を最優先でマージするヘルパー。
 * - targetLevel 以上のレベル設定を順に適用する（未定義レベルは最後に定義された設定に張り付く）。
 * - configs はレベル昇順にソートしてから適用する。
 * - options（引数）で指定された値が最終的に優先される。
 */
export function buildEnemyPropsWithLevel(
  baseProps: EnemyProps,
  configs: EnemyLevelConfig[] = [],
  options?: EnemyLevelOption,
): EnemyProps {
  const { level, ...overrides } = options ?? {}
  const targetLevel = Math.max(1, level ?? 1)
  const sortedConfigs = [...configs].sort((a, b) => a.level - b.level)
  const configured = sortedConfigs.reduce((props, config) => {
    if (targetLevel >= config.level) {
      return config.apply({ ...props }, targetLevel)
    }
    return props
  }, { ...baseProps })

  return {
    ...configured,
    ...overrides,
    level: targetLevel,
  }
}
