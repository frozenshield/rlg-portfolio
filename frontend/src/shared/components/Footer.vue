<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCmsStore } from "@/modules/cms/cms.store";
import SecretQuestionModal from "./SecretQuestionModal.vue";

const route = useRoute();
const appVersion = '1.14.0';
const router = useRouter();
const cmsStore = useCmsStore();

// Mobile bottom-sheet overlay state
const isMobileMenuOpen = ref(false);

// Staff portal modal state
const isSecretQuestionModalOpen = ref(false);

// Newsletter state
const email = ref("");
const subscribed = ref(false);
const isSubscribing = ref(false);

// Auto-close bottom sheet on route change
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  }
);

// Active navigation route helpers
const isShopActive = computed(() => route.path.startsWith("/catalog"));
const isTrackActive = computed(() => route.path.startsWith("/orders"));

const navigateTo = (path: string) => {
  isMobileMenuOpen.value = false;
  router.push(path);
};

const openCmsModal = (slug: string) => {
  isMobileMenuOpen.value = false;
  cmsStore.openPageModal(slug);
};

const handleSubscribe = async () => {
  if (!email.value.trim()) return;
  isSubscribing.value = true;
  try {
    await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email.value.trim(),
        source: "footer_vip_alert",
      }),
    });
  } catch (e) {
    console.warn("Could not submit newsletter subscription", e);
  } finally {
    isSubscribing.value = false;
    subscribed.value = true;
    email.value = "";
  }
};
</script>

