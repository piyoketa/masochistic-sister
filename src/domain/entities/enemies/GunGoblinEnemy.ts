/*
責務: 銃ゴブリン敵個体の基本パラメータと行動セットを提供する。ビーム攻撃とパワーチャージの2行動を持つ。
非責務: 行動順やターゲット選択の決定はチーム側のアクションキューに委譲する。
主なインターフェース: Enemy基底のプロパティを通じてHP/行動リスト/画像を定義し、EnemyTeamから参照される。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type GunGoblinEnemyOptions = EnemyLevelOption

export class GunGoblinEnemy extends Enemy {
  constructor(options?: GunGoblinEnemyOptions) {
    const baseProps = {
      name: '砲台',
      maxHp: 60,
      currentHp: 60,
      actions: [new BeamShotAction(20), new PowerChargeAction(40)],
      image: '/assets/enemies/canon.png',
    }
    const levelConfigs = [
      {
        level: 2,
        apply: (props: EnemyProps) => ({
          ...props,
          maxHp: 80,
          currentHp: 80,
        }),
      },
      {
        level: 3,
        apply: (props: EnemyProps) => ({
          ...props,
          actions: [new BeamShotAction(20), new PowerChargeAction(60)],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
