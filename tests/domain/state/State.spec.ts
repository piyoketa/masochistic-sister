import { describe, it, expect } from 'vitest'
import { State } from '@/domain/entities/State'

class BaseState extends State {
  constructor() {
    super({
      id: 'state-base',
      name: '基底テスト',
    })
  }
}

class DescribedState extends State {
  constructor() {
    super({
      id: 'state-described',
      name: '説明付き',
    })
  }

  override description(): string {
    return '詳細説明'
  }
}

class CardState extends State {
  constructor() {
    super({
      id: 'state-card',
      name: 'カード生成',
      cardDefinition: {
        title: '状態カード',
        type: 'status',
        cost: 0,
      },
    })
  }
}

describe('State 基底クラス', () => {
  it('IDと名称を保持する', () => {
    const state = new BaseState()
    expect(state.id).toBe('state-base')
    expect(state.name).toBe('基底テスト')
  })

  it('magnitudeが未指定の場合はundefinedを返す', () => {
    const state = new BaseState()
    expect(state.magnitude).toBeUndefined()
  })

  it('description()はサブクラスでオーバーライドしなければ空文字を返す', () => {
    const state = new BaseState()
    expect(state.description()).toBe('')
  })

  it('サブクラスがdescription()を上書きできる', () => {
    const state = new DescribedState()
    expect(state.description()).toBe('詳細説明')
  })

  it('カード定義が無い状態はcreateCardDefinitionで例外', () => {
    const state = new BaseState()
    expect(() => state.createCardDefinition()).toThrowError('State does not provide a card definition')
  })

  it('カード定義を持つ状態はcreateCardDefinitionで複製を返す', () => {
    const state = new CardState()
    const definition = state.createCardDefinition()
    expect(definition).toEqual({ title: '状態カード', type: 'status', cost: 0 })
  })
})
