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
      path: '/relic',
      name: 'relic-view',
      component: () => import('@/views/RelicView.vue'),
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
      path: '/demo/audio',
      name: 'audio-demo',
      component: () => import('@/views/AudioDemoView.vue'),
    },
    {
      path: '/demo/hp-gauge',
      name: 'hp-gauge-demo',
      component: () => import('@/views/HpGaugeDemoView.vue'),
    },
    {
      path: '/demo/reward',
      name: 'reward-demo',
      component: () => import('@/views/RewardDemoView.vue'),
    },
    {
      path: '/field/card-reward',
      name: 'card-reward',
      component: () => import('@/views/CardRewardView.vue'),
    },
    {
      path: '/field/relic-reward',
      name: 'relic-reward',
      component: () => import('@/views/RelicRewardView.vue'),
    },
    {
      path: '/reward',
      name: 'reward-view',
      component: () => import('@/views/RewardView.vue'),
    },
  ],
})

export default router
