import { computed } from 'vue'
import type {
  MemoryPointSummary,
  RewardAchievementCardView,
  TitleAchievementRowView,
} from '@/components/AchievementWindow.vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useAchievementProgressStore } from '@/stores/achievementProgressStore'
import {
  STATUS_COLLECT_ACHIEVEMENT_ID,
  STATUS_COLLECT_TARGET,
  ORC_HERO_ACHIEVEMENT_ID,
  ORC_HERO_TARGET,
  FIRST_DAMAGE_ACHIEVEMENT_ID,
  FIRST_DAMAGE_TARGET,
  DEFEAT_ACHIEVEMENT_ID,
  DEFEAT_TARGET,
  CORROSION_FIRST_ACHIEVEMENT_ID,
  CORROSION_FIRST_TARGET,
  CORROSION_30_ACHIEVEMENT_ID,
  CORROSION_30_TARGET,
  CORROSION_100_ACHIEVEMENT_ID,
  CORROSION_100_TARGET,
  SLIME_FIRST_ACHIEVEMENT_ID,
  SLIME_FIRST_TARGET,
  SLIME_3_ACHIEVEMENT_ID,
  SLIME_3_TARGET,
  SLIME_10_ACHIEVEMENT_ID,
  SLIME_10_TARGET,
  MULTI_HIT_4_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_4_TARGET,
  MULTI_HIT_5_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_5_TARGET,
  MULTI_HIT_6_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_6_TARGET,
  DAMAGE_30_ACHIEVEMENT_ID,
  DAMAGE_30_TARGET,
  DAMAGE_40_ACHIEVEMENT_ID,
  DAMAGE_40_TARGET,
  DAMAGE_50_ACHIEVEMENT_ID,
  DAMAGE_50_TARGET,
  KISS_RECEIVED_ACHIEVEMENT_ID,
  KISS_RECEIVED_TARGET,
  KISS_USED_ACHIEVEMENT_ID,
  KISS_USED_TARGET,
  AURA_FIRST_ACHIEVEMENT_ID,
  AURA_FIRST_TARGET,
  AURA_5_ACHIEVEMENT_ID,
  AURA_5_TARGET,
} from '@/domain/achievements/constants'

type ProgressEntry = {
  current: number
  target: number
}

function resolveProgressLabel(entry: ProgressEntry): { label: string; ratio: number } {
  const current = Math.max(0, entry.current)
  const target = Math.max(1, entry.target)
  return {
    label: `${current} / ${target}`,
    ratio: Math.min(1, current / target),
  }
}

