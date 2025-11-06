import { describe, it, expect } from 'vitest'

import {
  createDefaultSnailBattle,
  createStage2Battle,
  createStage3Battle,
  createStage4Battle,
} from '@/domain/battle/battlePresets'

describe('バトルプリセット', () => {
  it('stage1プリセットは初期化時にプレイヤーが健在である', () => {
    const battle = createDefaultSnailBattle()
    const snapshot = battle.getSnapshot()
    expect(snapshot.player.currentHp).toBeGreaterThan(0)
    expect(battle.status).toBe('in-progress')
  })

  it('stage2プリセットでもプレイヤーは健在で戦闘中である', () => {
    const battle = createStage2Battle()
    const snapshot = battle.getSnapshot()
    expect(snapshot.player.currentHp).toBeGreaterThan(0)
    expect(battle.status).toBe('in-progress')
  })

  it('stage3プリセットは生成直後に戦闘継続状態である', () => {
    const battle = createStage3Battle()
    const snapshot = battle.getSnapshot()
    expect(snapshot.player.currentHp).toBeGreaterThan(0)
    expect(battle.status).toBe('in-progress')
    expect(snapshot.enemies.length).toBeGreaterThan(0)
  })

  it('stage4プリセットは生成直後に戦闘継続状態である', () => {
    const battle = createStage4Battle()
    const snapshot = battle.getSnapshot()
    expect(snapshot.player.currentHp).toBeGreaterThan(0)
    expect(battle.status).toBe('in-progress')
    expect(snapshot.enemies.length).toBeGreaterThan(0)
  })
})
