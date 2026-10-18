import { reactive, defineComponent, h, computed, markRaw } from 'vue'
import { usePortfolioStore } from '../stores/portfolioStore'

import AdminDashboardView from '../modules/admin/views/AdminDashboardView.vue'
import AdminOrdersView from '../modules/admin/views/AdminOrdersView.vue'
import AdminInventoryView from '../modules/admin/views/AdminInventoryView.vue'
import AdminProductUploadView from '../modules/admin/views/AdminProductUploadView.vue'
import AdminAuctionsView from '../modules/admin/views/AdminAuctionsView.vue'
import AdminCustomersView from '../modules/admin/views/AdminCustomersView.vue'
import AdminMarketingView from '../modules/admin/views/AdminMarketingView.vue'
import AdminProSubscriptionView from '../modules/admin/views/AdminProSubscriptionView.vue'
import AdminCmsView from '../modules/admin/views/AdminCmsView.vue'
import AdminAnalyticsView from '../modules/admin/views/AdminAnalyticsView.vue'
import AdminSettingsView from '../modules/admin/views/AdminSettingsView.vue'
import AdminMobileToolsView from '../modules/admin/views/MobileTools/Index.vue'
import AdminLoginView from '../modules/admin/AdminLoginView.vue'

const routeMap: Record<string, { name: string; component: any }> = {
  '/admin/dashboard': { name: 'admin-dashboard', component: markRaw(AdminDashboardView) },
  '/admin/orders': { name: 'admin-orders', component: markRaw(AdminOrdersView) },
  '/admin/inventory': { name: 'admin-inventory', component: markRaw(AdminInventoryView) },
  '/admin/products': { name: 'admin-products', component: markRaw(AdminProductUploadView) },
  '/admin/product-upload': { name: 'admin-product-upload', component: markRaw(AdminProductUploadView) },
  '/admin/auctions': { name: 'admin-auctions', component: markRaw(AdminAuctionsView) },
  '/admin/customers': { name: 'admin-customers', component: markRaw(AdminCustomersView) },
  '/admin/marketing': { name: 'admin-marketing', component: markRaw(AdminMarketingView) },
  '/admin/pro-subscription': { name: 'admin-pro-subscription', component: markRaw(AdminProSubscriptionView) },
  '/admin/pro-subscriptions': { name: 'admin-pro-subscriptions', component: markRaw(AdminProSubscriptionView) },
  '/admin/cms': { name: 'admin-cms', component: markRaw(AdminCmsView) },
  '/admin/analytics': { name: 'admin-analytics', component: markRaw(AdminAnalyticsView) },
  '/admin/mobile-tools': { name: 'admin-mobile-tools', component: markRaw(AdminMobileToolsView) },
  '/admin/settings': { name: 'admin-settings', component: markRaw(AdminSettingsView) },
  '/admin/login': { name: 'admin-login', component: markRaw(AdminLoginView) },
}

export const currentRouteState = reactive({
  path: '/admin/dashboard',
  fullPath: '/admin/dashboard',
  name: 'admin-dashboard',
  query: {} as Record<string, any>,
  params: {} as Record<string, any>,
})

function resolveNavigation(target: string | { path: string; query?: Record<string, any> }) {
  let path = typeof target === 'string' ? target : target.path
  let query: Record<string, any> = typeof target === 'object' && target.query ? { ...target.query } : {}

  if (path.includes('?')) {
    const [basePath, qs] = path.split('?')
    path = basePath
    const searchParams = new URLSearchParams(qs)
    searchParams.forEach((val, key) => {
      query[key] = val
    })
  }

  if (path === '/' || path === '/catalog' || path === '/auctions') {
    try {
      const portfolioStore = usePortfolioStore()
      portfolioStore.setDemoMode('storefront')
    } catch {
      // ignore if outside pinia context
    }
    return Promise.resolve()
  }

  if (path === '/admin' || path === '/admin/') {
    path = '/admin/dashboard'
  }

  const matched = routeMap[path] || routeMap['/admin/dashboard']
  currentRouteState.path = path in routeMap ? path : '/admin/dashboard'
  currentRouteState.fullPath = currentRouteState.path
  currentRouteState.name = matched.name
  currentRouteState.query = query
  return Promise.resolve()
}

const routerInstance = {
  currentRoute: computed(() => currentRouteState),
  push(target: string | { path: string; query?: Record<string, any> }) {
    return resolveNavigation(target)
  },
  replace(target: string | { path: string; query?: Record<string, any> }) {
    return resolveNavigation(target)
  },
  back() {
    return resolveNavigation('/admin/dashboard')
  },
  go(_delta: number) {},
}

export function useRouter() {
  return routerInstance
}

export function useRoute() {
  return currentRouteState
}

export const RouterLink = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object],
      required: true,
    },
    custom: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots, attrs }) {
    const navigate = (e?: MouseEvent) => {
      if (e) e.preventDefault()
      resolveNavigation(props.to as any)
    }

    return () => {
      const href = typeof props.to === 'string' ? props.to : (props.to as any)?.path || '#'
      return h(
        'a',
        {
          ...attrs,
          href,
          onClick: navigate,
        },
        slots.default ? slots.default() : []
      )
    }
  },
})

export const RouterView = defineComponent({
  name: 'RouterView',
  setup() {
    const activeComp = computed(() => {
      const entry = routeMap[currentRouteState.path] || routeMap['/admin/dashboard']
      return entry.component
    })
    return () => h(activeComp.value)
  },
})

