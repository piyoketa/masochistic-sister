/**
 * AchievementProgress
 * ===================
 * バトル中に蓄積される実績進行度を表す型。
 * - ここでは全7種の達成条件に対応する進行度を保持する。
 * - Battle 開始時に Progress ストアから初期値を注入し、Battle 終了時に最新値を戻す。
 */
export type AchievementProgress = {
  /** 状態異常カードの記憶（rememberState）で生成したカードの累計獲得数 */
  statusCardMemories: number
  /** 腐食スタックの累計獲得量 */
  corrosionAccumulated: number
  /** 状態異常カードの累計使用回数 */
  statusCardUsed: number
  /** 記憶カード（tag-memory）攻撃の累計使用回数 */
  memoryCardUsed: number
  /** 5回以上の multi 攻撃カードを獲得した回数 */
  multiAttackAcquired: number
  /** 臆病 trait の敵を撃破/逃走させた回数（重複登録防止のためユニークIDで管理） */
  cowardDefeatedIds: number[]
  /** オークヒーロー撃破フラグ（敵チーム単位で判定） */
  orcHeroDefeated: boolean
}

export function createDefaultAchievementProgress(): AchievementProgress {
  return {
    statusCardMemories: 0,
    corrosionAccumulated: 0,
    statusCardUsed: 0,
    memoryCardUsed: 0,
    multiAttackAcquired: 0,
    cowardDefeatedIds: [],
    orcHeroDefeated: false,
  }
}
