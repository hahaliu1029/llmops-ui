import { createRouter, createWebHistory } from 'vue-router'
import { isLogin } from '@/utils/auth'
import DefaultLayout from '@/views/layouts/DefaultLayout.vue'
import BlankLayout from '@/views/layouts/BlankLayout.vue'
// import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          redirect: { name: 'Home' },
        },
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/pages/HomeView.vue'),
        },
        {
          path: 'space/apps',
          name: 'SpaceAppsList',
          component: () => import('@/views/space/apps/ListView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: BlankLayout,
      children: [
        {
          path: 'auth/login',
          name: 'Login',
          component: () => import('@/views/auth/LoginView.vue'),
        },
        {
          path: 'space/apps/:app_id',
          name: 'SpaceAppsDetail',
          component: () => import('@/views/space/apps/DetailView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.name !== 'Login' && !isLogin()) {
    next({ name: 'Login' })
    return
  }

  console.log('to', to)
  console.log('from', from)

  next()
})

export default router
