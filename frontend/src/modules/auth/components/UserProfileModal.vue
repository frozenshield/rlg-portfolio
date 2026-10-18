<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore, type UserProfile } from "../auth.store";
import BaseButton from "@/shared/components/BaseButton.vue";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved", message: string): void;
}>();

const authStore = useAuthStore();

// ─── Local Form State (Mapped to Backend Fields) ─────────────────────────────
/**
 * BACKEND FIELD MAPPINGS:
 * - name: string (e.g. 'Jane Doe')
 * - username: string (e.g. 'gunpla_master')
 * - email: string (e.g. 'collector@example.com')
 * - phone: string (e.g. '+63 912 345 6789')
 * - avatar: string (URL to image or uploaded avatar)
 * - address_line1: string (Street address)
 * - city: string (City / Municipality)
 * - postal_code: string (ZIP code)
 * - country: string (Country / Region)
 * - favorite_franchise: string (Favorite hobby category)
 * - bio: string (Collector bio note)
 */
// Cartoon & Collector Avatar Presets
const CARTOON_AVATAR_PRESETS = [
  {
    id: "pikachu",
    name: "Electric Mouse",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    emoji: "⚡",
  },
  {
    id: "charizard",
    name: "Fire Dragon",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
    emoji: "🔥",
  },
  {
    id: "gengar",
    name: "Shadow Ghost",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
    emoji: "👻",
  },
  {
    id: "mewtwo",
    name: "Psychic Legend",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
    emoji: "🔮",
  },
  {
    id: "lucario",
    name: "Aura Fighter",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
    emoji: "🥋",
  },
  {
    id: "eevee",
    name: "Evolution Fox",
    url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
    emoji: "🦊",
  },
  {
    id: "gundam-rx78",
    name: "Mecha Pilot RX-78",
    url: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=160&auto=format&fit=crop&q=80",
    emoji: "🤖",
  },
  {
    id: "collector-pro",
    name: "Vault Master",
    url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=160&auto=format&fit=crop&q=80",
    emoji: "👑",
  },
];

const form = ref<UserProfile>({
  name: "",
  username: "",
  email: "",
  phone: "",
  avatar: "",
  address_line1: "",
  city: "",
  postal_code: "",
  country: "Philippines",
  favorite_franchise: "Pokémon TCG",
  bio: "",
});

const isSaving = ref(false);
const saveSuccess = ref(false);

// Sync form with current user on open
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.value = {
        name: authStore.currentUser.name || "",
        username: authStore.currentUser.username || "",
        email: authStore.currentUser.email || "",
        phone: authStore.currentUser.phone || "",
        avatar: authStore.currentUser.avatar || "",
        address_line1: authStore.currentUser.address_line1 || "",
        city: authStore.currentUser.city || "",
        postal_code: authStore.currentUser.postal_code || "",
        country: authStore.currentUser.country || "Philippines",
        favorite_franchise:
          authStore.currentUser.favorite_franchise || "Pokémon TCG",
        bio: authStore.currentUser.bio || "",
      };
      saveSuccess.value = false;
    }
  },
  { immediate: true },
);

