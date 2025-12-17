<script setup lang="ts">
import { computed } from 'vue'
import EnemyNextActions from '@/components/battle/EnemyNextActions.vue'
import { formatEnemyActionChipsForView, type EssentialEnemyActionHint } from '@/view/enemyActionHintsForView'
import { buildCardInfoFromBlueprint } from '@/domain/library/Library'
import { Damages } from '@/domain/entities/Damages'
import { Attack } from '@/domain/entities/Action'
import { CardEffectTag } from '@/domain/entities/cardTags/CardEffectTag'

// アイコンパス
const SINGLE_ATTACK_ICON = '/assets/icons/single_attack.png'
const MULTI_ATTACK_ICON = '/assets/icons/multi_attack.png'
const DEFAULT_BUFF_ICON = '/assets/icons/status_up.png'
const DEFAULT_DEBUFF_ICON = '/assets/icons/status_down.png'

// セグメント生成を簡単にするため、Action/Hintをダミーで構築
function createAttackHint(params: {
  title: string
  amount: number
  count?: number
  type?: 'single' | 'multi'
  status?: { name: string; description: string; iconPath?: string }
  cardInfoId: string
  acted?: boolean
}): EssentialEnemyActionHint {
  const damages = new Damages({
    baseAmount: params.amount,
    baseCount: params.count ?? 1,
    type: params.type ?? 'single',
    cardId: params.cardInfoId as any,
  })
  const action = new Attack({
    name: params.title,
    baseDamage: damages,
    effectType: 'slam',
  })
  const hint = {
    title: params.title,
    type: 'attack' as const,
    pattern: {
      amount: params.amount,
      count: params.count ?? 1,
      type: params.type ?? 'single',
    },
    calculatedPattern: {
      amount: params.amount,
      count: params.count ?? 1,
      type: params.type ?? 'single',
    },
    status: params.status
      ? {
          ...params.status,
          stackable: false,
          magnitude: undefined,
        }
      : undefined,
    description: '',
    cardInfo: buildCardInfoFromBlueprint(
      {
        type: params.cardInfoId as any,
        overrideAmount: params.amount,
        overrideCount: params.count ?? 1,
      },
      `enemy-action-demo-${params.cardInfoId}`,
    )!,
  }
  return {
    key: `demo-${params.cardInfoId}`,
    action,
    attackerStates: [],
    defenderStates: [],
    acted: Boolean(params.acted),
    targetName: undefined,
    hint,
  }
}

function createSkillHint(params: {
  title: string
  targetName?: string
  status?: { name: string; description: string; iconPath?: string }
  selfState?: { name: string; description: string; iconPath?: string }
  acted?: boolean
  cardInfoId: string
}): EssentialEnemyActionHint {
  const action = new Attack({
    // Attack を流用しておくが、hint.typeでskill扱いにする
    name: params.title,
    baseDamage: new Damages({ baseAmount: 0, baseCount: 1, type: 'single', cardId: params.cardInfoId as any }),
    effectType: 'slam',
  })
  const hint = {
    title: params.title,
    type: 'skill' as const,
    description: params.status?.description ?? '',
    targetName: params.targetName,
    selfState: params.selfState
      ? {
          ...params.selfState,
          stackable: false,
          magnitude: undefined,
        }
      : undefined,
    status: params.status
      ? {
          ...params.status,
          stackable: false,
          magnitude: undefined,
        }
      : undefined,
    cardInfo: buildCardInfoFromBlueprint(
      {
        type: params.cardInfoId as any,
      },
      `enemy-action-demo-${params.cardInfoId}`,
    )!,
  }
  return {
    key: `demo-${params.cardInfoId}`,
    action,
    attackerStates: [],
    defenderStates: [],
    acted: Boolean(params.acted),
    targetName: params.targetName,
    hint,
  }
}

const demoHints = computed<EssentialEnemyActionHint[]>(() => {
  const mouthEffectTag = new CardEffectTag({ name: '魅了', description: '魅了を付与する' })
  return [
    // 殴打（1回攻撃）
    createAttackHint({ title: '殴打', amount: 20, type: 'single', cardInfoId: 'tackle' }),
    // 乱れ突き（複数攻撃）
    createAttackHint({ title: '乱れ突き', amount: 8, count: 3, type: 'multi', cardInfoId: 'flurry' }),
    // 溶かす（状態異常付与）
    createAttackHint({
      title: '溶かす',
      amount: 12,
      type: 'single',
      cardInfoId: 'acid-spit',
      status: { name: '防御低下', description: '防御を下げる', iconPath: DEFAULT_DEBUFF_ICON },
    }),
    // 口づけ（CardEffectTag）
    createAttackHint({
      title: '口づけ',
      amount: 0,
      type: 'single',
      cardInfoId: 'kiss',
      status: { name: mouthEffectTag.name, description: mouthEffectTag.description ?? '', iconPath: DEFAULT_DEBUFF_ICON },
    }),
    // 酒の息（デバフ）
    createSkillHint({
      title: '酒の息',
      status: { name: '酩酊', description: '行動がふらつく', iconPath: DEFAULT_DEBUFF_ICON },
      cardInfoId: 'drunk-breath',
    }),
    // ビルドアップ（自分バフ）
    createSkillHint({
      title: 'ビルドアップ',
      selfState: { name: '筋力上昇', description: '打点アップ', iconPath: DEFAULT_BUFF_ICON },
      cardInfoId: 'build-up',
    }),
    // 追い風（仲間バフ + 対象名）
    createSkillHint({
      title: '追い風',
      status: { name: '加速', description: '攻撃回数 +1', iconPath: DEFAULT_BUFF_ICON },
      targetName: 'オーク力士',
      cardInfoId: 'tailwind',
    }),
    // 行動スキップ
    {
      key: 'demo-skip',
      action: new Attack({
        name: 'スキップ',
        baseDamage: new Damages({ baseAmount: 0, baseCount: 1, type: 'single', cardId: 'skip' as any }),
        effectType: 'slam',
      }),
      attackerStates: [],
      defenderStates: [],
      acted: false,
      targetName: undefined,
      hint: {
        title: '行動不可',
        type: 'skip',
        icon: '',
        description: '行動できない',
      },
    },
    // Acted例
    createAttackHint({ title: '殴打(行動済)', amount: 20, type: 'single', cardInfoId: 'tackle-acted', acted: true }),
  ]
})

const chipModels = computed(() =>
  formatEnemyActionChipsForView(
    999,
    demoHints.value,
    { includeTitle: true },
  ),
)
</script>

<template>
  <div class="demo-container">
    <h1 class="demo-title">EnemyActionChip デモ</h1>
    <p class="demo-desc">
      EssentialEnemyActionHint から表示用チップへ整形した結果を確認するためのデモです。各パターン（単発/連撃/状態異常/カードタグ/バフ・デバフ/スキップ/行動済）をまとめて表示します。
    </p>
    <EnemyNextActions :enemy-id="999" :actions="demoHints" :highlighted="false" />
    <section class="chips">
      <EnemyActionChip v-for="chip in chipModels" :key="chip.key" :action="chip" />
    </section>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #e8eefc;
}
.demo-title {
  margin: 0;
  font-size: 22px;
}
.demo-desc {
  margin: 0;
  color: #b7c1d6;
  line-height: 1.4;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
