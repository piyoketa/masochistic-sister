export type EnemySkill = {
  name: string
  detail: string
}

export type EnemyTrait = {
  name: string
  detail: string
}

export type EnemyInfo = {
  numericId: number
  name: string
  image: string
  hp: {
    current: number
    max: number
  }
  skills: EnemySkill[]
  traits?: EnemyTrait[]
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
