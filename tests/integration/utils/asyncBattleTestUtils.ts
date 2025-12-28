import { describe, it, expect, vi } from 'vitest'

import type { Battle } from '@/domain/battle/Battle'
import { ViewManager } from '@/view/ViewManager'
import { createTestCaseBattle3 } from '@/domain/battle/battlePresets'
import type { AnimationCommand } from '@/view/ViewManager'
import type { RelicId } from '@/domain/entities/relics/relicTypes'

type ClickActiveRelicAction = {
  type: 'click-active-relic'
  relicId: RelicId
}

type AsyncBattleAssertion =
  | {
      type: 'expect-player-state'
      stateId: string
      magnitude?: number
    }
  | {
      type: 'expect-relic-usable'
      relicId: RelicId
      usable: boolean
      usesRemaining?: number | null
    }

type AsyncBattleConfig = {
  path: '/battle/testcase3'
  waitMsBeforeAction?: number
  actions: ClickActiveRelicAction[]
  assertions: AsyncBattleAssertion[]
}

function createBattleFromPath(path: AsyncBattleConfig['path']): Battle {
  if (path === '/battle/testcase3') {
    return createTestCaseBattle3()
  }
  throw new Error(`未対応のパスです: ${path}`)
}

function applyAnimationScript(viewManager: ViewManager, commands: AnimationCommand[]): void {
  commands.forEach((command) => {
    if (command.type === 'wait') {
      return
    }
    viewManager.applyAnimationCommand(command)
  })
}

export function describeAsyncBattle(name: string, config: AsyncBattleConfig): void {
  describe(name, () => {
    it('3秒後にレリックを起動できる', async () => {
      vi.useFakeTimers()
      const viewManager = new ViewManager({
        createBattle: () => createBattleFromPath(config.path),
      })

      viewManager.subscribe((event) => {
        if (event.type === 'animation-start') {
          applyAnimationScript(viewManager, event.script.commands)
          viewManager.completeCurrentAnimation(event.script.id)
        }
      })

      await viewManager.initialize()

      // 初期アニメーションのキューを処理しきった状態にしてからタイマーを進める
      while (viewManager.state.playback.queue.length > 0 || viewManager.state.playback.current) {
        const current = viewManager.state.playback.current
        if (!current) {
          break
        }
        applyAnimationScript(viewManager, current.script.commands)
        viewManager.completeCurrentAnimation(current.script.id)
      }

      if (config.waitMsBeforeAction && config.waitMsBeforeAction > 0) {
        vi.advanceTimersByTime(config.waitMsBeforeAction)
      }

      config.actions.forEach((action) => {
        if (action.type === 'click-active-relic') {
          viewManager.queuePlayerAction({
            type: 'play-relic',
            relicId: action.relicId,
            operations: [],
          })
        }
      })

      // 入力キューが処理され、アニメーションが積まれる可能性があるので一度流す
      while (viewManager.state.playback.queue.length > 0 || viewManager.state.playback.current) {
        const current = viewManager.state.playback.current
        if (!current) {
          break
        }
        applyAnimationScript(viewManager, current.script.commands)
        viewManager.completeCurrentAnimation(current.script.id)
      }

      const snapshot = viewManager.state.snapshot
      expect(snapshot).toBeTruthy()
      if (!snapshot) {
        vi.useRealTimers()
        return
      }

      config.assertions.forEach((assertion) => {
        switch (assertion.type) {
          case 'expect-player-state': {
            const state = snapshot.player.states?.find((s) => s.id === assertion.stateId)
            expect(state).toBeTruthy()
            if (assertion.magnitude !== undefined) {
              expect(state?.magnitude).toBe(assertion.magnitude)
            }
            break
          }
          case 'expect-relic-usable': {
            const relic = snapshot.player.relics.find((entry) => entry.id === assertion.relicId)
            expect(relic).toBeTruthy()
            expect(relic?.usable).toBe(assertion.usable)
            if (assertion.usesRemaining !== undefined) {
              expect(relic?.usesRemaining).toBe(assertion.usesRemaining)
            }
            break
          }
          default:
            break
        }
      })

      vi.useRealTimers()
    })
  })
}
