export interface TargetEnemyOperation extends Record<string, unknown> {
  targetEnemyId: string
}

export function assertTargetEnemyOperation(operation: unknown): asserts operation is TargetEnemyOperation {
  if (
    typeof operation !== 'object' ||
    operation === null ||
    typeof (operation as TargetEnemyOperation).targetEnemyId !== 'string'
  ) {
    throw new Error('Operation requires targetEnemyId')
  }
}
