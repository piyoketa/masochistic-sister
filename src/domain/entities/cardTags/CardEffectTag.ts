import { CardTag } from '../CardTag'

/**
 * CardEffectTag
 * -------------
 * アタックに特定の追加効果を付与するタグの基底クラス。
 * UI上では状態異常と同列に表示し、ツールチップで説明を示す。
 */
export class CardEffectTag extends CardTag {
  /**
   * effectTags を表示する際に先頭に付与するアイコン。
   * 絵文字ではなく、パス（例: /assets/icons/drain.png）を指定する想定。
   */
  readonly iconPath?: string

  constructor(options: { id: string; name: string; description?: string; iconPath?: string }) {
    super({
      id: options.id,
      name: options.name,
      description: options.description,
    })
    this.iconPath = options.iconPath
  }
}
