<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  modelValue?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "unlocked"): void;
}>();

const router = useRouter();
const activeQuestion = ref<string>("What's the name of your pet?");
const questionId = ref<number | null>(null);
const answerInput = ref("");
const isLoading = ref(false);
const isVerifying = ref(false);
const errorMessage = ref("");
const isSuccess = ref(false);

const fetchActiveQuestion = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const res = await fetch("/api/secret-questions/active");
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        activeQuestion.value = json.data.question;
        questionId.value = json.data.id;
      }
    }
  } catch (e) {
    console.warn("Could not load active secret question", e);
  } finally {
    isLoading.value = false;
  }
};

const handleVerify = async () => {
  if (!answerInput.value.trim()) {
    errorMessage.value = "Please enter your security answer.";
    return;
  }

  isVerifying.value = true;
  errorMessage.value = "";

  try {
    const res = await fetch("/api/secret-questions/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: questionId.value,
        answer: answerInput.value.trim(),
      }),
    });

    const json = await res.json();

    if (res.ok && json.success && json.verified) {
      isSuccess.value = true;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("rlg_staff_unlocked", "true");
        sessionStorage.setItem("rlg_staff_clearance_token", json.clearance_token || "unlocked");
      }
      setTimeout(() => {
        emit("update:modelValue", false);
        emit("unlocked");
        router.push("/admin/login");
      }, 700);
    } else {
      errorMessage.value = json.message || "Incorrect answer. Clearance denied.";
    }
  } catch (e: any) {
    errorMessage.value = e.message || "Verification request failed. Please try again.";
  } finally {
    isVerifying.value = false;
  }
};

const closeModal = () => {
  emit("update:modelValue", false);
  answerInput.value = "";
  errorMessage.value = "";
};

onMounted(() => {
  fetchActiveQuestion();
});
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-display"
        @click.self="closeModal"
      >
        <div
          class="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 text-white space-y-5 animate-scale-up"
        >
          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
            @click="closeModal"
          >
            ✕
          </button>

          <!-- Security Shield Header -->
          <div class="text-center space-y-2">
            <div
              class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center text-2xl mx-auto shadow-sm"
            >
              🛡️
            </div>
            <h3 class="text-xl font-black text-white tracking-tight">
              Staff Portal Security Gate
            </h3>
            <p class="text-xs text-slate-400 max-w-xs mx-auto">
              Please answer the secret question to unlock access to the administrative staff roster.
            </p>
          </div>

          <!-- Secret Question Card -->
          <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
              Security Challenge Question:
            </span>
            <div class="text-sm font-bold text-slate-100 italic">
              "{{ activeQuestion }}"
            </div>
          </div>

          <!-- Input Form -->
          <form @submit.prevent="handleVerify" class="space-y-4">
            <div>
              <label for="secret-answer" class="block text-xs font-bold text-slate-300 mb-1.5">
                Secret Answer
              </label>
              <input
                id="secret-answer"
                v-model="answerInput"
                type="text"
                autocomplete="off"
                placeholder="Type the secret answer..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-colors"
                :disabled="isVerifying || isSuccess"
                autofocus
              />
            </div>

            <!-- Error Message Alert -->
            <div
              v-if="errorMessage"
              class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Success Message Alert -->
            <div
              v-if="isSuccess"
              class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
            >
              <span>✅</span>
              <span>Clearance granted! Redirecting to Staff Portal...</span>
            </div>

            <div class="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                class="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isVerifying || isSuccess"
                class="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span v-if="isVerifying" class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span v-else>🔓</span>
                <span>{{ isVerifying ? "Verifying..." : "Verify & Unlock" }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </teleport>
</template>

