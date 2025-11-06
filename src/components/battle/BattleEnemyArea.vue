<!--
BattleEnemyArea の責務:
- 戦闘スナップショットと Battle インスタンスをもとに、敵エリアの表示とユーザー操作を担う。
- 敵カードのホバーやクリックイベントを検知し、親コンポーネントへ通知する。
- 敵の状態・スキル情報を整形して EnemyCard へ渡す。

責務ではないこと:
- カード使用やターゲット選択の進行管理は担当しない（親コンポーネントが Promise を介して制御する）。
- 戦闘ログやアニメーションの制御、カード手札の操作には関与しない。

主な通信相手とインターフェース:
- BattleView（親）: props で snapshot / battle / 選択状態を受け取り、hover-start・hover-end・enemy-click・cancel-selection を emit する。
- EnemyCard: 各敵カードを描画する。`enemy: EnemyInfo`、`selectable: boolean` 等の既存インターフェースを利用。
  `EnemyInfo` は `@/types/battle` の型で、スナップショットから生成した情報を格納する。類似する型として `BattleSnapshot['enemies'][number]` があるが、
  EnemyInfo はビュー描画向けに nextActions や states の整形済み情報を持つ点が異なる。
-->
<script setup lang="ts">
import { computed } from 'vue'
import EnemyCard from '@/components/EnemyCard.vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Battle } from '@/domain/battle/Battle'
import type { State } from '@/domain/entities/State'
import type { EnemyInfo, EnemyTrait, EnemyActionHint } from '@/types/battle'
import type { Enemy } from '@/domain/entities/Enemy'
import { Damages } from '@/domain/entities/Damages'
import { Attack, Action as BattleAction } from '@/domain/entities/Action'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'

const props = defineProps<{
  snapshot: BattleSnapshot | undefined
  battle: Battle | undefined
  isInitializing: boolean
  errorMessage: string | null
  isSelectingEnemy: boolean
  hoveredEnemyId: number | null
}>()

const emit = defineEmits<{
  (event: 'hover-start', enemyId: number): void
  (event: 'hover-end', enemyId: number): void
  (event: 'enemy-click', enemy: EnemyInfo): void
  (event: 'cancel-selection'): void
}>()

const aliveEnemies = computed(() => {
  const current = props.snapshot
  if (!current) {
    return []
  }
  return current.enemies.filter((enemy) => enemy.currentHp > 0)
})

const enemies = computed<EnemyInfo[]>(() => {
  const current = props.snapshot
  const battle = props.battle
  if (!current || !battle) {
    return []
  }

  return aliveEnemies.value.map((enemySnapshot) => {
    const enemy = battle.enemyTeam.findEnemy(enemySnapshot.id) as Enemy | undefined
    return {
      id: enemySnapshot.id,
      name: enemySnapshot.name,
      image: enemy?.image ?? '',
      hp: {
        current: enemySnapshot.currentHp,
        max: enemySnapshot.maxHp,
      },
      nextActions: summarizeEnemyActions(battle, enemySnapshot.id),
      skills: enemy?.actions.map((action) => ({
        name: action.name,
        detail: action.describe(),
      })) ?? [],
      states: mapStatesToEntries(enemySnapshot.states) ?? [],
    }
  })
})

const hasEnemies = computed(() => enemies.value.length > 0)

function handleContextMenu(enemy: EnemyInfo, event: MouseEvent): void {
  if (!props.isSelectingEnemy) {
    return
  }
  event.preventDefault()
  emit('cancel-selection')
}

function mapStatesToEntries(states?: State[]): EnemyTrait[] | undefined {
  if (!states || states.length === 0) {
    return undefined
  }

  return states.map((state) => ({
    name: state.name,
    detail: state.description(),
    magnitude: state.magnitude,
  }))
}

function summarizeEnemyActions(battle: Battle, enemyId: number): EnemyActionHint[] {
  const enemy = battle.enemyTeam.findEnemy(enemyId) as Enemy | undefined
  if (!enemy) {
    return []
  }

  if (enemy.hasActedThisTurn) {
    return [
      {
        title: '行動済み',
        type: 'skill',
        icon: '',
        acted: true,
        description: `${enemy.name}はこのターン既に行動済み。`,
      },
    ]
  }

  const queued = enemy.queuedActions
  if (!queued || queued.length === 0) {
    return []
  }

  const [nextAction] = queued
  return nextAction ? [summarizeEnemyAction(battle, enemy, nextAction)] : []
}

function summarizeEnemyAction(battle: Battle, enemy: Enemy, action: BattleAction): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: '',
      description: action.describe(),
    }
  }

  if (action instanceof Attack) {
    return buildAttackActionHint(battle, enemy, action)
  }

  return buildSkillActionHint(action)
}

function buildAttackActionHint(battle: Battle, enemy: Enemy, action: Attack): EnemyActionHint {
  const damages = action.baseDamages
  const states = action.inflictStatePreviews
  const primaryState = states[0]

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    attackerStates: enemy.getStates(),
    defenderStates: battle.player.getStates(),
  })

  return {
    title: action.name,
    type: 'attack',
    icon: '',
    pattern: {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    },
    calculatedPattern: {
      amount: calculatedDamages.amount,
      count: calculatedDamages.count,
    },
    status: primaryState
      ? {
          name: primaryState.name,
          magnitude: primaryState.magnitude ?? 1,
          description: primaryState.description(),
        }
      : undefined,
    description: action.describe(),
  }
}

function buildSkillActionHint(action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]

  return {
    title: action.name,
    type: action.type,
    icon: '',
    description: action.describe(),
    selfState: gainState
      ? {
          name: gainState.name,
          magnitude: gainState.magnitude ?? 1,
          description: gainState.description(),
        }
      : undefined,
  }
}
</script>

<template>
  <section class="enemy-zone">
    <div v-if="errorMessage" class="zone-message zone-message--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="isInitializing" class="zone-message">読み込み中...</div>
    <div v-else-if="!hasEnemies" class="zone-message">表示できる敵がありません</div>
    <TransitionGroup v-else name="enemy-card" tag="div" class="enemy-grid">
      <EnemyCard
        v-for="enemy in enemies"
        :key="enemy.id"
        :enemy="enemy"
        :selectable="isSelectingEnemy"
        :hovered="isSelectingEnemy && hoveredEnemyId === enemy.id"
        :selected="isSelectingEnemy && hoveredEnemyId === enemy.id"
        @mouseenter="() => emit('hover-start', enemy.id)"
        @mouseleave="() => emit('hover-end', enemy.id)"
        @click="() => emit('enemy-click', enemy)"
        @contextmenu.prevent="handleContextMenu(enemy, $event)"
      />
    </TransitionGroup>
  </section>
</template>

<style scoped>
.enemy-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 240px;
  padding: 12px;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.zone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border-radius: 12px;
  background: rgba(24, 22, 26, 0.78);
  color: #f5f0f7;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.zone-message--error {
  background: rgba(210, 48, 87, 0.18);
  border: 1px solid rgba(210, 48, 87, 0.4);
  color: #ff9fb3;
}
</style>
