import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true, title: 'Вход' },
    },
    {
      path: '/teacher',
      component: () => import('@/layouts/TeacherLayout.vue'),
      meta: { roles: ['teacher'] },
      children: [
        { path: '', redirect: { name: 'teacher-clubs' } },
        {
          path: 'clubs',
          name: 'teacher-clubs',
          component: () => import('@/pages/teacher/MyClubsPage.vue'),
          meta: { title: 'Мои кружки' },
        },
        {
          path: 'clubs/:id',
          name: 'teacher-club-detail',
          component: () => import('@/pages/teacher/ClubDetailPage.vue'),
          meta: { title: 'Кружок' },
          props: true,
        },
        {
          path: 'clubs/:id/history',
          name: 'teacher-club-history',
          component: () => import('@/pages/teacher/ClubHistoryPage.vue'),
          meta: { title: 'История посещаемости' },
          props: true,
        },
        {
          path: 'clubs/:id/progress',
          name: 'teacher-club-progress',
          component: () => import('@/pages/teacher/ClubProgressPage.vue'),
          meta: { title: 'Прогресс' },
          props: true,
        },
      ],
    },
    {
      path: '/curator',
      component: () => import('@/layouts/CuratorLayout.vue'),
      meta: { roles: ['curator'] },
      children: [
        { path: '', redirect: { name: 'curator-class' } },
        {
          path: 'class',
          name: 'curator-class',
          component: () => import('@/pages/curator/MyClassPage.vue'),
          meta: { title: 'Мой класс' },
        },
        {
          path: 'students/:id',
          name: 'curator-student-detail',
          component: () => import('@/pages/curator/StudentDetailPage.vue'),
          meta: { title: 'Ученик' },
          props: true,
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { roles: ['admin'] },
      children: [
        { path: '', redirect: { name: 'admin-overview' } },
        {
          path: 'overview',
          name: 'admin-overview',
          component: () => import('@/pages/admin/OverviewPage.vue'),
          meta: { title: 'Обзор' },
        },
        {
          path: 'clubs',
          name: 'admin-clubs',
          component: () => import('@/pages/admin/ClubsAdminPage.vue'),
          meta: { title: 'Кружки' },
        },
        {
          path: 'classes',
          name: 'admin-classes',
          component: () => import('@/pages/admin/ClassesAdminPage.vue'),
          meta: { title: 'Классы' },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/admin/UsersAdminPage.vue'),
          meta: { title: 'Пользователи' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(authGuard)

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — Кружки` : 'Кружки'
})

export default router
