import { describe, it, expect } from 'vitest'
import { Action, type ActionContext, type BaseActionProps, Skill } from '@/domain/entities/Action'
import { Operation, type CardOperation } from '@/domain/entities/operations'
import { Player } from '@/domain/entities/Player'
import { Enemy } from '@/domain/entities/Enemy'
import { State } from '@/domain/entities/State'
import { SelfTargetCardTag, SkillTypeCardTag } from '@/domain/entities/cardTags'
import { SelfTargetCardTag, SkillTypeCardTag } from '@/domain/entities/cardTags'

class MetadataOperation extends Operation<number> {
  static readonly TYPE = 'metadata-operation'

  constructor() {
    super(MetadataOperation.TYPE)
  }

  protected resolve(payload: unknown): number {
    if (typeof payload !== 'number') {
      throw new Error('payload must be number')
    }
    return payload
  }

  override toMetadata(): Record<string, unknown> {
    return { collected: this.resultValue }
  }
}

function createPlayer(): Player {
  return new Player({
    id: 'player-1',
    name: 'テストプレイヤー',
    maxHp: 30,
    currentHp: 30,
    maxMana: 3,
    currentMana: 3,
  })
}

function createBattleStub(player: Player) {
  return {
    player,
    enemyTeam: { handleActionResolved: () => {} },
    notifyActionResolved: () => {},
  } as unknown as Parameters<Action['prepareContext']>[0]['battle']
}

class OperationAction extends Action {
  constructor(overrides?: Partial<BaseActionProps>) {
    super({
      name: '操作付き行動',
      cardDefinition: {
        title: '操作付き行動',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
      ...(overrides ?? {}),
    })
  }

  get type(): 'skill' {
    return 'skill'
  }

  protected override buildOperations(): Operation[] {
    return [new MetadataOperation()]
  }

  protected override description(): string {
    return 'メタデータを収集する行動'
  }
}

class GainStateAction extends Action {
  constructor() {
    super({
      name: '状態付与',
      cardDefinition: {
        title: '状態付与',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
      },
      gainStates: [
        () =>
          new State({
            id: 'state-test',
            name: 'テスト状態',
          }),
      ],
    })
  }

  get type(): 'skill' {
    return 'skill'
  }

  protected override description(): string {
    return '敵に状態を付与する'
  }
}

class DummySkill extends Skill {
  constructor() {
    super({
      name: 'ダミースキル',
      cardDefinition: {
        title: 'ダミースキル',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
    })
  }
}

describe('Action 基底クラス', () => {
  it('カード定義に操作種別を反映する', () => {
    const action = new OperationAction()
    const definition = action.createCardDefinition()
    expect(definition.operations).toEqual(['metadata-operation'])
  })

  it('必要操作が未入力の場合は例外を投げる', () => {
    const action = new OperationAction()
    const player = createPlayer()
    const battle = createBattleStub(player)

    expect(() =>
      action.prepareContext({
        battle,
        source: player,
        operations: [],
      }),
    ).toThrowError('Operation "metadata-operation" is required but missing')
  })

  it('コンテキスト準備時にメタデータを統合する', () => {
    const action = new OperationAction()
    const player = createPlayer()
    const battle = createBattleStub(player)

    const context = action.prepareContext({
      battle,
      source: player,
      operations: [{ type: MetadataOperation.TYPE, payload: 42 } satisfies CardOperation],
    })

    expect(context.metadata).toEqual({ collected: 42 })
    expect(context.operations).toHaveLength(1)
  })

  it('実行時に付与ステートを敵へ適用する', () => {
    const action = new GainStateAction()
    const player = createPlayer()
    const battle = createBattleStub(player)

    const enemy = new Enemy({
      name: 'テストエネミー',
      maxHp: 10,
      currentHp: 10,
      actions: [],
      image: '/dummy.png',
    })

    const context = action.prepareContext({
      battle,
      source: enemy,
      operations: [],
    })

    action.execute(context)

    expect(enemy.states).toHaveLength(1)
    expect(enemy.states[0]?.name).toBe('テスト状態')
  })

  it('Skill クラスは種別が skill に固定される', () => {
    const skill = new DummySkill()
    expect(skill.type).toBe('skill')
  })
})