export function useAchievementWindow() {
  const achievementStore = useAchievementStore()
  const achievementProgressStore = useAchievementProgressStore()
  achievementStore.ensureInitialized()
  achievementProgressStore.ensureInitialized()

  const memoryPointSummary = computed<MemoryPointSummary>(() => ({
    used: achievementStore.usedMemoryPointsTotal,
    total: achievementStore.earnedMemoryPointsTotal,
    available: achievementStore.availableMemoryPoints,
  }))

  // 実績IDと進捗の紐付けをここで一元管理し、UI側は統一した形式で扱う。
  const achievementProgressMap = computed(() => {
    const map = new Map<string, ProgressEntry>()
    map.set(STATUS_COLLECT_ACHIEVEMENT_ID, {
      current: achievementProgressStore.statusCardMemories,
      target: STATUS_COLLECT_TARGET,
    })
    map.set(ORC_HERO_ACHIEVEMENT_ID, {
      current: achievementProgressStore.orcHeroDefeated ? 1 : 0,
      target: ORC_HERO_TARGET,
    })
    map.set(FIRST_DAMAGE_ACHIEVEMENT_ID, {
      current: achievementProgressStore.damageTakenCount,
      target: FIRST_DAMAGE_TARGET,
    })
    map.set(DEFEAT_ACHIEVEMENT_ID, {
      current: achievementProgressStore.defeatCount,
      target: DEFEAT_TARGET,
    })
    map.set(CORROSION_FIRST_ACHIEVEMENT_ID, {
      current: achievementProgressStore.corrosionAccumulated,
      target: CORROSION_FIRST_TARGET,
    })
    map.set(CORROSION_30_ACHIEVEMENT_ID, {
      current: achievementProgressStore.corrosionAccumulated,
      target: CORROSION_30_TARGET,
    })
    map.set(CORROSION_100_ACHIEVEMENT_ID, {
      current: achievementProgressStore.corrosionAccumulated,
      target: CORROSION_100_TARGET,
    })
    map.set(SLIME_FIRST_ACHIEVEMENT_ID, {
      current: achievementProgressStore.stickyAccumulated,
      target: SLIME_FIRST_TARGET,
    })
    map.set(SLIME_3_ACHIEVEMENT_ID, {
      current: achievementProgressStore.stickyAccumulated,
      target: SLIME_3_TARGET,
    })
    map.set(SLIME_10_ACHIEVEMENT_ID, {
      current: achievementProgressStore.stickyAccumulated,
      target: SLIME_10_TARGET,
    })
    map.set(MULTI_HIT_4_RECEIVED_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxMultiHitReceived,
      target: MULTI_HIT_4_TARGET,
    })
    map.set(MULTI_HIT_5_RECEIVED_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxMultiHitReceived,
      target: MULTI_HIT_5_TARGET,
    })
    map.set(MULTI_HIT_6_RECEIVED_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxMultiHitReceived,
      target: MULTI_HIT_6_TARGET,
    })
    map.set(DAMAGE_30_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxDamageTaken,
      target: DAMAGE_30_TARGET,
    })
    map.set(DAMAGE_40_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxDamageTaken,
      target: DAMAGE_40_TARGET,
    })
    map.set(DAMAGE_50_ACHIEVEMENT_ID, {
      current: achievementProgressStore.maxDamageTaken,
      target: DAMAGE_50_TARGET,
    })
    map.set(KISS_RECEIVED_ACHIEVEMENT_ID, {
      current: achievementProgressStore.kissReceivedCount,
      target: KISS_RECEIVED_TARGET,
    })
    map.set(KISS_USED_ACHIEVEMENT_ID, {
      current: achievementProgressStore.kissUsedCount,
      target: KISS_USED_TARGET,
    })
    map.set(AURA_FIRST_ACHIEVEMENT_ID, {
      current: achievementProgressStore.masochisticAuraUsedCount,
      target: AURA_FIRST_TARGET,
    })
    map.set(AURA_5_ACHIEVEMENT_ID, {
      current: achievementProgressStore.masochisticAuraUsedCount,
      target: AURA_5_TARGET,
    })
    return map
  })

  const rewardEntries = computed<RewardAchievementCardView[]>(() => {
    const available = memoryPointSummary.value.available
    return achievementStore.rewardEntriesForView.map((entry) => {
      const progress = achievementProgressMap.value.get(entry.id)
      const showProgress = entry.status === 'not-achieved'
      const progressLabel = progress ? resolveProgressLabel(progress) : null
      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        rewardLabel: entry.reward.label,
        status: entry.status,
        progressLabel: showProgress ? progressLabel?.label ?? entry.progressLabel : undefined,
        progressRatio: showProgress ? progressLabel?.ratio ?? entry.progressRatio : undefined,
        costLabel: `必要 ${entry.memoryPointCost} pt`,
        // 記憶ポイント残量で獲得可能かを判断し、ボタンの表示制御に使う。
        canClaim: entry.status === 'achieved' && available >= entry.memoryPointCost,
      }
    })
  })

  const titleEntries = computed<TitleAchievementRowView[]>(() =>
    achievementStore.titleEntriesForView.map((entry) => {
      const progress = achievementProgressMap.value.get(entry.id)
      const showProgress = entry.status === 'not-achieved'
      const progressLabel = progress ? resolveProgressLabel(progress) : null
      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        status: entry.status,
        progressLabel: showProgress ? progressLabel?.label ?? entry.progressLabel : undefined,
        progressRatio: showProgress ? progressLabel?.ratio ?? entry.progressRatio : undefined,
        pointLabel: `+${entry.memoryPointGain}pt`,
      }
    }),
  )

  function claimAchievement(id: string) {
    return achievementStore.claimAchievement(id)
  }

  return {
    memoryPointSummary,
    rewardEntries,
    titleEntries,
    claimAchievement,
  }
}
