/**
 * AchievementProgress
 * ===================
 * バトル中に蓄積される実績進行度を表す型。
 * - Battle 開始時に Progress ストアから初期値を注入し、Battle 終了時に最新値を戻す。
 * - 記憶ポイント系の称号はこの進行度から達成判定を行う。
 */
export type AchievementProgress = {
  /** バトル開始回数（初回戦闘の発話判定に使う） */
  battleStartedCount: number
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
  /** 所持したレリック数の最高値（上限解放実績の達成判定に使う） */
  maxRelicOwnedCount: number
  /** 天の鎖を使用した回数（カードIDで判定） */
  heavenChainUsedCount: number
  /** 臆病Traitを持つ敵が逃走した回数 */
  cowardFleeCount: number
  /** 臆病Traitを持つ敵を倒した回数 */
  cowardDefeatCount: number
  /** 触手の撃破回数 */
  tentacleDefeatCount: number
  /** リザルト時点でHPが30以下になった回数 */
  resultHpAtMost30Count: number
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
  /** ビーム砲ボス撃破フラグ（敵チーム単位で判定） */
  beamCannonDefeated: boolean
  /** 到達済みの最大状態進行度（前半パート1〜6の達成判定用） */
  maxStateProgressCount: number
  /** 到達済みの最大表情差分レベル（0/2/3） */
  maxFaceExpressionLevel: number
  /** 腕2のダメージ表現が適用済みかどうか */
  arm2ExpressionApplied: boolean
}

export function createDefaultAchievementProgress(): AchievementProgress {
  return {
    battleStartedCount: 0,
    corrosionAccumulated: 0,
    stickyAccumulated: 0,
    damageTakenCount: 0,
    maxDamageTaken: 0,
    maxMultiHitReceived: 0,
    maxRelicOwnedCount: 0,
    heavenChainUsedCount: 0,
    cowardFleeCount: 0,
    cowardDefeatCount: 0,
    tentacleDefeatCount: 0,
    resultHpAtMost30Count: 0,
    kissReceivedCount: 0,
    kissUsedCount: 0,
    masochisticAuraUsedCount: 0,
    defeatCount: 0,
    orcHeroDefeated: false,
    beamCannonDefeated: false,
    maxStateProgressCount: 1,
    maxFaceExpressionLevel: 0,
    arm2ExpressionApplied: false,
  }
}
