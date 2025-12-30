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
      path: '/battle/testcase3',
      name: 'battle-testcase3',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'testcase3' },
    },
    {
      path: '/battle/tutorial',
      name: 'battle-tutorial',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'tutorial' },
    },
    {
      path: '/battle/:teamId',
      name: 'battle-team',
      component: () => import('@/views/BattleView.vue'),
      props: (route) => ({
        teamId: route.params.teamId as string,
        bonusLevels: route.query.bonusLevels ? Number(route.query.bonusLevels) : undefined,
      }),
    },
    {
      path: '/demo/damage-effects',
      name: 'damage-effects-demo',
      component: () => import('@/views/DamageEffectsDemoView.vue'),
    },
    {
      path: '/demo/trait-highlight',
      name: 'trait-highlight-demo',
      component: () => import('@/views/TraitHighlightDemoView.vue'),
    },
    {
      path: '/demo/enemy-card',
      name: 'enemy-card-demo',
      component: () => import('@/views/EnemyCardDemoView.vue'),
    },
    {
      path: '/demo/cut-in',
      name: 'cut-in-demo',
      component: () => import('@/views/CutInDemoView.vue'),
    },
    {
      path: '/demo/enemy-turn',
      name: 'enemy-turn-demo',
      component: () => import('@/views/EnemyTurnDemoView.vue'),
    },
    {
      path: '/demo/player-turn',
      name: 'player-turn-demo',
      component: () => import('@/views/PlayerTurnDemoView.vue'),
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
      props: { fieldId: 'first-field' },
    },
    {
      path: '/field/second',
      name: 'field-view-second',
      component: () => import('@/views/FieldView.vue'),
      props: { fieldId: 'second-field' },
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
      path: '/demo/relic-icons',
      name: 'relic-icon-demo',
      component: () => import('@/views/RelicIconDemoView.vue'),
    },
    {
      path: '/demo/overlays',
      name: 'overlay-demo',
      component: () => import('@/views/OverlayDemoView.vue'),
    },
    {
      path: '/field/card-reward',
      name: 'card-reward',
      component: () => import('@/views/CardRewardView.vue'),
    },
    {
      path: '/field/start-story',
      name: 'start-story',
      component: () => import('@/views/StartStoryView.vue'),
      props: (route) => ({ fieldId: (route.query.fieldId as string | undefined) ?? 'first-field' }),
    },
    {
      path: '/field/relic-reward',
      name: 'relic-reward',
      component: () => import('@/views/RelicRewardView.vue'),
    },
    {
      path: '/field/random-card-reward',
      name: 'random-card-reward',
      component: () => import('@/views/RandomCardRewardView.vue'),
    },
    {
      path: '/field/random-relic-reward',
      name: 'random-relic-reward',
      component: () => import('@/views/RandomRelicRewardView.vue'),
    },
    {
      path: '/field/fixed-relic-reward',
      name: 'fixed-relic-reward',
      component: () => import('@/views/FixedRelicRewardView.vue'),
    },
    {
      path: '/field/devil-statue-reward',
      name: 'devil-statue-reward',
      component: () => import('@/views/DevilStatueRewardView.vue'),
    },
    {
      path: '/reward',
      name: 'reward-view',
      component: () => import('@/views/RewardView.vue'),
      props: (route) => ({ fieldId: route.query.fieldId as string | undefined }),
    },
  ],
})

export default router
