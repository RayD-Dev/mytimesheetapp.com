import type { RouteRecordRaw } from 'vue-router'
import NotFoundPage from './NotFoundPage.vue'

export { default as TopBar } from './TopBar.vue'
export { default as NotFoundPage } from './NotFoundPage.vue'
export { default as NoAccessPage } from './NoAccessPage.vue'

// The catch-all must be assembled last. The no-access page has no route of its own: the guard that finds an
// employee on a manager route renders it in place, keeping the URL.
export const shellRoutes: RouteRecordRaw[] = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]
