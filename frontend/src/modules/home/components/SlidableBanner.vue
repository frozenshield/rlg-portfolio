<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { resolveStorageUrl } from "@/shared/utils/api";
import { useAuthStore } from "@/modules/auth/auth.store";

const router = useRouter();
const authStore = useAuthStore();

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  alt: string;
  link?: string;
  isExternal?: boolean;
  isVipBanner?: boolean;
}

const slides: BannerSlide[] = [
  {
    id: "banner-vip-perks",
    image: "/images/banners/banner-vip-perks.jpg",
    title: "RLG Collector VIP Pass — Pro Membership",
    alt: "Unlock Pro Member Perks: Free AI Card Grader, 4 Guaranteed Holo Cards & Special Prices — ₱999.00",
    link: "/vip",
    isExternal: false,
    isVipBanner: true,
  },
  {
    id: "banner-raffle",
    image: "/images/banners/banner-raffle.jpg",
    title: "Lucky Raffle & Friends Invite",
    alt: "Invite Your Friends - Win Big in Our Lucky Raffle!",
    link: "/catalog",
    isExternal: false,
  },
  {
    id: "banner-shipping",
    image: "/images/banners/banner-shipping.jpg",
    title: "Fast & Secure Shipping",
    alt: "Fast & Secure Shipping - Reliable Delivery, Handled with Care",
    link: "/catalog",
    isExternal: false,
  },
  {
    id: "banner-fb-prizes",
    image: "/images/banners/banner-fb-prizes.jpg",
    title: "Follow Us on Facebook",
    alt: "Follow Us on FB: YourDailyGames - Win Surprise Prizes!",
    link: "https://www.facebook.com/YourDailyGames",
    isExternal: true,
  },
];

const currentIndex = ref(0);
const isPaused = ref(false);
let autoSlideTimer: number | null = null;

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.length;
};

const prevSlide = () => {
  currentIndex.value =
    (currentIndex.value - 1 + slides.length) % slides.length;
};

const goToSlide = (idx: number) => {
  currentIndex.value = idx;
};

const startAutoSlide = () => {
  stopAutoSlide();
  autoSlideTimer = window.setInterval(() => {
    if (!isPaused.value) {
      nextSlide();
    }
  }, 4500);
};

const stopAutoSlide = () => {
  if (autoSlideTimer !== null) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
};

const handleBannerClick = (slide: BannerSlide) => {
  if (slide.isVipBanner) {
    authStore.openProModal();
    return;
  }
  if (!slide.link) return;
  if (slide.isExternal) {
    window.open(slide.link, "_blank", "noopener,noreferrer");
  } else {
    router.push(slide.link);
  }
};

// Touch gestures for mobile swipe
let touchStartX = 0;
let touchEndX = 0;

const onTouchStart = (e: TouchEvent) => {
  isPaused.value = true;
  touchStartX = e.changedTouches[0].screenX;
};

const onTouchEnd = (e: TouchEvent) => {
  isPaused.value = false;
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
};

const handleSwipe = () => {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 40) {
    if (diff > 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (!target || target.dataset.fallbackApplied) return;
  target.dataset.fallbackApplied = "true";
  target.src =
    "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1200&auto=format&fit=crop&q=80";
};

onMounted(() => {
  startAutoSlide();
});

onUnmounted(() => {
  stopAutoSlide();
});
</script>

<template>
  <section
    class="relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800/80 bg-slate-950 font-display select-none group isolate"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Slides Track with Smooth Transition -->
    <div
      class="flex w-full transition-transform duration-500 ease-out will-change-transform aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] max-h-[360px]"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="(slide, idx) in slides"
        :key="slide.id"
        class="w-full h-full shrink-0 relative cursor-pointer overflow-hidden flex items-center justify-center bg-slate-950"
        @click="handleBannerClick(slide)"
      >
        <!-- Specialized VIP Perks Graphic Banner Slide -->
        <div
          v-if="slide.isVipBanner"
          class="w-full h-full relative flex items-center justify-between px-6 sm:px-12 py-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 border-b border-amber-500/20"
        >
          <div class="relative z-10 max-w-xl space-y-2.5 text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-md">
              <span class="animate-bounce">👑</span>
              <span>RLG Collector VIP Pass</span>
            </div>
            <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Unlock All <span class="text-amber-400">Pro Collector</span> Perks
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 line-clamp-2">
              Free AI Grader &bull; 4 Bonus Holo/VMAX Cards &bull; Exclusive Promotion Pricing &bull; Gold VIP Profile Badge
            </p>
            <div class="pt-1 flex items-center gap-3">
              <button
                type="button"
                class="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95"
              >
                Become a Pro — ₱999.00 →
              </button>
              <span class="text-[11px] sm:text-xs text-amber-200/90 font-mono font-bold hidden sm:inline">
                Limited Collector Tier
              </span>
            </div>
          </div>

          <!-- Glowing Crown Graphic on the Right -->
          <div class="hidden sm:flex items-center justify-center relative shrink-0 pr-4">
            <div class="w-36 h-36 rounded-full bg-amber-400/20 blur-2xl absolute"></div>
            <div class="relative text-7xl md:text-8xl select-none filter drop-shadow-[0_0_24px_rgba(251,191,36,0.6)] animate-pulse">
              👑
            </div>
          </div>
        </div>

        <!-- Regular Image Banners: Fitted Completely (object-contain) to prevent cropping -->
        <img
          v-else
          :src="resolveStorageUrl(slide.image)"
          :alt="slide.alt"
          class="w-full h-full max-w-full max-h-full object-contain object-center block"
          :loading="idx === 0 ? 'eager' : 'lazy'"
          @error="handleImageError"
        />

        <!-- Subtle Top & Bottom Gradient Vignettes -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-black/10 pointer-events-none"
        ></div>
      </div>
    </div>

    <!-- Left Arrow Navigation (Always visible & interactive) -->
    <button
      type="button"
      class="flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-xl active:scale-95 z-20 cursor-pointer transition-all duration-200"
      aria-label="Previous slide"
      @click.stop="prevSlide"
    >
      <svg
        class="w-4 h-4 sm:w-5 sm:h-5 text-amber-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>

    <!-- Right Arrow Navigation (Always visible & interactive) -->
    <button
      type="button"
      class="flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white items-center justify-center backdrop-blur-md border border-white/20 shadow-xl active:scale-95 z-20 cursor-pointer transition-all duration-200"
      aria-label="Next slide"
      @click.stop="nextSlide"
    >
      <svg
        class="w-4 h-4 sm:w-5 sm:h-5 text-amber-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>

    <!-- Doorzo-style Pagination Pill Indicators at Bottom -->
    <div
      class="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-10"
    >
      <button
        v-for="(_, idx) in slides"
        :key="idx"
        type="button"
        class="transition-all duration-300 rounded-full cursor-pointer"
        :class="
          currentIndex === idx
            ? 'w-5 sm:w-6 h-1.5 bg-amber-400'
            : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
        "
        :aria-label="`Go to slide ${idx + 1}`"
        @click.stop="goToSlide(idx)"
      ></button>
    </div>
  </section>
</template>
