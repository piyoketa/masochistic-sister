import { Relic } from './Relic'
import { SacrificialAwarenessRelic } from './SacrificialAwarenessRelic'
import { AdversityExcitementRelic } from './AdversityExcitementRelic'
import { LightweightCombatRelic } from './LightweightCombatRelic'
import { ActionForceRelic } from './ActionForceRelic'
import { PureBodyRelic } from './PureBodyRelic'
import { NoViolenceRelic } from './NoViolenceRelic'
import { SlipperyTouchRelic } from './SlipperyTouchRelic'
import { DevoutBelieverRelic } from './DevoutBelieverRelic'
import { ArcaneAdaptationRelic } from './ArcaneAdaptationRelic'

export type { Relic } from './Relic'

export const DEFAULT_PLAYER_RELICS: Relic[] = [
  new SacrificialAwarenessRelic(),
  new AdversityExcitementRelic(),
  new LightweightCombatRelic(),
  new ActionForceRelic(),
  new PureBodyRelic(),
  new NoViolenceRelic(),
  new SlipperyTouchRelic(),
  new DevoutBelieverRelic(),
  new ArcaneAdaptationRelic(),
]
