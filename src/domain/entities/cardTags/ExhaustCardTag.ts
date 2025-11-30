import { CardDestinationTag } from '../CardTag'

export class ExhaustCardTag extends CardDestinationTag {
  constructor() {
    super({
      id: 'tag-exhaust',
      name: '消滅',
      description: '使用後、捨て札に送られずに消滅する（戦闘終了後に復活する）。',
    })
  }
}
