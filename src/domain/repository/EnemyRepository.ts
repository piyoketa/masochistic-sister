import type { Enemy } from '../entities/Enemy'

export class EnemyRepository {
  private readonly enemies = new Map<number, Enemy>()
  private counter = 0

  register(enemy: Enemy): Enemy {
    const id = enemy.numericId ?? this.generateId()
    if (this.enemies.has(id) && this.enemies.get(id) !== enemy) {
      throw new Error(`Enemy with id ${id} already registered`)
    }

    enemy.assignRepositoryId(id)
    this.enemies.set(id, enemy)
    return enemy
  }

  findById(id: number): Enemy | undefined {
    return this.enemies.get(id)
  }

  list(): Enemy[] {
    return Array.from(this.enemies.values())
  }

  remove(id: number): void {
    this.enemies.delete(id)
  }

  clear(): void {
    this.enemies.clear()
    this.counter = 0
  }

  private generateId(): number {
    const id = this.counter
    this.counter += 1
    return id
  }
}
