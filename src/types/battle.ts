export type EnemySkill = {
  name: string
  detail: string
}

export type EnemyStatus = 'active' | 'defeated' | 'escaped'

export type StateCategory = 'bad' | 'buff' | 'trait'

export type BaseStateSnapshot = {
  id: string
  name: string
  description?: string
  magnitude?: number
  category: StateCategory
  isImportant?: boolean
}

export type BadStateSnapshot = BaseStateSnapshot & { category: 'bad' }
export type BuffStateSnapshot = BaseStateSnapshot & { category: 'buff' }
export type TraitStateSnapshot = BaseStateSnapshot & { category: 'trait' }
export type StateSnapshot = BadStateSnapshot | BuffStateSnapshot | TraitStateSnapshot


export type EnemyActionHint = {
  title: string
  type: 'attack' | 'skill' | 'skip'
  /** 対応するカードID（Action起点）。計算済みダメージで CardInfo を生成するために使用。 */
  cardId?: import('@/domain/library/Library').CardId
  description?: string
  targetName?: string
  pattern?: {
    amount: number
    count?: number
    type?: 'single' | 'multi'
  }
  calculatedPattern?: {
    amount: number
    count?: number
    type?: 'single' | 'multi'
  }
  status?: {
    name: string
    magnitude?: number
    description?: string
  }
  selfState?: {
    name: string
    magnitude?: number
    description?: string
  }
  acted?: boolean
  icon?: string
  cardInfo?: CardInfo
}

export type EnemyInfo = {
  id: number
  name: string
  image: string
  status: EnemyStatus
  hp: {
    current: number
    max: number
  }
  nextActions?: EnemyActionHint[]
  skills: EnemySkill[]
  states?: StateSnapshot[]
}

export type CardType = 'attack' | 'skill' | 'status' | 'skip'

export type AttackStyle = 'single' | 'multi'

export type CardTagInfo = {
  id: string
  label: string
  description?: string
}

export type DescriptionSegment = {
  text: string
  highlighted?: boolean
  tooltip?: string
}

// 共通フィールド: 全カードが持つ
export type BaseCardInfo = {
  id: string // カード識別子（表示用にユニークであればよい）
  title: string // カード名
  cost: number // マナコスト（表示用）
  subtitle?: string // サブタイトル（例: 祈り／状態異常など）
  primaryTags: CardTagInfo[] // タイプなど主要タグ
  categoryTags: CardTagInfo[] // カテゴリタグ（魔/神聖など）
  affordable?: boolean // 手札でプレイ可能かどうかのフラグ
  disabled?: boolean // 選択不可・無効化のフラグ（UIでグレーアウト）
  descriptionSegments?: DescriptionSegment[] // 説明文をセグメント化した配列（攻撃以外は任意）
}

// 攻撃カード（単発）
export type AttackSingleCardInfo = BaseCardInfo & {
  type: 'attack'
  attackStyle: 'single'
  damageAmount: number
  damageAmountReduced?: boolean // 打点が低下したかどうか（攻撃用表示フラグ）
  damageAmountBoosted?: boolean // 打点が強化済みかどうか（攻撃用表示フラグ）
  effectTags: CardTagInfo[]
  descriptionSegments: DescriptionSegment[] // 説明文をセグメント化した配列
}

// 攻撃カード（連続）
export type AttackMultiCardInfo = BaseCardInfo & {
  type: 'attack'
  attackStyle: 'multi'
  damageAmount: number
  damageCount: number
  damageAmountReduced?: boolean // 打点が低下したかどうか（攻撃用表示フラグ）
  damageCountReduced?: boolean // 攻撃回数が低下したかどうか（攻撃用表示フラグ）
  damageAmountBoosted?: boolean // 打点が強化済みかどうか（攻撃用表示フラグ）
  damageCountBoosted?: boolean // 攻撃回数が増加しているかどうか（攻撃用表示フラグ）
  effectTags: CardTagInfo[]
  descriptionSegments: DescriptionSegment[] // 説明文をセグメント化した配列
}

// スキルカード
export type SkillCardInfo = BaseCardInfo & {
  type: 'skill'
  description: string
  effectTags?: CardTagInfo[]
}

// 状態異常カード
export type StatusCardInfo = BaseCardInfo & {
  type: 'status'
  description: string
  effectTags?: CardTagInfo[]
}

// スキップカード（実質表示なし、最小限）
export type SkipCardInfo = BaseCardInfo & {
  type: 'skip'
}

export type CardInfo =
  | AttackSingleCardInfo
  | AttackMultiCardInfo
  | SkillCardInfo
  | StatusCardInfo
  | SkipCardInfo
