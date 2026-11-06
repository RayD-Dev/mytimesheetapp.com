import './assets/main.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

// Routes: each feature exports its own; the router task assembles them here.
const router = createRouter({ history: createWebHistory(), routes: [] })

createApp(App).use(createPinia()).use(router).use(ui).mount('#app')