const handleSaveProfile = async () => {
  isSaving.value = true;
  saveSuccess.value = false;

  try {
    await authStore.updateProfile(form.value);
    saveSuccess.value = true;
    emit("saved", "Collector profile updated successfully! 🎉");
    setTimeout(() => {
      emit("close");
    }, 800);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto relative w-full max-w-[calc(100vw-1.25rem)] sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 text-slate-100 font-display animate-scale-up box-border overflow-hidden"
          >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-800 gap-2"
          >
            <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-base sm:text-lg text-indigo-400 shrink-0"
              >
                👤
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl font-black text-white truncate">Collector Profile</h3>
                <p class="text-[11px] sm:text-xs text-slate-400 truncate">
                  Manage personal details &amp; hobby identity
                </p>
              </div>
            </div>

            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm shrink-0"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <!-- Profile Avatar Preview Header -->
          <div
            class="my-4 sm:my-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 sm:gap-4 overflow-hidden min-w-0"
          >
            <div
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-900 via-indigo-600 to-amber-400 p-0.5 shadow-lg shrink-0"
            >
              <div
                class="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center text-2xl font-black text-amber-300"
              >
                <img
                  v-if="form.avatar"
                  :src="form.avatar"
                  alt="Avatar Preview"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{
                  form.name ? form.name.charAt(0).toUpperCase() : "C"
                }}</span>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white truncate">
                  {{ form.name || "Hobby Collector" }}
                </h4>
                <span
                  class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30"
                >
                  Verified Collector
                </span>
              </div>
              <p class="text-xs text-slate-400 truncate">
                {{ form.email || "collector@rlgshop.local" }}
              </p>
              <p class="text-[11px] text-amber-400 font-semibold mt-0.5">
                Fav: {{ form.favorite_franchise || "Pokémon TCG" }}
              </p>
            </div>
          </div>

          <!-- Form Fields Grid -->
          <form class="space-y-6" @submit.prevent="handleSaveProfile">
            <!-- Section 1: Basic Information -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>🏷️ Personal Information</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Full Name -->
                <div class="min-w-0">
                  <label
                    for="profile-name"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Full Name <span class="text-rose-400">*</span>
                  </label>
                  <input
                    id="profile-name"
                    v-model="form.name"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>name</code>
                  </p>
                </div>

                <!-- Username / Collector Handle -->
                <div class="min-w-0">
                  <label
                    for="profile-username"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Collector Handle
                  </label>
                  <div class="relative min-w-0">
                    <span
                      class="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold"
                      >@</span
                    >
                    <input
                      id="profile-username"
                      v-model="form.username"
                      type="text"
                      placeholder="e.g. shadow_trainer"
                      class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>username</code>
                  </p>
                </div>

                <!-- Email (Read-Only / Linked to Auth) -->
                <div class="min-w-0">
                  <label
                    for="profile-email"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    v-model="form.email"
                    type="email"
                    disabled
                    class="w-full max-w-full min-w-0 box-border bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>email</code>
                  </p>
                </div>

                <!-- Phone Number -->
                <div class="min-w-0">
                  <label
                    for="profile-phone"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Contact / Mobile Phone
                  </label>
                  <input
                    id="profile-phone"
                    v-model="form.phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>phone</code>
                  </p>
                </div>

                <!-- Avatar Selection & Preset Avatars -->
                <div class="sm:col-span-2 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-semibold text-slate-300">
                      Choose Cartoon / Collector Avatar
                    </label>
                    <span class="text-[10px] text-amber-400 font-bold">
                      ⭐ Tap any character to apply
                    </span>
                  </div>

                  <!-- Cartoon Character Grid -->
                  <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden">
                    <button
                      v-for="preset in CARTOON_AVATAR_PRESETS"
                      :key="preset.id"
                      type="button"
                      class="relative aspect-square rounded-lg sm:rounded-xl p-0.5 sm:p-1 border-2 transition-all cursor-pointer flex flex-col items-center justify-center bg-slate-900 hover:scale-105 active:scale-95 group min-w-0 overflow-hidden"
                      :class="
                        form.avatar === preset.url
                          ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/20'
                          : 'border-slate-800 hover:border-slate-600'
                      "
                      :title="preset.name"
                      @click="form.avatar = preset.url"
                    >
                      <img
                        :src="preset.url"
                        :alt="preset.name"
                        class="w-full h-full object-contain drop-shadow"
                      />
                      <span
                        v-if="form.avatar === preset.url"
                        class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-400 text-slate-950 rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center shadow-xs"
                      >
                        ✓
                      </span>
                    </button>
                  </div>

                  <!-- Custom URL Input Fallback -->
                  <div class="pt-1 min-w-0">
                    <label
                      for="profile-avatar"
                      class="block text-[11px] font-semibold text-slate-400 mb-1"
                    >
                      Or Custom Image URL
                    </label>
                    <input
                      id="profile-avatar"
                      v-model="form.avatar"
                      type="url"
                      placeholder="https://... or choose from character options above"
                      class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <p class="text-[10px] text-slate-500 mt-1 truncate">
                      Backend field: <code>avatar</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Delivery & Shipping Address -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>📦 Default Shipping Address</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div class="sm:col-span-3 min-w-0">
                  <label
                    for="profile-address"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Street Address / Unit / Building
                  </label>
                  <input
                    id="profile-address"
                    v-model="form.address_line1"
                    type="text"
                    placeholder="House No., Street Name, Barangay"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>address_line1</code>
                  </p>
                </div>

                <div class="min-w-0">
                  <label
                    for="profile-city"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    City / Municipality
                  </label>
                  <input
                    id="profile-city"
                    v-model="form.city"
                    type="text"
                    placeholder="e.g. Quezon City"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>city</code>
                  </p>
                </div>

                <div class="min-w-0">
                  <label
                    for="profile-postal"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Postal / ZIP Code
                  </label>
                  <input
                    id="profile-postal"
                    v-model="form.postal_code"
                    type="text"
                    placeholder="e.g. 1100"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>postal_code</code>
                  </p>
                </div>

                <div class="min-w-0">
                  <label
                    for="profile-country"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Country / Region
                  </label>
                  <select
                    id="profile-country"
                    v-model="form.country"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Philippines">Philippines</option>
                    <option value="Japan">Japan</option>
                    <option value="United States">United States</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>country</code>
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 3: Collector Preferences & Bio -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>🎮 Collector Identity &amp; Bio</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2 min-w-0">
                  <label
                    for="profile-franchise"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Favorite Franchise / Line
                  </label>
                  <select
                    id="profile-franchise"
                    v-model="form.favorite_franchise"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Pokémon TCG">Pokémon TCG ⚡</option>
                    <option value="One Piece Card Game">
                      One Piece Card Game 🏴‍☠️
                    </option>
                    <option value="Gundam Gunpla">
                      Gundam Gunpla Model Kits 🤖
                    </option>
                    <option value="Scale Anime Figures">
                      Scale Anime Figures 🎌
                    </option>
                    <option value="Weiß Schwarz">
                      Weiß Schwarz / Hololive 🎤
                    </option>
                  </select>
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>favorite_franchise</code>
                  </p>
                </div>

                <div class="sm:col-span-2 min-w-0">
                  <label
                    for="profile-bio"
                    class="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Collector Bio / Note
                  </label>
                  <textarea
                    id="profile-bio"
                    v-model="form.bio"
                    rows="3"
                    placeholder="Tell other collectors what you hunt, build, or grade..."
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  ></textarea>
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>bio</code>
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div
              class="pt-5 border-t border-slate-800 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                @click="emit('close')"
              >
                Cancel
              </button>

              <div class="flex items-center gap-3">
                <span
                  v-if="saveSuccess"
                  class="text-xs font-bold text-emerald-400 flex items-center gap-1"
                >
                  ✓ Saved!
                </span>
                <BaseButton
                  type="submit"
                  variant="primary"
                  size="md"
                  :disabled="isSaving"
                >
                  <span v-if="isSaving">Saving...</span>
                  <span v-else>Save Changes</span>
                </BaseButton>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
