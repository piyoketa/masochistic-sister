export type EnemySelectionTheme = 'default' | 'arcane' | 'sacred'

export interface SelectionThemeColorSet {
  border: string
  strong: string
  shadow: string
  shadowStrong: string
  background: string
}

export const SELECTION_THEME_COLORS: Record<EnemySelectionTheme, SelectionThemeColorSet> = {
  default: {
    border: 'rgba(255, 116, 116, 0.45)',
    strong: '#ff4d6d',
    shadow: 'rgba(255, 116, 116, 0.45)',
    shadowStrong: 'rgba(255, 116, 116, 0.5)',
    background: 'rgba(255, 116, 116, 0.16)',
  },
  arcane: {
    border: '#d447b9',
    strong: '#d447b9',
    shadow: 'rgba(212, 71, 185, 0.45)',
    shadowStrong: 'rgba(212, 71, 185, 0.5)',
    background: 'rgba(212, 71, 185, 0.2)',
  },
  sacred: {
    border: '#4fa6ff',
    strong: '#4fa6ff',
    shadow: 'rgba(79, 166, 255, 0.45)',
    shadowStrong: 'rgba(79, 166, 255, 0.5)',
    background: 'rgba(79, 166, 255, 0.2)',
  },
}
