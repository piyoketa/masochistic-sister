import { describe, it, expect } from 'vitest'
import { toRaw } from 'vue'

import { ViewManager } from '@/view/ViewManager'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'
import type { BattleSnapshotPatch } from '@/domain/battle/ActionLog'
import type { Card } from '@/domain/entities/Card'
import { State } from '@/domain/entities/State'

function createBaseSnapshot(): BattleSnapshot {
  const sampleCard = { id: 99, title: 'サンプル' } as unknown as Card
  return {
    id: 'battle-1',
    player: {
      id: 'player',
      name: 'プレイヤー',
      currentHp: 20,
      maxHp: 30,
      currentMana: 3,
      maxMana: 5,
      relics: [],
    },
    enemies: [
      {
        id: 1,
        name: 'スライム',
        image: 'slime.png',
        currentHp: 10,
        maxHp: 10,
        states: [],
        hasActedThisTurn: false,
        status: 'active',
        skills: [{ name: '跳ねる', detail: '軽い攻撃' }],
        nextActions: [],
      },
    ],
    deck: [sampleCard],
    hand: [sampleCard],
    discardPile: [],
    exilePile: [],
    events: [],
    turn: {
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    },
    log: [
      {
        id: 'log-1',
        message: '開始',
        turn: 1,
        timestamp: new Date('2025-01-01T00:00:00Z'),
      },
    ],
    status: 'in-progress',
  }
}

describe('ViewManager.applySnapshotPatch', () => {
  it('欠落したプロパティは元のスナップショットを保持する', () => {
    const viewManager = new ViewManager({ createBattle: () => ({} as Battle) })
    const baseSnapshot = createBaseSnapshot()

    // まず完全なスナップショットを適用して、後続の apply-patch が差分前の状態を参照できるようにする
    viewManager.applyAnimationCommand({ type: 'update-snapshot', snapshot: baseSnapshot })

    const patch: BattleSnapshotPatch = {
      changes: {
        // currentHp のみ更新し、名前や最大値などの欠けているプロパティは既存スナップショットから引き継がれることを確認する
        player: { currentHp: 12 },
        // turnCount を渡さず phase だけ更新する差分
        turn: { phase: 'player-main' },
      },
    }

    viewManager.applyAnimationCommand({ type: 'apply-patch', patch })

    const patched = viewManager.state.snapshot
    expect(patched).toBeDefined()
    expect(patched).not.toBe(baseSnapshot)
    expect(patched?.player.currentHp).toBe(12)
    expect(patched?.player.maxHp).toBe(baseSnapshot.player.maxHp)
    expect(patched?.player.name).toBe(baseSnapshot.player.name)
    expect(patched?.player.currentMana).toBe(baseSnapshot.player.currentMana)
    expect(patched?.turn.turnCount).toBe(baseSnapshot.turn.turnCount)
    expect(patched?.turn.phase).toBe('player-main')
    expect(patched?.deck).toEqual(baseSnapshot.deck)
    expect(patched?.hand).toEqual(baseSnapshot.hand)
    // 元スナップショットの値が変わっていないことも併せて保証する
    expect(baseSnapshot.player.currentHp).toBe(20)
    expect(viewManager.state.previousSnapshot).toEqual(baseSnapshot)
  })

  it('Stateインスタンスを保持しつつ、未変更の参照を共有する', () => {
    class DummyState extends State {
      constructor(id: string) {
        super({ id, name: `状態-${id}` })
        ;(this as unknown as { category: string }).category = 'buff'
      }
      override getCategory(): import('@/types/battle').StateCategory {
        return 'buff'
      }
      // クラスメソッドが維持されることを確認するため、説明文を返す
      override description(): string {
        return `説明:${this.name}`
      }
    }

    const viewManager = new ViewManager({ createBattle: () => ({} as Battle) })
    const stateInstance = new DummyState('dummy-1')
    const baseSnapshot = {
      ...createBaseSnapshot(),
      enemies: [
        {
          id: 1,
          name: 'スライム',
          image: 'slime.png',
          currentHp: 10,
          maxHp: 10,
          states: [stateInstance as unknown as import('@/types/battle').StateSnapshot],
          hasActedThisTurn: false,
          status: 'active' as const,
          skills: [{ name: '跳ねる', detail: '軽い攻撃' }],
          nextActions: [],
        },
      ],
    }

    viewManager.applyAnimationCommand({ type: 'update-snapshot', snapshot: baseSnapshot })

    const patch: BattleSnapshotPatch = {
      changes: {
        player: { currentHp: 15 },
        turn: { phase: 'player-main' },
      },
    }

    viewManager.applyAnimationCommand({ type: 'apply-patch', patch })
    const patched = viewManager.state.snapshot

    expect(patched).toBeDefined()
    expect(patched?.player.currentHp).toBe(15)
    // enemies をパッチしていないので参照が共有されることを確認（reactive Proxy を素の値に戻して比較）
    const rawEnemies = patched ? toRaw(patched.enemies) : undefined
    expect(rawEnemies).toBe(baseSnapshot.enemies)
    const rawState = rawEnemies?.[0]?.states[0]
    expect(rawState).toBe(stateInstance)
    expect(rawState).toBeInstanceOf(State)
    expect((rawState as unknown as DummyState)?.description()).toBe('説明:状態-dummy-1')
    // 元スナップショット側は汚染されていない
    expect(baseSnapshot.player.currentHp).toBe(20)
    expect(viewManager.state.previousSnapshot).toEqual(baseSnapshot)
  })
})
