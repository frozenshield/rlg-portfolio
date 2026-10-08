import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePortfolioStore = defineStore('portfolio', () => {
  // View mode: 'outer' (Light Bento) or 'workspace' (Dark DevOps Dashboard)
  const currentMode = ref('outer')
  
  // Active Project ID
  const activeProjectId = ref('rlg-online-shop')
  
  // Workspace Tab Navigation:
  // 'overview' | 'slides' | 'demos' | 'infra' | 'tech' | 'ai' | 'architecture'
  const activeWorkspaceTab = ref('overview')
  
  // Interactive Demo Toggle: 'admin' | 'storefront'
  const activeDemoMode = ref('admin')

  // Screen Resolution / Device Frame Mode: 'desktop' | 'tablet' | 'mobile'
  const activeDevice = ref('desktop')
  const deviceZoom = ref(100)
  
  // Presentation Deck state
  const currentSlideIndex = ref(0)
  const isTalkTracksOpen = ref(true)
  
  // Global search query
  const searchQuery = ref('')
  
  // AI status & connection state
  const aiStatus = ref('Online')
  const isAiStreaming = ref(false)

  // Currency switcher state for demo views
  const currency = ref('PHP') // 'PHP' | 'USD'

  // Workspace mobile sidebar drawer state
  const isWorkspaceSidebarOpen = ref(false)

  // Actions
  function openWorkspace(projectId = 'rlg-online-shop', initialTab = 'overview') {
    activeProjectId.value = projectId
    activeWorkspaceTab.value = initialTab
    currentMode.value = 'workspace'
    isWorkspaceSidebarOpen.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeWorkspace() {
    currentMode.value = 'outer'
    isWorkspaceSidebarOpen.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleWorkspaceSidebar() {
    isWorkspaceSidebarOpen.value = !isWorkspaceSidebarOpen.value
  }

  function closeWorkspaceSidebar() {
    isWorkspaceSidebarOpen.value = false
  }

  function setWorkspaceTab(tab) {
    activeWorkspaceTab.value = tab
    isWorkspaceSidebarOpen.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setDemoMode(mode) {
    activeDemoMode.value = mode
  }

  function setDevice(device) {
    activeDevice.value = device
  }

  function toggleCurrency() {
    currency.value = currency.value === 'PHP' ? 'USD' : 'PHP'
  }

  function nextSlide(totalSlides = 8) {
    if (currentSlideIndex.value < totalSlides - 1) {
      currentSlideIndex.value++
    } else {
      currentSlideIndex.value = 0
    }
  }

  function prevSlide(totalSlides = 8) {
    if (currentSlideIndex.value > 0) {
      currentSlideIndex.value--
    } else {
      currentSlideIndex.value = totalSlides - 1
    }
  }

  function goToSlide(index) {
    currentSlideIndex.value = index
  }

  function toggleTalkTracks() {
    isTalkTracksOpen.value = !isTalkTracksOpen.value
  }

  return {
    currentMode,
    activeProjectId,
    activeWorkspaceTab,
    activeDemoMode,
    activeDevice,
    deviceZoom,
    currentSlideIndex,
    isTalkTracksOpen,
    searchQuery,
    aiStatus,
    isAiStreaming,
    currency,
    isWorkspaceSidebarOpen,
    openWorkspace,
    closeWorkspace,
    toggleWorkspaceSidebar,
    closeWorkspaceSidebar,
    setWorkspaceTab,
    setDemoMode,
    setDevice,
    toggleCurrency,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleTalkTracks
  }
})
