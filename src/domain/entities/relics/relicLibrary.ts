import { SacrificialAwarenessRelic } from './SacrificialAwarenessRelic'
import { AdversityExcitementRelic } from './AdversityExcitementRelic'
import { LightweightCombatRelic } from './LightweightCombatRelic'
import { ActionForceRelic } from './ActionForceRelic'
import { PureBodyRelic } from './PureBodyRelic'
import { NoViolenceRelic } from './NoViolenceRelic'
import { SlipperyTouchRelic } from './SlipperyTouchRelic'
import { DevoutBelieverRelic } from './DevoutBelieverRelic'
import { ArcaneAdaptationRelic } from './ArcaneAdaptationRelic'
import { MemorySaintRelic } from './MemorySaintRelic'
import { ThoroughPreparationRelic } from './ThoroughPreparationRelic'
import { RepulsionRelic } from './RepulsionRelic'
import { DeathMatchRelic } from './DeathMatchRelic'
import { DevilsKissRelic } from './DevilsKissRelic'
import type { Relic, RelicDescriptionContext, RelicUsageType } from './Relic'
import type { RelicId } from './relicTypes'

export type RelicInfo = {
  className: string
  id: RelicId
  name: string
  usageType: RelicUsageType
  icon: string
  description: string
}

const RELIC_FACTORIES: Record<string, () => Relic> = {
  MemorySaintRelic: () => new MemorySaintRelic(),
  SacrificialAwarenessRelic: () => new SacrificialAwarenessRelic(),
  AdversityExcitementRelic: () => new AdversityExcitementRelic(),
  LightweightCombatRelic: () => new LightweightCombatRelic(),
  ActionForceRelic: () => new ActionForceRelic(),
  PureBodyRelic: () => new PureBodyRelic(),
  NoViolenceRelic: () => new NoViolenceRelic(),
  SlipperyTouchRelic: () => new SlipperyTouchRelic(),
  DevoutBelieverRelic: () => new DevoutBelieverRelic(),
  ArcaneAdaptationRelic: () => new ArcaneAdaptationRelic(),
  ThoroughPreparationRelic: () => new ThoroughPreparationRelic(),
  RepulsionRelic: () => new RepulsionRelic(),
  DeathMatchRelic: () => new DeathMatchRelic(),
  DevilsKissRelic: () => new DevilsKissRelic(),
}

export function listRelicClassNames(): string[] {
  return Object.keys(RELIC_FACTORIES)
}

export function instantiateRelic(className: string): Relic | null {
  const factory = RELIC_FACTORIES[className]
  if (!factory) return null
  try {
    return factory()
  } catch {
    return null
  }
}

export function getRelicInfo(className: string, context?: RelicDescriptionContext): RelicInfo | null {
  const relic = instantiateRelic(className)
  if (!relic) return null
  return {
    className,
    id: relic.id,
    name: relic.name,
    usageType: relic.usageType,
    icon: relic.icon,
    description: relic.description(context),
  }
}

export type { RelicId }
