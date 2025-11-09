export type EnemySkill = {
  name: string
  detail: string
}

export type EnemyTrait = {
  name: string
  detail: string
  magnitude?: number
}

export type EnemyActionHint = {
  title: string
  type: 'attack' | 'skill' | 'skip'
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
}

export type EnemyInfo = {
  id: number
  name: string
  image: string
  hp: {
    current: number
    max: number
  }
  nextActions?: EnemyActionHint[]
  skills: EnemySkill[]
  states?: EnemyTrait[]
}

export type CardType = 'attack' | 'skill' | 'status'

export type AttackStyle = 'single' | 'multi'

export type CardTagInfo = {
  id: string
  label: string
  description?: string
}

export type CardInfo = {
  id: string
  title: string
  type: CardType
  cost: number
  illustration: string
  description: string
  descriptionSegments?: Array<{ text: string; highlighted?: boolean }>
  attackStyle?: AttackStyle
  primaryTags?: CardTagInfo[]
  effectTags?: CardTagInfo[]
  categoryTags?: CardTagInfo[]
  damageAmount?: number
  damageCount?: number
}