<template>
  <div>
    <!-- ========================================================================= -->
    <!-- 1. MOBILE VIEW (Default / < md): Fixed Bottom Bar + Slide-up Bottom Sheet -->
    <!-- ========================================================================= -->
    <div class="md:hidden">
      <!-- Fixed Persistent Bottom Navigation Bar (Glassmorphic dark background) -->
      <nav
        aria-label="Mobile Navigation"
        class="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] px-3"
      >
        <div class="grid grid-cols-4 items-center text-center">
          <!-- Button 1: Shop -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer group"
            :class="isShopActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
            @click="navigateTo('/catalog')"
          >
            <div
              class="relative p-1 rounded-xl transition-all"
              :class="isShopActive ? 'bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : ''"
            >
              <svg class="w-5 h-5 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span class="text-[10px] tracking-tight leading-none">Shop</span>
          </button>

          <!-- Button 2: Track -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer group"
            :class="isTrackActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
            @click="navigateTo('/orders')"
          >
            <div
              class="relative p-1 rounded-xl transition-all"
              :class="isTrackActive ? 'bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : ''"
            >
              <svg class="w-5 h-5 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span class="text-[10px] tracking-tight leading-none">Track</span>
          </button>

          <!-- Button 3: FAQ -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer group"
            @click="openCmsModal('faq')"
          >
            <div class="relative p-1 rounded-xl transition-all">
              <svg class="w-5 h-5 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="text-[10px] tracking-tight leading-none">FAQ</span>
          </button>

          <!-- Button 4: Menu -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer group"
            :class="isMobileMenuOpen ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <div
              class="relative p-1 rounded-xl transition-all"
              :class="isMobileMenuOpen ? 'bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : ''"
            >
              <svg class="w-5 h-5 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span class="text-[10px] tracking-tight leading-none">Menu</span>
          </button>
        </div>
      </nav>

      <!-- Slide-Up Bottom-Sheet Overlay -->
      <teleport to="body">
        <transition name="fade">
          <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="isMobileMenuOpen = false"
          ></div>
        </transition>

        <transition name="slide-up">
          <div
            v-if="isMobileMenuOpen"
            class="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19] border-t border-amber-500/30 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between"
            @click.stop
          >
            <div>
              <!-- Handle Bar -->
              <div
                class="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4 cursor-pointer hover:bg-slate-500 transition-colors"
                @click="isMobileMenuOpen = false"
              ></div>

              <!-- Sheet Header -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <img src="/logo.png" alt="RLG" class="w-7 h-7 object-contain" />
                  <span class="text-sm font-black text-white">
                    RLG <span class="text-amber-400">ONLINE SHOP</span>
                  </span>
                </div>
                <button
                  type="button"
                  class="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                  @click="isMobileMenuOpen = false"
                >
                  ✕
                </button>
              </div>

              <!-- Secondary Links Grid -->
              <div class="grid grid-cols-2 gap-4 py-4 text-xs">
                <!-- Hobby Vault Links -->
                <div class="space-y-2">
                  <h4 class="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Hobby Vault
                  </h4>
                  <ul class="space-y-1.5 text-slate-300 font-medium">
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/catalog')">
                        TCG Booster Boxes
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/catalog')">
                        Gunpla &amp; Model Kits
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/catalog')">
                        Scale Anime Figures
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/catalog')">
                        Deck Boxes &amp; Sleeves
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/catalog')">
                        Collector Toploaders
                      </button>
                    </li>
                  </ul>
                </div>

                <!-- Collector Care Links -->
                <div class="space-y-2">
                  <h4 class="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Collector Care
                  </h4>
                  <ul class="space-y-1.5 text-slate-300 font-medium">
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/orders')">
                        Track Order Dispatch
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="navigateTo('/wishlist')">
                        Saved Wishlist
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="openCmsModal('about')">
                        About Our Vault
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="openCmsModal('terms')">
                        Terms &amp; Authenticity
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="openCmsModal('privacy')">
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="openCmsModal('faq')">
                        Collector FAQs
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        class="text-slate-400 hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1 font-bold pt-1"
                        @click="isMobileMenuOpen = false; isSecretQuestionModalOpen = true"
                      >
                        <span>Staff Portal</span>
                        <span class="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">ADMIN</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- BIR Registered Business Seal (Mobile Sheet Footer) -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="bg-white/95 p-1 rounded-lg shadow-sm shrink-0">
                  <img
                    src="/images/bir-seal.png"
                    alt="Bureau of Internal Revenue Registered Seal"
                    class="h-8 w-auto object-contain"
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-bold text-white">BIR Registered Business</p>
                  <p class="text-[9px] text-slate-400">100% Tax Compliant &amp; DTI Verified</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-amber-400 font-mono font-bold">RLG HOBBY SHOP</span>
                <span class="text-[9px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">v{{ appVersion }}</span>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </div>

    <!-- ========================================================================= -->
    <!-- 2. DESKTOP VIEW (md: and above): Sleek Traditional Dark Footer (bg-[#0B0F19]) -->
    <!-- ========================================================================= -->
    <footer class="hidden md:block bg-[#0B0F19] border-t border-white/10 text-slate-300 font-display pt-12 pb-8">
      <div class="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <!-- TOP ROW: Flex row of 4 borderless value cards with metallic gold icons -->
        <div class="grid grid-cols-4 gap-6 pb-8 border-b border-white/10">
          <!-- Card 1: Fast Shipping -->
          <div class="flex items-center gap-4 group cursor-pointer" @click="cmsStore.openPageModal('faq')">
            <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">Fast Shipping</h4>
              <p class="text-xs text-slate-400">Free nationwide over ₱2,500</p>
            </div>
          </div>

          <!-- Card 2: 100% Authentic -->
          <div class="flex items-center gap-4 group cursor-pointer" @click="cmsStore.openPageModal('terms')">
            <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">100% Authentic</h4>
              <p class="text-xs text-slate-400">Official Bandai &amp; Pokémon</p>
            </div>
          </div>

          <!-- Card 3: Collector Packaging -->
          <div class="flex items-center gap-4 group cursor-pointer" @click="cmsStore.openPageModal('about')">
            <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">Collector Packaging</h4>
              <p class="text-xs text-slate-400">Corner protectors &amp; bubble wrap</p>
            </div>
          </div>

          <!-- Card 4: Mint Guarantee -->
          <div class="flex items-center gap-4 group cursor-pointer" @click="cmsStore.openPageModal('faq')">
            <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">Mint Guarantee</h4>
              <p class="text-xs text-slate-400">Hassle-free collector support</p>
            </div>
          </div>
        </div>

        <!-- MAIN ROW: 3 Columns (Brand Info, Links, VIP Alerts) -->
        <div class="grid grid-cols-12 gap-8 py-2">
          <!-- Left Col (5 cols): Logo & Description -->
          <div class="col-span-5 space-y-4">
            <div class="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="RLG Online Shop Logo"
                class="w-11 h-11 object-contain drop-shadow-md"
              />
              <span class="text-2xl font-black text-white tracking-tight">
                RLG <span class="text-amber-400">ONLINE SHOP</span>
              </span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed max-w-md">
              Your premier online hobby shop for factory-sealed TCG booster boxes,
              authentic Japanese Bandai Gunpla model kits, collectible scale figures,
              and protective card accessories.
            </p>
            <div class="flex items-center gap-2 pt-1 text-xs">
              <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-amber-300 font-bold">
                ⚡ 100% Genuine
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-indigo-300 font-bold">
                🛡️ Verified Vault
              </span>
            </div>
          </div>

          <!-- Middle Col (3 cols): Clean list of Hobby Vault & Collector Care Links -->
          <div class="col-span-4 grid grid-cols-2 gap-4">
            <!-- Hobby Vault -->
            <div class="space-y-3">
              <h4 class="text-xs font-black text-amber-400 uppercase tracking-wider">
                Hobby Vault
              </h4>
              <ul class="space-y-2 text-xs text-slate-300 font-medium">
                <li>
                  <router-link to="/catalog" class="hover:text-amber-300 transition-colors">TCG Boosters</router-link>
                </li>
                <li>
                  <router-link to="/catalog" class="hover:text-amber-300 transition-colors">Gunpla Kits</router-link>
                </li>
                <li>
                  <router-link to="/catalog" class="hover:text-amber-300 transition-colors">Anime Figures</router-link>
                </li>
                <li>
                  <router-link to="/catalog" class="hover:text-amber-300 transition-colors">Card Sleeves</router-link>
                </li>
                <li>
                  <router-link to="/catalog" class="hover:text-amber-300 transition-colors">Toploaders</router-link>
                </li>
              </ul>
            </div>

            <!-- Collector Care -->
            <div class="space-y-3">
              <h4 class="text-xs font-black text-amber-400 uppercase tracking-wider">
                Collector Care
              </h4>
              <ul class="space-y-2 text-xs text-slate-300 font-medium">
                <li>
                  <router-link to="/orders" class="hover:text-amber-300 transition-colors">Track Orders</router-link>
                </li>
                <li>
                  <router-link to="/wishlist" class="hover:text-amber-300 transition-colors">Saved Wishlist</router-link>
                </li>
                <li>
                  <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="cmsStore.openPageModal('about')">
                    About Our Vault
                  </button>
                </li>
                <li>
                  <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="cmsStore.openPageModal('terms')">
                    Terms &amp; Authenticity
                  </button>
                </li>
                <li>
                  <button type="button" class="hover:text-amber-300 transition-colors cursor-pointer text-left" @click="cmsStore.openPageModal('faq')">
                    Collector FAQs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    class="text-slate-500 hover:text-amber-300 transition-colors flex items-center gap-1 font-bold pt-1 cursor-pointer"
                    @click="isSecretQuestionModalOpen = true"
                  >
                    <span>Staff Portal</span>
                    <span class="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">ADMIN</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Right Col (3 cols): VIP Alerts Newsletter with Gold Gradient Subscribe Button -->
          <div class="col-span-3 space-y-3">
            <h4 class="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔔</span>
              <span>VIP Alerts &amp; Drops</span>
            </h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Enter your email for priority flash discounts, private drops, and rare booster restocks.
            </p>

            <form v-if="!subscribed" @submit.prevent="handleSubscribe" class="space-y-2">
              <input
                v-model="email"
                type="email"
                placeholder="collector@hobby.com"
                required
                class="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium"
              />
              <button
                type="submit"
                :disabled="isSubscribing"
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span v-if="isSubscribing" class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span v-else>⚡</span>
                <span>{{ isSubscribing ? 'Subscribing...' : 'Get VIP Drop Alerts' }}</span>
              </button>
            </form>

            <div v-else class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300">
              ✓ Welcome Collector! Priority drop alerts are active for your inbox.
            </div>
          </div>
        </div>

        <!-- BOTTOM ROW: Thin top border, copyright text & BIR Registration badge aligned cleanly -->
        <div class="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px]">
            <p>&copy; {{ new Date().getFullYear() }} RLG Online Shop. All brand trademarks (Bandai, The Pokémon Company, Bushiroad, Good Smile) belong to their respective owners.</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700/80 shrink-0 w-fit">
              v{{ appVersion }}
            </span>
          </div>

          <!-- BIR Registration Badge -->
          <div class="flex items-center gap-3">
            <div class="inline-block bg-white/95 p-1 rounded-lg border border-white/20 shadow-xs">
              <img
                src="/images/bir-seal.png"
                alt="Bureau of Internal Revenue Registered Seal"
                class="h-8 w-auto object-contain"
              />
            </div>
            <div class="text-left">
              <p class="text-[11px] font-bold text-white leading-tight">BIR Registered Business</p>
              <p class="text-[9px] text-slate-500 font-mono">Certificate of Registration Verified</p>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Staff Secret Question Security Gate Modal -->
    <SecretQuestionModal v-model="isSecretQuestionModalOpen" />
  </div>
</template>

<style scoped>
/* Mobile Bottom Sheet Slide Up Animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

