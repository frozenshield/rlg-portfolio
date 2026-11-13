import { reactive, defineComponent, h, computed, markRaw } from 'vue'
import { usePortfolioStore } from '../stores/portfolioStore'

// Admin Views
import AdminDashboardView from '../modules/admin/views/AdminDashboardView.vue'
import AdminOrdersView from '../modules/admin/views/AdminOrdersView.vue'
import AdminInventoryView from '../modules/admin/views/AdminInventoryView.vue'
import AdminProductUploadView from '../modules/admin/views/AdminProductUploadView.vue'
import AdminAuctionsView from '../modules/admin/views/AdminAuctionsView.vue'
import AdminWalletView from '../modules/admin/views/AdminWalletView.vue'
import AdminLiveBreaksView from '../modules/admin/views/AdminLiveBreaksView.vue'
import AdminPreordersView from '../modules/admin/views/AdminPreordersView.vue'
import AdminGachaRafflesView from '../modules/admin/views/AdminGachaRafflesView.vue'
import AdminCustomersView from '../modules/admin/views/AdminCustomersView.vue'
import AdminMarketingView from '../modules/admin/views/AdminMarketingView.vue'
import AdminProSubscriptionView from '../modules/admin/views/AdminProSubscriptionView.vue'
import AdminCmsView from '../modules/admin/views/AdminCmsView.vue'
import AdminAnalyticsView from '../modules/admin/views/AdminAnalyticsView.vue'
import AdminAuditTrailView from '../modules/admin/views/AdminAuditTrailView.vue'
import AdminSettingsView from '../modules/admin/views/AdminSettingsView.vue'
import AdminMobileToolsView from '../Pages/Admin/MobileTools/Index.vue'
import AdminLoginView from '../modules/admin/AdminLoginView.vue'

// Storefront Views
import HomeView from '../modules/home/HomeView.vue'
import ToyCatalogView from '../modules/catalog/ToyCatalogView.vue'
import VipSubscriptionView from '../modules/catalog/VipSubscriptionView.vue'
import WishlistView from '../modules/wishlist/WishlistView.vue'
import CheckoutView from '../modules/checkout/CheckoutView.vue'
import CustomerOrdersView from '../modules/orders/CustomerOrdersView.vue'
import AuctionsListView from '../modules/auctions/views/AuctionsListView.vue'
import AuctionDetailView from '../modules/auctions/views/AuctionDetailView.vue'
import CustomerAuctionsView from '../modules/auctions/views/CustomerAuctionsView.vue'
import WalletDashboardView from '../modules/wallet/WalletDashboardView.vue'
import GachaVaultView from '../modules/gacha/GachaVaultView.vue'
import RaffleArenaView from '../modules/raffles/RaffleArenaView.vue'
import PreordersView from '../modules/preorders/PreordersView.vue'
import LiveBreaksView from '../modules/live-breaks/LiveBreaksView.vue'

