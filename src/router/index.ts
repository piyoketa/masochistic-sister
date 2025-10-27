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
      path: '/encounter',
      name: 'encounter',
      component: () => import('@/views/EncounterView.vue'),
    },
  ],
})

export default router
