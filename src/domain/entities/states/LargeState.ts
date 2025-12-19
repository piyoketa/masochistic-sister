import { State, TraitState } from '../State'

export class LargeState extends TraitState {
  constructor() {
    super({
      id: 'state-large',
      name: '天の鎖不可',
      stackable: false,
    })
  }

  override description(): string {
    return '天の鎖などの足止め効果を受けない'
  }

  override stackWith(state: State): void {
    if (state.id !== this.id) {
      super.stackWith(state)
    }
    // 同じ天の鎖不可は複数付与されても効果が変わらない
  }
}
