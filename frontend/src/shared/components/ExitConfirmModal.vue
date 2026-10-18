<script setup lang="ts">
interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();
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
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-display select-none"
        @click="emit('close')"
      >
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="isOpen"
            class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative space-y-5"
            @click.stop
          >
            <!-- Header Icon & Title -->
            <div class="flex items-center gap-3.5">
              <div
                class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-black tracking-wide text-white">
                  Exit RLG Shop?
                </h3>
                <p class="text-xs text-slate-400">Application Confirmation</p>
              </div>
            </div>

            <!-- Content Body -->
            <p class="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to exit the application?
            </p>

            <!-- Actions Footer -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-sm transition-all cursor-pointer border border-slate-700"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-rose-600/30 border border-rose-500"
                @click="emit('confirm')"
              >
                Exit
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>
