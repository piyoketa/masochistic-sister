import { defineStore } from 'pinia'
import { SampleField } from '@/fields/domains/SampleField'
import { FirstField } from '@/fields/domains/FirstField'
import { DevilStatueField } from '@/fields/domains/DevilStatueField'
import type { Field } from '@/fields/domains/Field'
import type { FieldNode } from '@/fields/domains/FieldNode'
import { usePlayerStore } from './playerStore'

export const useFieldStore = defineStore('field', {
  state: () => ({
    field: new SampleField(usePlayerStore().relics) as Field,
    currentLevelIndex: 0,
    currentNodeIndex: 0,
    clearedNodes: new Set<string>(['start-1']),
  }),
  getters: {
    currentNode(state): FieldNode | undefined {
      return state.field.getNode(state.currentLevelIndex, state.currentNodeIndex)
    },
    nextLevelIndex(state): number {
      return state.currentLevelIndex + 1
    },
    nextLevelNodes(state): FieldNode[] {
      const level = state.field.getLevel(state.currentLevelIndex + 1)
      return level?.nodes ?? []
    },
  },
  actions: {
    reset(): void {
      const playerStore = usePlayerStore()
      playerStore.ensureInitialized()
      this.field = new SampleField(playerStore.relics)
      this.currentLevelIndex = 0
      this.currentNodeIndex = 0
      this.clearedNodes = new Set<string>(['start-1'])
    },
    initializeField(fieldId?: string): void {
      const playerStore = usePlayerStore()
      playerStore.ensureInitialized()
      if (fieldId === 'first-field') {
        this.field = new FirstField(playerStore.relics)
      } else if (fieldId === 'devil-statue') {
        this.field = new DevilStatueField()
      } else {
        this.field = new SampleField(playerStore.relics)
      }
      this.currentLevelIndex = 0
      this.currentNodeIndex = 0
      this.clearedNodes = new Set<string>(['start-1'])
    },
    isNodeCleared(nodeId: string): boolean {
      return this.clearedNodes.has(nodeId)
    },
    reachableNextNodes(): Array<{ node: FieldNode; index: number }> {
      const current = this.currentNode
      const nextLevel = this.field.getLevel(this.nextLevelIndex)
      if (!current || !nextLevel) {
        return []
      }
      return current.nextNodeIndices
        .map((idx) => ({ node: nextLevel.nodes[idx], index: idx }))
        .filter((entry): entry is { node: FieldNode; index: number } => Boolean(entry.node))
    },
    selectNextNode(nextIndex: number): void {
      this.currentLevelIndex = this.nextLevelIndex
      this.currentNodeIndex = nextIndex
    },
    markCurrentCleared(): void {
      const node = this.currentNode
      if (!node) {
        return
      }
      this.clearedNodes.add(node.id)
    },
  },
})
