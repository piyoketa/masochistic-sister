import { describe, it, expect } from 'vitest'
import { ViewManager } from '../ViewManager'
import { createBattleSampleScenario } from '../../../tests/fixtures/battleSampleScenario'

describe('ViewManager', () => {
  it('アニメーション完了でスナップショットと入力ロックを更新する', async () => {
    const scenario = createBattleSampleScenario()
    const manager = new ViewManager({
      createBattle: scenario.createBattle,
      actionLog: scenario.replayer.getActionLog(),
      initialActionLogIndex: scenario.steps.playerTurn1Start,
    })

    const events: string[] = []
    manager.subscribe((event) => {
      events.push(event.type)
    })

    await manager.initialize()

    const result = scenario.replayer.run(scenario.steps.playMasochisticAuraOnSnail)

    const scriptId = manager.enqueueAnimation({
      entryIndex: scenario.steps.playMasochisticAuraOnSnail,
      commands: [
        {
          type: 'update-snapshot',
          snapshot: result.snapshot,
          resolvedEntry: result.lastEntry,
        },
      ],
      resolvedEntry: result.lastEntry,
    })

    expect(manager.state.input.locked).toBe(true)
    expect(manager.state.playback.current?.script.id).toBe(scriptId)

    manager.applyAnimationCommand({
      type: 'update-snapshot',
      snapshot: result.snapshot,
      resolvedEntry: result.lastEntry,
    })

    manager.completeCurrentAnimation(scriptId)

    expect(manager.state.snapshot?.player.currentMana).toBe(result.snapshot.player.currentMana)
    expect(manager.state.executedIndex).toBe(scenario.steps.playMasochisticAuraOnSnail)
    expect(manager.state.input.locked).toBe(false)
    expect(events).toContain('animation-start')
    expect(events).toContain('animation-complete')
  })

  it('queuePlayerAction で即座に ActionLog が更新される', async () => {
    const scenario = createBattleSampleScenario()
    const manager = new ViewManager({
      createBattle: scenario.createBattle,
      actionLog: scenario.replayer.getActionLog(),
      initialActionLogIndex: scenario.steps.playerTurn1Start,
    })

    await manager.initialize()

    const initialLength = manager.state.actionLogLength
    manager.queuePlayerAction({ type: 'end-player-turn' })

    expect(manager.state.input.queued).toHaveLength(0)
    expect(manager.state.actionLogLength).toBeGreaterThan(initialLength)
    expect(manager.state.executedIndex).toBe(manager.state.actionLogLength - 1)
  })
})
