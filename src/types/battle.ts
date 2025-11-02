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
  pattern?: {
    amount: number
    count?: number
    type?: 'single' | 'multi'
  }
  status?: {
    name: string
    magnitude?: number
  }
  selfState?: {
    name: string
    magnitude?: number
  }
  acted?: boolean
  icon?: string
}

export type EnemyInfo = {
  numericId: number
  name: string
  image: string
  hp: {
    current: number
    max: number
  }
  nextActions?: EnemyActionHint[]
  skills: EnemySkill[]
  traits?: EnemyTrait[]
  states?: EnemyTrait[]
}

export type CardType = 'attack' | 'skill' | 'status'

export type AttackStyle = 'single' | 'multi'

export type CardInfo = {
  id: string
  title: string
  type: CardType
  cost: number
  illustration: string
  description: string
  notes?: string[]
  attackStyle?: AttackStyle
}
