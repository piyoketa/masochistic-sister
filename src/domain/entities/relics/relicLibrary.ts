import { SacrificialAwarenessRelic } from './SacrificialAwarenessRelic'
import { MucusOrbRelic } from './MucusOrbRelic'
import { MemoRelic } from './MemoRelic'
import { AdversityExcitementRelic } from './AdversityExcitementRelic'
import { LightweightCombatRelic } from './LightweightCombatRelic'
import { ActionForceRelic } from './ActionForceRelic'
import { PureBodyRelic } from './PureBodyRelic'
import { NoViolenceRelic } from './NoViolenceRelic'
import { SlipperyTouchRelic } from './SlipperyTouchRelic'
import { DevoutBelieverRelic } from './DevoutBelieverRelic'
import { ArcaneAdaptationRelic } from './ArcaneAdaptationRelic'
import { DailyRoutineRelic } from './DailyRoutineRelic'
import { RedrawRelic } from './RedrawRelic'
import { HolyProtectionRelic } from './HolyProtectionRelic'
import { MemorySaintRelic } from './MemorySaintRelic'
import { ThoroughPreparationRelic } from './ThoroughPreparationRelic'
import { RepulsionRelic } from './RepulsionRelic'
import { DeathMatchRelic } from './DeathMatchRelic'
import { DevilsKissRelic } from './DevilsKissRelic'
import type { Relic, RelicDescriptionContext, RelicUsageType } from './Relic'
import type { RelicId } from './relicTypes'

export type RelicInfo = {
  id: RelicId
  name: string
  usageType: RelicUsageType
  icon: string
  description: string
}

const RELIC_FACTORIES: Record<RelicId, () => Relic> = {
  'memory-saint-relic': () => new MemorySaintRelic(),
  'sacrificial-awareness': () => new SacrificialAwarenessRelic(),
  'mucus-orb': () => new MucusOrbRelic(),
  'memo-relic': () => new MemoRelic(),
  'adversity-excitement': () => new AdversityExcitementRelic(),
  'lightweight-combat': () => new LightweightCombatRelic(),
  'action-force': () => new ActionForceRelic(),
  'pure-body': () => new PureBodyRelic(),
  'no-violence': () => new NoViolenceRelic(),
  'slippery-touch': () => new SlipperyTouchRelic(),
  'devout-believer': () => new DevoutBelieverRelic(),
  'arcane-adaptation': () => new ArcaneAdaptationRelic(),
  'redraw-relic': () => new RedrawRelic(),
  'thorough-preparation': () => new ThoroughPreparationRelic(),
  'repulsion': () => new RepulsionRelic(),
  'death-match': () => new DeathMatchRelic(),
  'devils-kiss': () => new DevilsKissRelic(),
  'holy-protection': () => new HolyProtectionRelic(),
  'daily-routine-relic': () => new DailyRoutineRelic(),
}

// 設計上の決定: 旧セーブや実績報酬のクラス名文字列を RelicId へ移行するための変換表を保持する。
const LEGACY_RELIC_CLASSNAME_TO_ID: Record<string, RelicId> = {
  MemorySaintRelic: 'memory-saint-relic',
  SacrificialAwarenessRelic: 'sacrificial-awareness',
  MucusOrbRelic: 'mucus-orb',
  MemoRelic: 'memo-relic',
  AdversityExcitementRelic: 'adversity-excitement',
  LightweightCombatRelic: 'lightweight-combat',
  ActionForceRelic: 'action-force',
  PureBodyRelic: 'pure-body',
  NoViolenceRelic: 'no-violence',
  SlipperyTouchRelic: 'slippery-touch',
  DevoutBelieverRelic: 'devout-believer',
  ArcaneAdaptationRelic: 'arcane-adaptation',
  RedrawRelic: 'redraw-relic',
  ThoroughPreparationRelic: 'thorough-preparation',
  RepulsionRelic: 'repulsion',
  DeathMatchRelic: 'death-match',
  DevilsKissRelic: 'devils-kiss',
  HolyProtectionRelic: 'holy-protection',
  DailyRoutineRelic: 'daily-routine-relic',
}

export function listRelicIds(): RelicId[] {
  return Object.keys(RELIC_FACTORIES) as RelicId[]
}

export function resolveRelicId(value: string): RelicId | null {
  if (value in RELIC_FACTORIES) {
    return value as RelicId
  }
  return LEGACY_RELIC_CLASSNAME_TO_ID[value] ?? null
}

export function instantiateRelic(relicId: RelicId): Relic | null {
  const factory = RELIC_FACTORIES[relicId]
  if (!factory) return null
  try {
    return factory()
  } catch {
    return null
  }
}

export function getRelicInfo(relicId: RelicId, context?: RelicDescriptionContext): RelicInfo | null {
  const relic = instantiateRelic(relicId)
  if (!relic) return null
  return {
    id: relic.id,
    name: relic.name,
    usageType: relic.usageType,
    icon: relic.icon,
    description: relic.description(context),
  }
}

export type { RelicId }
