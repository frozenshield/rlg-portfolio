<script setup lang="ts">
import { ref } from "vue";
import { useCmsStore } from "@/modules/cms/cms.store";
import SecretQuestionModal from "./SecretQuestionModal.vue";

const cmsStore = useCmsStore();

const email = ref("");
const subscribed = ref(false);
const isSubscribing = ref(false);
const isSecretQuestionModalOpen = ref(false);

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
    console.warn("Could not submit newsletter subscription to backend", e);
  } finally {
    isSubscribing.value = false;
    subscribed.value = true;
    email.value = "";
  }
};
</script>

<template>
  <footer
    class="bg-white border-t border-slate-200 mt-6 sm:mt-12 pt-6 sm:pt-10 pb-6 sm:pb-8 font-display"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 4 Badges Feature Strip (2 cols on mobile, 4 on desktop) -->
      <div
        class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 pb-6 sm:pb-8 border-b border-slate-200/80"
      >
        <div
          class="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors"
          @click="cmsStore.openPageModal('faq')"
        >
          <div class="text-xl sm:text-2xl shrink-0">🚚</div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Fast Shipping
            </h4>
            <p class="text-[10px] sm:text-xs text-slate-500 truncate">
              Free over ₱2,500
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors"
          @click="cmsStore.openPageModal('about')"
        >
          <div class="text-xl sm:text-2xl shrink-0">🛡️</div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
              100% Authentic
            </h4>
            <p class="text-[10px] sm:text-xs text-slate-500 truncate">
              Official Bandai &amp; Pokemon
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors"
          @click="cmsStore.openPageModal('terms')"
        >
          <div class="text-xl sm:text-2xl shrink-0">📦</div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Collector Packaging
            </h4>
            <p class="text-[10px] sm:text-xs text-slate-500 truncate">
              Corner protectors
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors"
          @click="cmsStore.openPageModal('terms')"
        >
          <div class="text-xl sm:text-2xl shrink-0">🤝</div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Mint Guarantee
            </h4>
            <p class="text-[10px] sm:text-xs text-slate-500 truncate">
              Hassle-free support
            </p>
          </div>
        </div>
      </div>

      <!-- Footer Columns: 2 Columns on mobile ("2 layer"), 5 on desktop -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-x-4 sm:gap-x-8 gap-y-6 sm:gap-y-10 py-6 sm:py-12">
        <!-- Brand Info: Full span on mobile, 2 cols on desktop -->
        <div class="col-span-2 md:col-span-2 space-y-2 sm:space-y-4">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/logo.png"
              alt="RLG Online Shop Logo"
              class="w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-sm"
            />
            <span class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              RLG <span class="text-rose-600">ONLINE SHOP</span>
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 leading-snug sm:leading-relaxed max-w-sm">
            Your premier online hobby shop for factory-sealed TCG booster boxes,
            authentic Japanese Bandai Gunpla model kits, collectible scale
            figures, and protective card accessories.
          </p>
          <div class="flex items-center gap-2 sm:gap-3 text-slate-400 text-sm sm:text-lg">
            <button
              type="button"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors"
              title="About RLG Hobby Shop"
              @click="cmsStore.openPageModal('about')"
            >
              🃏
            </button>
            <button
              type="button"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors"
              title="Gunpla & Model Kits"
              @click="cmsStore.openPageModal('about')"
            >
              🤖
            </button>
            <button
              type="button"
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors"
              title="Authenticity Guarantee"
              @click="cmsStore.openPageModal('terms')"
            >
              🛡️
            </button>
          </div>
        </div>

        <!-- Quick Links: Col 1 on mobile -->
        <div class="col-span-1">
          <h4
            class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 sm:mb-4"
          >
            Hobby Vault
          </h4>
          <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 font-medium">
            <li>
              <router-link
                to="/catalog"
                class="hover:text-rose-600 transition-colors"
                >TCG Booster Boxes</router-link
              >
            </li>
            <li>
              <router-link
                to="/catalog"
                class="hover:text-rose-600 transition-colors"
                >Gunpla &amp; Model Kits</router-link
              >
            </li>
            <li>
              <router-link
                to="/catalog"
                class="hover:text-rose-600 transition-colors"
                >Scale Anime Figures</router-link
              >
            </li>
            <li>
              <router-link
                to="/catalog"
                class="hover:text-rose-600 transition-colors"
                >Deck Boxes &amp; Sleeves</router-link
              >
            </li>
            <li>
              <router-link
                to="/catalog"
                class="hover:text-rose-600 transition-colors"
                >Collector Toploaders</router-link
              >
            </li>
          </ul>

          <!-- Official BIR Registered Seal Badge -->
          <div class="mt-4 pt-2 border-t border-slate-100">
            <div class="inline-block bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <img
                src="/images/bir-seal.png"
                alt="Bureau of Internal Revenue Registered Seal"
                class="h-10 sm:h-12 w-auto object-contain rounded"
              />
            </div>
            <p class="text-[10px] text-slate-400 font-semibold mt-1">BIR Registered Business</p>
          </div>
        </div>

        <!-- Customer Care & CMS Pages: Col 2 on mobile -->
        <div class="col-span-1">
          <h4
            class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 sm:mb-4"
          >
            Collector Care
          </h4>
          <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 font-medium">
            <li>
              <router-link
                to="/orders"
                class="hover:text-rose-600 transition-colors"
                >Track Order Dispatch</router-link
              >
            </li>
            <li>
              <router-link
                to="/wishlist"
                class="hover:text-rose-600 transition-colors"
                >Saved Wishlist</router-link
              >
            </li>
            <li>
              <button
                type="button"
                class="hover:text-rose-600 transition-colors text-left cursor-pointer"
                @click="cmsStore.openPageModal('about')"
              >
                About Our Vault
              </button>
            </li>
            <li>
              <button
                type="button"
                class="hover:text-rose-600 transition-colors text-left cursor-pointer"
                @click="cmsStore.openPageModal('terms')"
              >
                Terms &amp; Authenticity
              </button>
            </li>
            <li>
              <button
                type="button"
                class="hover:text-rose-600 transition-colors text-left cursor-pointer"
                @click="cmsStore.openPageModal('privacy')"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                class="hover:text-rose-600 transition-colors text-left cursor-pointer"
                @click="cmsStore.openPageModal('faq')"
              >
                Collector FAQs
              </button>
            </li>
            <li>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs pt-1 sm:pt-2 cursor-pointer"
                @click="isSecretQuestionModalOpen = true"
              >
                <span>Staff Portal &bull; Login</span>
                <span
                  class="text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono"
                  >ADMIN</span
                >
              </button>
            </li>
          </ul>
        </div>

        <!-- Newsletter Subscription: Bottom layer on mobile, 1 col on desktop -->
        <div class="col-span-2 md:col-span-1 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
          <h4
            class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-4 flex items-center gap-1.5"
          >
            <span>🔔</span>
            <span>VIP Alerts &amp; Promotions</span>
          </h4>
          <p class="text-[11px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3">
            Save your email for exclusive flash discounts, promo codes, and rare booster box restocks.
          </p>
          <form
            v-if="!subscribed"
            @submit.prevent="handleSubscribe"
            class="flex flex-col gap-2"
          >
            <input
              v-model="email"
              type="email"
              placeholder="collector@hobby.com"
              required
              class="w-full text-xs px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 font-medium"
            />
            <button
              type="submit"
              :disabled="isSubscribing"
              class="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 sm:py-2.5 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span v-if="isSubscribing" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>⚡</span>
              <span>{{ isSubscribing ? 'Saving Email...' : 'Save Email for VIP Promotions' }}</span>
            </button>
          </form>
          <div
            v-else
            class="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-700"
          >
            🎉 Welcome Collector! Your email is saved. You will receive priority discounts and VIP drop alerts.
          </div>
        </div>
      </div>

      <!-- Copyright Bar -->
      <div
        class="pt-4 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-2 sm:gap-4 text-center sm:text-left"
      >
        <p>
          &copy; {{ new Date().getFullYear() }} RLG Hobby Shop. All brand
          trademarks (Bandai, The Pokémon Company, Bushiroad, Good Smile) belong
          to their respective owners.
        </p>
        <p class="flex items-center gap-1 font-semibold text-slate-500">
          RLG Hobby Shop &bull; Built with ⚡ Vue 3, PrimeVue &amp; Tailwind
        </p>
      </div>
    </div>

    <!-- Staff Secret Question Security Gate Modal -->
    <SecretQuestionModal v-model="isSecretQuestionModalOpen" />
  </footer>
</template>
