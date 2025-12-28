import { Relic } from './Relic'
import { SacrificialAwarenessRelic } from './SacrificialAwarenessRelic'
import { AdversityExcitementRelic } from './AdversityExcitementRelic'
import { LightweightCombatRelic } from './LightweightCombatRelic'
import { DevilsKissRelic } from './DevilsKissRelic'
import { ActionForceRelic } from './ActionForceRelic'
import { PureBodyRelic } from './PureBodyRelic'
import { NoViolenceRelic } from './NoViolenceRelic'
import { SlipperyTouchRelic } from './SlipperyTouchRelic'
import { DevoutBelieverRelic } from './DevoutBelieverRelic'
import { ArcaneAdaptationRelic } from './ArcaneAdaptationRelic'
import { ThoroughPreparationRelic } from './ThoroughPreparationRelic'
import { MemorySaintRelic } from './MemorySaintRelic'
import { RepulsionRelic } from './RepulsionRelic'
import { DeathMatchRelic } from './DeathMatchRelic'
import { DailyRoutineRelic } from './DailyRoutineRelic'

export type { Relic } from './Relic'
export { ActiveRelic } from './ActiveRelic'
export {
  SacrificialAwarenessRelic,
  AdversityExcitementRelic,
  LightweightCombatRelic,
  DevilsKissRelic,
  ActionForceRelic,
  PureBodyRelic,
  NoViolenceRelic,
  SlipperyTouchRelic,
  DevoutBelieverRelic,
  ArcaneAdaptationRelic,
  ThoroughPreparationRelic,
  MemorySaintRelic,
  RepulsionRelic,
  DeathMatchRelic,
  DailyRoutineRelic,
}

export const DEFAULT_PLAYER_RELICS: Relic[] = [
  new MemorySaintRelic(),
  new SacrificialAwarenessRelic(),
  new AdversityExcitementRelic(),
  new LightweightCombatRelic(),
  new DevilsKissRelic(),
  new ActionForceRelic(),
  new PureBodyRelic(),
  new NoViolenceRelic(),
  new SlipperyTouchRelic(),
  new DevoutBelieverRelic(),
  new ArcaneAdaptationRelic(),
  new ThoroughPreparationRelic(),
  new RepulsionRelic(),
  new DeathMatchRelic(),
  new DailyRoutineRelic(),
]
