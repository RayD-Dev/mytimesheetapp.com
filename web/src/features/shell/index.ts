import type { RouteRecordRaw } from 'vue-router'
import NotFoundPage from './NotFoundPage.vue'

export { default as TopBar } from './TopBar.vue'
export { default as NotFoundPage } from './NotFoundPage.vue'

// The catch-all must be assembled last. A manager route opened by an employee shows this same page,
// rendered in place by the guard (task 6) with the URL kept, so a page they may not use reveals nothing about itself.
export const shellRoutes: RouteRecordRaw[] = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
]
