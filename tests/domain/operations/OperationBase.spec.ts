import { describe, it, expect } from 'vitest'
import { Operation, type OperationContext } from '@/domain/entities/operations'
import { Player } from '@/domain/entities/Player'

class DummyOperation extends Operation<string> {
  constructor() {
    super('dummy')
  }

  protected resolve(payload: unknown, _context: OperationContext): string {
    if (payload !== 'ok') {
      throw new Error('payload must be "ok"')
    }
    return String(payload)
  }

  get result(): string | undefined {
    return this.resultValue
  }
}

function createContext(): OperationContext {
  const player = new Player({
    id: 'player',
    name: 'プレイヤー',
    maxHp: 10,
    currentHp: 10,
    maxMana: 3,
    currentMana: 3,
  })

  return {
    player,
    battle: {
      player,
    } as unknown as OperationContext['battle'],
  }
}

describe('Operation 抽象クラス', () => {
  it('操作完了前は pending 状態になる', () => {
    const operation = new DummyOperation()
    expect(operation.status).toBe('pending')
    expect(operation.isCompleted()).toBe(false)
  })

  it('complete 実行後に結果を保持し completed 状態になる', () => {
    const operation = new DummyOperation()
    operation.complete('ok', createContext())

    expect(operation.status).toBe('completed')
    expect(operation.isCompleted()).toBe(true)
    expect(operation.result).toBe('ok')
  })

  it('未知の入力の場合は例外を送出する', () => {
    const operation = new DummyOperation()
    expect(() => operation.complete('ng', createContext())).toThrowError('payload must be "ok"')
  })

  it('既定のメタデータは空オブジェクトを返す', () => {
    const operation = new DummyOperation()
    operation.complete('ok', createContext())
    expect(operation.toMetadata()).toEqual({})
  })
})
