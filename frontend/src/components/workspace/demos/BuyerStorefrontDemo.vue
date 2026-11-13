<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/shared/components/AppHeader.vue";
import AppFooter from "@/shared/components/AppFooter.vue";
import CartDrawer from "@/modules/cart/components/CartDrawer.vue";
import ToyGiftAdvisorModal from "@/modules/toy-finder/ToyGiftAdvisorModal.vue";
import AuthModal from "@/modules/auth/components/AuthModal.vue";
import UserProfileModal from "@/modules/auth/components/UserProfileModal.vue";
import UserSettingsModal from "@/modules/auth/components/UserSettingsModal.vue";
import StorefrontAiChatbot from "@/shared/components/StorefrontAiChatbot.vue";
import CmsPageModal from "@/modules/cms/components/CmsPageModal.vue";
import CmsBlogModal from "@/modules/cms/components/CmsBlogModal.vue";
import { usePortfolioStore } from "@/stores/portfolioStore";

const route = useRoute();
const portfolioStore = usePortfolioStore();

const isAdvisorOpen = ref(false);
const isAuthOpen = ref(false);
const isProfileOpen = ref(false);
const isSettingsOpen = ref(false);

const isMobile = computed(() => portfolioStore.activeDevice === "mobile");
const isTablet = computed(() => portfolioStore.activeDevice === "tablet");
</script>

<template>
  <div class="relative w-full min-h-full flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
    <!-- Storefront Header with Live Navigation & User Menu -->
    <AppHeader
      @open-advisor="isAdvisorOpen = true"
      @open-auth="isAuthOpen = true"
      @open-profile="isProfileOpen = true"
      @open-settings="isSettingsOpen = true"
    />

    <!-- Routed Main Content (HomeView, ToyCatalogView, Gacha, Raffles, Live Breaks, Preorders, Auctions, Wallet) -->
    <main class="flex-1 w-full relative">
      <router-view @open-advisor="isAdvisorOpen = true" />
    </main>

    <!-- Storefront Footer with Live Links -->
    <AppFooter />

    <!-- Slide-Out Cart Drawer -->
    <CartDrawer />

    <!-- Modals & Overlays -->
    <ToyGiftAdvisorModal v-model="isAdvisorOpen" />
    <AuthModal v-model="isAuthOpen" />
    <UserProfileModal v-model="isProfileOpen" />
    <UserSettingsModal v-model="isSettingsOpen" />
    <CmsPageModal />
    <CmsBlogModal />

    <!-- Live AI Chatbot Widget -->
    <StorefrontAiChatbot />
  </div>
</template>

<style scoped>
/* Ensure smooth transitions inside simulated screen */
:deep(img) {
  max-width: 100%;
}
</style>
