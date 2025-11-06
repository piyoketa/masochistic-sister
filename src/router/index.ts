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
      path: '/battle/stage1',
      name: 'battle-stage1',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'stage1' },
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
      path: '/battle/stage2',
      name: 'battle-stage2',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'stage2' },
    },
    {
      path: '/battle/stage3',
      name: 'battle-stage3',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'stage3' },
    },
    {
      path: '/battle/stage4',
      name: 'battle-stage4',
      component: () => import('@/views/BattleView.vue'),
      props: { preset: 'stage4' },
    },
  ],
})

export default router
