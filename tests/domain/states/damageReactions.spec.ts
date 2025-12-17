import { describe, it, expect } from 'vitest'

import { createTestBattle, buildDamageEvent, addStateToEnemy, addStateToPlayer } from '../../helpers/battleTestUtils'
import { OrcEnemy } from '@/domain/entities/enemies/OrcEnemy'
import { DamageLinkState } from '@/domain/entities/states/DamageLinkState'
import { MiasmaState } from '@/domain/entities/states/MiasmaState'

describe('瘴気とダメージ連動の反射ダメージ', () => {
  it('瘴気: プレイヤーが被弾すると攻撃者へヒット数分の瘴気ダメージを与える', () => {
    const attacker = new OrcEnemy()
    const battle = createTestBattle({ enemies: [attacker] })

    addStateToPlayer(battle, new MiasmaState(5))

    const attackEvent = buildDamageEvent({
      attacker: { type: 'enemy', enemyId: attacker.id! },
      defender: { type: 'player' },
      damagePerHit: 10,
      hits: 2,
      effectType: 'physical',
    })

    battle.damagePlayer(attackEvent)

    expect(battle.player.currentHp).toBe(130)
    expect(attacker.currentHp).toBe(30)
  })

  it('ダメージ連動: 状態を持つ敵が、プレイヤー被弾時に同じダメージを受ける', () => {
    const linkTarget = new OrcEnemy()
    const attacker = new OrcEnemy()
    const battle = createTestBattle({ enemies: [linkTarget, attacker] })

    addStateToEnemy(battle, linkTarget.id!, new DamageLinkState())

    const attackEvent = buildDamageEvent({
      attacker: { type: 'enemy', enemyId: attacker.id! },
      defender: { type: 'player' },
      damagePerHit: 10,
      hits: 2,
      effectType: 'physical',
    })

    battle.damagePlayer(attackEvent)

    expect(battle.player.currentHp).toBe(130)
    expect(linkTarget.currentHp).toBe(20)
  })
})
