import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './assets/themes.css'
import App from './App.vue'
import { RouterLink, RouterView } from './shims/vue-router'
import { setupMockAdminApi } from './shims/mockAdminApi'

setupMockAdminApi()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.component('router-link', RouterLink)
app.component('RouterLink', RouterLink)
app.component('router-view', RouterView)
app.component('RouterView', RouterView)
app.mount('#app')
