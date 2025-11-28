import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'title',
      component: () => import('@/views/TitleView.vue'),
    },
    {
      path: '/battle',
      name: 'battle',
      alias: ['/encounter'],
      component: () => import('@/views/BattleView.vue'),
    },
    {
      path: '/battle/testcase1',
      name: 'battle-testcase1',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'testcase1' },
    },
    {
      path: '/battle/testcase2',
      name: 'battle-testcase2',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'testcase2' },
    },
    {
      path: '/battle/:teamId',
      name: 'battle-team',
      component: () => import('@/views/BattleView.vue'),
      props: (route) => ({ teamId: route.params.teamId as string }),
    },
    {
      path: '/demo/damage-effects',
      name: 'damage-effects-demo',
      component: () => import('@/views/DamageEffectsDemoView.vue'),
    },
    {
      path: '/demo/cut-in',
      name: 'cut-in-demo',
      component: () => import('@/views/CutInDemoView.vue'),
    },
    {
      path: '/deck',
      name: 'deck-view',
      component: () => import('@/views/DeckView.vue'),
    },
    {
      path: '/field',
      name: 'field-view',
      component: () => import('@/views/FieldView.vue'),
    },
    {
      path: '/lab/action-cards',
      name: 'action-card-lab',
      component: () => import('@/views/ActionCardLabView.vue'),
    },
    {
      path: '/lab/card-animations',
      name: 'card-animation-lab',
      component: () => import('@/views/CardAnimationLabView.vue'),
    },
    {
      path: '/lab/card-eliminate',
      name: 'card-eliminate-lab',
      component: () => import('@/views/CardEliminateLabView.vue'),
    },
    {
      path: '/lab/card-draw',
      name: 'card-draw-lab',
      component: () => import('@/views/CardDrawLabView.vue'),
    },
    {
      path: '/lab/card-glow',
      name: 'card-glow-lab',
      component: () => import('@/views/CardGlowLabView.vue'),
    },
    {
      path: '/demo/victory-reward',
      name: 'victory-reward-demo',
      component: () => import('@/views/VictoryRewardDemoView.vue'),
    },
    {
      path: '/field/card-reward',
      name: 'card-reward',
      component: () => import('@/views/CardRewardView.vue'),
    },
  ],
})

export default router