export const routeMap: Record<string, { name: string; component: any }> = {
  // Storefront
  '/': { name: 'home', component: markRaw(HomeView) },
  '/catalog': { name: 'catalog', component: markRaw(ToyCatalogView) },
  '/vip': { name: 'vip-subscription', component: markRaw(VipSubscriptionView) },
  '/wishlist': { name: 'wishlist', component: markRaw(WishlistView) },
  '/checkout': { name: 'checkout', component: markRaw(CheckoutView) },
  '/orders': { name: 'orders', component: markRaw(CustomerOrdersView) },
  '/track-order': { name: 'orders', component: markRaw(CustomerOrdersView) },
  '/auctions': { name: 'auctions-list', component: markRaw(AuctionsListView) },
  '/auctions/:id': { name: 'auction-detail', component: markRaw(AuctionDetailView) },
  '/profile/auctions': { name: 'customer-auctions', component: markRaw(CustomerAuctionsView) },
  '/user/auctions': { name: 'customer-auctions', component: markRaw(CustomerAuctionsView) },
  '/wallet': { name: 'wallet-dashboard', component: markRaw(WalletDashboardView) },
  '/user/wallet': { name: 'wallet-dashboard', component: markRaw(WalletDashboardView) },
  '/gacha': { name: 'gacha-vault', component: markRaw(GachaVaultView) },
  '/gacha-oripa': { name: 'gacha-vault', component: markRaw(GachaVaultView) },
  '/raffles': { name: 'raffle-arena', component: markRaw(RaffleArenaView) },
  '/raffles/:id': { name: 'raffle-detail', component: markRaw(RaffleArenaView) },
  '/preorders': { name: 'preorders-drop-calendar', component: markRaw(PreordersView) },
  '/live-breaks': { name: 'live-breaks', component: markRaw(LiveBreaksView) },
  '/breaks': { name: 'live-breaks', component: markRaw(LiveBreaksView) },

  // Admin
  '/admin': { name: 'admin-dashboard', component: markRaw(AdminDashboardView) },
  '/admin/dashboard': { name: 'admin-dashboard', component: markRaw(AdminDashboardView) },
  '/admin/orders': { name: 'admin-orders', component: markRaw(AdminOrdersView) },
  '/admin/inventory': { name: 'admin-inventory', component: markRaw(AdminInventoryView) },
  '/admin/products': { name: 'admin-products', component: markRaw(AdminProductUploadView) },
  '/admin/product-upload': { name: 'admin-product-upload', component: markRaw(AdminProductUploadView) },
  '/admin/auctions': { name: 'admin-auctions', component: markRaw(AdminAuctionsView) },
  '/admin/wallet': { name: 'admin-wallet', component: markRaw(AdminWalletView) },
  '/admin/wallet-gacha': { name: 'admin-wallet', component: markRaw(AdminWalletView) },
  '/admin/live-breaks': { name: 'admin-live-breaks', component: markRaw(AdminLiveBreaksView) },
  '/admin/preorders': { name: 'admin-preorders', component: markRaw(AdminPreordersView) },
  '/admin/gacha-raffles': { name: 'admin-gacha-raffles', component: markRaw(AdminGachaRafflesView) },
  '/admin/customers': { name: 'admin-customers', component: markRaw(AdminCustomersView) },
  '/admin/marketing': { name: 'admin-marketing', component: markRaw(AdminMarketingView) },
  '/admin/pro-subscription': { name: 'admin-pro-subscription', component: markRaw(AdminProSubscriptionView) },
  '/admin/pro-subscriptions': { name: 'admin-pro-subscriptions', component: markRaw(AdminProSubscriptionView) },
  '/admin/cms': { name: 'admin-cms', component: markRaw(AdminCmsView) },
  '/admin/analytics': { name: 'admin-analytics', component: markRaw(AdminAnalyticsView) },
  '/admin/mobile-tools': { name: 'admin-mobile-tools', component: markRaw(AdminMobileToolsView) },
  '/admin/audit-trail': { name: 'admin-audit-trail', component: markRaw(AdminAuditTrailView) },
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

  // Handle switching between admin & storefront surfaces based on destination
  try {
    const portfolioStore = usePortfolioStore()
    if (path.startsWith('/admin')) {
      if (portfolioStore.activeDemoMode !== 'admin') {
        portfolioStore.setDemoMode('admin')
      }
    } else {
      if (portfolioStore.activeDemoMode !== 'storefront') {
        portfolioStore.setDemoMode('storefront')
      }
    }
  } catch {
    // ignore if outside pinia context
  }

  if (path === '/admin' || path === '/admin/') {
    path = '/admin/dashboard'
  }

  // Parameter matching support (e.g. /auctions/:id)
  let matched = routeMap[path]
  if (!matched) {
    if (path.startsWith('/auctions/')) {
      matched = routeMap['/auctions/:id']
      currentRouteState.params = { id: path.replace('/auctions/', '') }
    } else if (path.startsWith('/raffles/')) {
      matched = routeMap['/raffles/:id']
      currentRouteState.params = { id: path.replace('/raffles/', '') }
    }
  }

  if (!matched) {
    matched = path.startsWith('/admin') ? routeMap['/admin/dashboard'] : routeMap['/']
  }

  currentRouteState.path = path
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
    return resolveNavigation(currentRouteState.path.startsWith('/admin') ? '/admin/dashboard' : '/')
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
      let entry = routeMap[currentRouteState.path]
      if (!entry) {
        if (currentRouteState.path.startsWith('/auctions/')) {
          entry = routeMap['/auctions/:id']
        } else if (currentRouteState.path.startsWith('/raffles/')) {
          entry = routeMap['/raffles/:id']
        }
      }
      if (!entry) {
        entry = currentRouteState.path.startsWith('/admin') ? routeMap['/admin/dashboard'] : routeMap['/']
      }
      return entry.component
    })
    return () => h(activeComp.value)
  },
})
