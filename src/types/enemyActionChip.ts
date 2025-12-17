import type { CardInfo } from './battle'

export type EnemyActionChipSegment = {
  text: string
  highlighted?: boolean
  change?: 'up' | 'down'
  showOverlay?: boolean
  iconPath?: string
  tooltip?: string
}

export type EnemyActionChipViewModel = {
  key: string
  segments: EnemyActionChipSegment[]
  label: string
  disabled: boolean
  cardInfo?: CardInfo
}
