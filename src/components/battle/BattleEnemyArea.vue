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
import { Attack, Action as BattleAction, AllyBuffSkill } from '@/domain/entities/Action'
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

interface EnemySlot {
  id: number
  isActive: boolean
  enemy?: EnemyInfo
}

const enemySlots = computed<EnemySlot[]>(() => {
  const current = props.snapshot
  const battle = props.battle
  if (!current || !battle) {
    return []
  }

  return current.enemies.map((enemySnapshot) => {
    const enemy = battle.enemyTeam.findEnemy(enemySnapshot.id) as Enemy | undefined
    const isActive = enemySnapshot.status === 'active' && enemySnapshot.currentHp > 0
    const enemyInfo = isActive
      ? {
          id: enemySnapshot.id,
          name: enemySnapshot.name,
          image: enemy?.image ?? '',
          hp: {
            current: enemySnapshot.currentHp,
            max: enemySnapshot.maxHp,
          },
          nextActions: summarizeEnemyActions(battle, enemySnapshot.id),
          skills:
            enemy?.actions.map((action) => ({
              name: action.name,
              detail: action.describe(),
            })) ?? [],
          states: mapStatesToEntries(enemySnapshot.states) ?? [],
        }
      : undefined
    return {
      id: enemySnapshot.id,
      isActive,
      enemy: enemyInfo,
    }
  })
})

const hasVisibleEnemies = computed(() => enemySlots.value.some((slot) => slot.isActive))

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

  return buildSkillActionHint(battle, action)
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

function buildSkillActionHint(battle: Battle, action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]
  let targetName: string | undefined
  if (action instanceof AllyBuffSkill) {
    const plannedTargetId = action.getPlannedTarget?.()
    if (plannedTargetId !== undefined) {
      const target = battle.enemyTeam.findEnemy(plannedTargetId)
      targetName = target?.name
    }
  }

  return {
    title: action.name,
    type: action.type,
    icon: '',
    description: action.describe(),
    targetName,
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
    <div v-else-if="!hasVisibleEnemies" class="zone-message">表示できる敵がありません</div>
    <TransitionGroup v-else name="enemy-card" tag="div" class="enemy-grid">
      <div
        v-for="slot in enemySlots"
        :key="slot.id"
        class="enemy-slot"
        :class="{ 'enemy-slot--spacer': !slot.isActive }"
      >
        <EnemyCard
          v-if="slot.enemy"
          :enemy="slot.enemy"
          :selectable="isSelectingEnemy"
          :hovered="isSelectingEnemy && hoveredEnemyId === slot.enemy.id"
          :selected="isSelectingEnemy && hoveredEnemyId === slot.enemy.id"
          @mouseenter="() => emit('hover-start', slot.enemy!.id)"
          @mouseleave="() => emit('hover-end', slot.enemy!.id)"
          @click="() => emit('enemy-click', slot.enemy!)"
          @contextmenu.prevent="handleContextMenu(slot.enemy!, $event)"
        />
      </div>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.enemy-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 320px;
  padding: 20px;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.enemy-slot {
  min-height: 200px;
}

.enemy-slot--spacer {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.1);
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
