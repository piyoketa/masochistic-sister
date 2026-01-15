/**
 * AchievementProgress
 * ===================
 * バトル中に蓄積される実績進行度を表す型。
 * - Battle 開始時に Progress ストアから初期値を注入し、Battle 終了時に最新値を戻す。
 * - 記憶ポイント系の称号はこの進行度から達成判定を行う。
 */
export type AchievementProgress = {
  /** 状態異常カードの記憶（rememberState）で生成したカードの累計獲得数 */
  statusCardMemories: number
  /** 腐食スタックの累計獲得量 */
  corrosionAccumulated: number
  /** 粘液スタックの累計獲得量 */
  stickyAccumulated: number
  /** ダメージイベントで被弾した回数（攻撃/状態異常のダメージが対象） */
  damageTakenCount: number
  /** 1回の攻撃で受けた最大ダメージ量（合計ダメージ） */
  maxDamageTaken: number
  /** 連続攻撃カテゴリで受けた最大ヒット数（元の baseCount を保持） */
  maxMultiHitReceived: number
  /** 口づけを受けた回数 */
  kissReceivedCount: number
  /** 口づけを使用した回数 */
  kissUsedCount: number
  /** 被虐のオーラを発動した回数 */
  masochisticAuraUsedCount: number
  /** 敗北回数 */
  defeatCount: number
  /** オークヒーロー撃破フラグ（敵チーム単位で判定） */
  orcHeroDefeated: boolean
}

export function createDefaultAchievementProgress(): AchievementProgress {
  return {
    statusCardMemories: 0,
    corrosionAccumulated: 0,
    stickyAccumulated: 0,
    damageTakenCount: 0,
    maxDamageTaken: 0,
    maxMultiHitReceived: 0,
    kissReceivedCount: 0,
    kissUsedCount: 0,
    masochisticAuraUsedCount: 0,
    defeatCount: 0,
    orcHeroDefeated: false,
  }
}
