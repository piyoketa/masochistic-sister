import { EnemyTeam, type EnemyTeamProps } from '../EnemyTeam'

export interface DefaultEnemyTeamOptions {
  members: EnemyTeamProps['members']
  turnOrder?: EnemyTeamProps['turnOrder']
  id?: string
}

export class DefaultEnemyTeam extends EnemyTeam {
  constructor({ members, turnOrder, id }: DefaultEnemyTeamOptions) {
    super({
      id: id ?? 'enemy-team-1',
      members,
      turnOrder,
    })
  }
}
