export { HardShellState } from './HardShellState'
export { CorrosionState } from './CorrosionState'
export { AccelerationState } from './AccelerationState'
export { StickyState } from './StickyState'
export { StrengthState } from './StrengthState'
export { CowardTrait } from './CowardTrait'
export { BleedState } from './BleedState'
export { BarrierState } from './BarrierState'
export { GuardianPetalState } from './GuardianPetalState'
export { HeavyweightState } from './HeavyweightState'
export { LightweightState } from './LightweightState'
export { FlightState } from './FlightState'
export { PoisonState } from './PoisonState'
export { LargeState } from './LargeState'
export { FuryAwakeningState } from './FuryAwakeningState'
export { IntoxicationState } from './IntoxicationState'
export { WeakState } from './WeakState'
export { JointDamageState } from './JointDamageState'
export { ChargeState } from './ChargeState'
export { EvilThoughtState } from './EvilThoughtState'
export { TeamBondState } from './TeamBondState'
export { StunCountState } from './StunCountState'
export { FiveLegsState } from './FiveLegsState'
export { StackedStressState } from './StackedStressState'

import type { State } from '../State'
import type { StateSnapshot } from '@/types/battle'
import { HardShellState } from './HardShellState'
import { CorrosionState } from './CorrosionState'
import { AccelerationState } from './AccelerationState'
import { StickyState } from './StickyState'
import { StrengthState } from './StrengthState'
import { CowardTrait } from './CowardTrait'
import { BleedState } from './BleedState'
import { BarrierState } from './BarrierState'
import { GuardianPetalState } from './GuardianPetalState'
import { HeavyweightState } from './HeavyweightState'
import { LightweightState } from './LightweightState'
import { FlightState } from './FlightState'
import { PoisonState } from './PoisonState'
import { LargeState } from './LargeState'
import { FuryAwakeningState } from './FuryAwakeningState'
import { IntoxicationState } from './IntoxicationState'
import { WeakState } from './WeakState'
import { JointDamageState } from './JointDamageState'
import { ChargeState } from './ChargeState'
import { EvilThoughtState } from './EvilThoughtState'
import { TeamBondState } from './TeamBondState'
import { StunCountState } from './StunCountState'
import { FiveLegsState } from './FiveLegsState'
import { StackedStressState } from './StackedStressState'

// Snapshot復元用のStateファクトリを集約し、Battle以外でも使えるようにする。
export const STATE_FACTORY: Record<string, (magnitude?: number) => State> = {
  'state-hard-shell': (m) => new HardShellState(m),
  'state-corrosion': (m) => new CorrosionState(m),
  'state-acceleration': (m) => new AccelerationState(m),
  'state-sticky': (m) => new StickyState(m),
  'state-strength': (m) => new StrengthState(m),
  'trait-coward': () => new CowardTrait(),
  'state-bleed': (m) => new BleedState(m),
  'state-barrier': (m) => new BarrierState(m),
  'state-guardian-petal': (m) => new GuardianPetalState(m),
  'state-heavyweight': () => new HeavyweightState(),
  'state-lightweight': (m) => new LightweightState(m),
  'state-flight': () => new FlightState(),
  'state-poison': (m) => new PoisonState(m),
  'state-large': () => new LargeState(),
  'state-fury-awakening': () => new FuryAwakeningState(),
  'state-intoxication': (m) => new IntoxicationState(m),
  'state-weak': () => new WeakState(),
  'state-joint-damage': (m) => new JointDamageState(m),
  'state-charge': (m) => new ChargeState(m),
  'state-evil-thought': (m) => new EvilThoughtState(m),
  'state-stacked-stress': () => new StackedStressState(),
  'trait-team-bond': () => new TeamBondState(),
  'state-stun-count': (m) => new StunCountState(m ?? 0),
  'trait-five-legs': () => new FiveLegsState(),
}

export function instantiateStateFromSnapshot(snapshot: StateSnapshot): State | undefined {
  const factory = STATE_FACTORY[snapshot.id]
  if (!factory) {
    return undefined
  }
  return factory(snapshot.magnitude ?? 0)
}
