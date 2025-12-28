/*
責務: お化け目玉の敵個体を定義し、ビーム攻撃と惑わす眼光（邪念付与）を行動として保持する。
非責務: 行動順やターゲット管理はチーム側のキューに任せる。記憶生成などのバトル管理は扱わない。
主なインターフェース: Enemy基底にHPや行動リストを渡し、EnemyTeamから参照される。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { ConfusingGazeAction } from '../actions/ConfusingGazeAction'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type EyeballGhostEnemyOptions = EnemyLevelOption

export class EyeballGhostEnemy extends Enemy {
  constructor(options?: EyeballGhostEnemyOptions) {
    const baseProps = {
      name: 'お化け目玉',
      maxHp: 30,
      currentHp: 30,
      actions: [new BeamShotAction(15), new ConfusingGazeAction()],
      image: '/assets/enemies/kamaitachi.jpg',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
