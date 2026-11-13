<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore, type WalletTransactionItem } from './wallet.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { resolveApiUrl } from '@/shared/utils/api';

const router = useRouter();
const walletStore = useWalletStore();
const authStore = useAuthStore();

// Smooth number-counting animation state
const animatedAvailable = ref<number>(0);
const animatedHeld = ref<number>(0);
const animatedTotal = ref<number>(0);

const animateCounter = (
  targetRef: { value: number },
  toValue: number,
  durationMs = 700
) => {
  const startValue = targetRef.value;
  const diff = toValue - startValue;
  if (Math.abs(diff) < 0.01) {
    targetRef.value = toValue;
    return;
  }
  const startTime = performance.now();

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    targetRef.value = startValue + diff * eased;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      targetRef.value = toValue;
    }
  };
  requestAnimationFrame(step);
};

watch(
  () => walletStore.walletBalance,
  (val) => animateCounter(animatedAvailable, val)
);
watch(
  () => walletStore.heldBalance,
  (val) => animateCounter(animatedHeld, val)
);
watch(
  () => walletStore.totalEquity,
  (val) => animateCounter(animatedTotal, val)
);


const openTopUpModal = () => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to top up your collector digital wallet.');
    return;
  }
  isTopUpOpen.value = true;
  activeQrPhSession.value = null;
};

// ─── TOP-UP STATE ────────────────────────────────────────────────────────────
const isTopUpOpen = ref(false);
const quickTopUpAmounts = [200, 500, 1000, 2500, 5000, 10000];
const selectedTopUpAmount = ref<number>(500);

// Payment Channel Selection: 'paymongo_qrph' | 'maribank' | 'gotyme' | 'gcash' | 'maya'
type PaymentChannel = 'paymongo_qrph' | 'paymongo_bpi' | 'paymongo_ubp' | 'maribank' | 'gotyme' | 'gcash' | 'maya';
const selectedChannel = ref<PaymentChannel>('paymongo_qrph');
const activeChannelsMap = ref<Record<string, boolean>>({
  paymongo_qrph: true,
  paymongo_bpi: true,
  paymongo_ubp: true,
  maribank: true,
  gotyme: true,
  gcash: true,
  maya: true,
});

const fetchActiveChannels = async () => {
  try {
    const res = await fetch(resolveApiUrl('/ref-payment-methods?status=all'));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((m) => {
          activeChannelsMap.value[m.code] = m.status === 'active';
        });
        if (!activeChannelsMap.value[selectedChannel.value]) {
          const first = (['paymongo_qrph', 'paymongo_bpi', 'paymongo_ubp', 'maribank', 'gotyme', 'gcash', 'maya']).find(c => activeChannelsMap.value[c]);
          if (first) selectedChannel.value = first;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load active payment channels:', err);
  }
};

// Manual Transfer Form State
const manualRefNumber = ref('');
const manualSenderName = ref('');
const manualProofFile = ref<File | null>(null);
const manualProofPreview = ref<string | null>(null);
const isSendingInstructions = ref(false);
const instructionEmailSent = ref(false);
const isQrModalOpen = ref(false);
const qrEmailCooldown = ref(0);
let qrCooldownTimer = null;

const startQrCooldown = (seconds) => {
  qrEmailCooldown.value = seconds;
  if (qrCooldownTimer) clearInterval(qrCooldownTimer);
  qrCooldownTimer = setInterval(() => {
    if (qrEmailCooldown.value > 0) {
      qrEmailCooldown.value--;
    } else {
      clearInterval(qrCooldownTimer);
      qrCooldownTimer = null;
    }
  }, 1000);
};

const initQrCooldownFromStorage = () => {
  if (typeof window === 'undefined') return;
  const lastSent = Number(localStorage.getItem('rlg_payqr_email_sent_time') || 0);
  if (lastSent) {
    const elapsed = Math.floor((Date.now() - lastSent) / 1000);
    if (elapsed < 180) {
      startQrCooldown(180 - elapsed);
      instructionEmailSent.value = true;
    }
  }
};

const handleSendInstructions = async () => {
  isQrModalOpen.value = true;
  if (isSendingInstructions.value || qrEmailCooldown.value > 0) return;
  isSendingInstructions.value = true;
  try {
    await walletStore.sendPaymentInstructions(selectedChannel.value, selectedTopUpAmount.value);
    instructionEmailSent.value = true;
    localStorage.setItem('rlg_payqr_email_sent_time', String(Date.now()));
    startQrCooldown(180);
  } catch (err) {
    if (err && err.cooldown_remaining) {
      startQrCooldown(Number(err.cooldown_remaining));
    }
  } finally {
    isSendingInstructions.value = false;
  }
};

const closeQrModalAndFocusForm = () => {
  isQrModalOpen.value = false;
  setTimeout(() => {
    const el = document.getElementById('manual-ref-input');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  }, 100);
};
const isSubmittingManual = ref(false);
// Cloudflare Turnstile state & bot shield
const turnstileToken = ref<string>('');
const turnstileContainerRef = ref<HTMLElement | null>(null);
const turnstileWidgetId = ref<any>(null);

const initTurnstile = () => {
  if (typeof window !== 'undefined' && (window as any).turnstile && turnstileContainerRef.value) {
    try {
      if (turnstileWidgetId.value !== null) {
        (window as any).turnstile.remove(turnstileWidgetId.value);
      }
      turnstileWidgetId.value = (window as any).turnstile.render(turnstileContainerRef.value, {
        sitekey: import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
        theme: 'dark',
        size: 'flexible',
        callback: (token: string) => {
          turnstileToken.value = token;
        },
        'expired-callback': () => {
          turnstileToken.value = '';
        },
      });
    } catch (err) {
      console.warn('Turnstile render warning:', err);
    }
  }
};


// PayMongo Dynamic QR Ph Live State
const activeQrPhSession = ref<{
  payment_intent_id: string;
  order_number: string;
  amount: number;
  qr_image_url: string;
  qr_string?: string;
  expires_at?: string;
} | null>(null);

const isGeneratingQrPh = ref(false);
const qrStatusPollTimer = ref<any>(null);
const qrSecondsRemaining = ref<number>(1800); // 30 minutes
let qrCountdownInterval: any = null;

// Static Merchant QR Cards Definition
const manualMerchants: Record<
  string,
  {
    name: string;
    badge: string;
    account_name: string;
    account_number: string;
    qr_image: string;
    instructions: string;
    colorClass: string;
  }
> = {
  maribank: {
    name: 'MariBank Philippines',
    badge: 'MariBank Direct / QR',
    account_name: 'RUSSEL LUIS GEMENTIZA',
    account_number: 'MariBank(****4301)',
    qr_image: '/images/qr/maribank-qr.png',
    instructions:
      'Open your MariBank or ShopeePay app. Scan the QR code, transfer the exact amount, and input your transaction Reference ID below.',
    colorClass: 'border-orange-500/40 bg-orange-950/20 text-orange-300',
  },
  gotyme: {
    name: 'GoTyme Bank',
    badge: 'GoTyme Digital Bank',
    account_name: 'RUSSEL LUIS GEMENTIZA',
    account_number: '•••••••• 5860',
    qr_image: '/images/qr/gotyme-qr.png',
    instructions:
      'Scan using your GoTyme or any InstaPay banking app. Enter exact amount, take a screenshot, and input Reference ID below.',
    colorClass: 'border-teal-500/40 bg-teal-950/20 text-teal-300',
  },
  gcash: {
    name: 'GCash',
    badge: 'GCash QR Transfer',
    account_name: 'RU***L LU*S G.',
    account_number: '+63 956 997 ****',
    qr_image: '/images/qr/gcash-qr.jpg',
    instructions:
      'Scan via GCash "Scan to Pay". Input the exact amount and copy the 13-digit Reference No. from your confirmation receipt.',
    colorClass: 'border-sky-500/40 bg-sky-950/20 text-sky-300',
  },
  maya: {
    name: 'Maya Wallet',
    badge: 'Maya Direct / QR',
    account_name: 'Russel Luis Gementiza',
    account_number: '+63 *** *** 0813 (@russelluis)',
    qr_image: '/images/qr/maya-qr.jpg',
    instructions:
      'Scan using Maya app. Transfer the exact amount and input your Reference Number below for Admin verification.',
    colorClass: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  },
};

// ─── WITHDRAWAL STATE ────────────────────────────────────────────────────────
const isWithdrawOpen = ref(false);
const withdrawAmount = ref<number>(500);
const withdrawMethod = ref<string>('GCash');
const withdrawAccountName = ref<string>('');
const withdrawAccountNumber = ref<string>('');

// Ledger Filter
const activeFilter = ref<string>('all');

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return walletStore.transactions;
  if (activeFilter.value === 'pending') {
    return walletStore.transactions.filter((tx) => tx.status === 'pending');
  }
  return walletStore.transactions.filter((tx) => tx.type === activeFilter.value);
});

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const copyToClipboard = (text: string, label: string) => {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text);
    walletStore.successMessage = `Copied ${label} to clipboard!`;
    setTimeout(() => {
      walletStore.successMessage = null;
    }, 2500);
  }
};

const getTxBadgeMeta = (tx: WalletTransactionItem) => {
  if (tx.status === 'pending') {
    return {
      label: tx.reference_type === 'paymongo_qrph' ? 'Awaiting QR Ph Scan' : 'Pending Admin Approval',
      icon: '⏳',
      sign: '⏳',
      colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
      amountClass: 'text-amber-400',
    };
  }

  switch (tx.type) {
    case 'top_up':
    case 'vault_credit_exchange':
      return {
        label: tx.type === 'top_up' ? 'Top-Up Credited' : 'Vault Buyback Credit',
        icon: '➕',
        sign: '+',
        colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        amountClass: 'text-emerald-400',
      };
    case 'bid_hold':
      return {
        label: 'Bid Escrow Hold',
        icon: '🔒',
        sign: '🔒',
        colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        amountClass: 'text-amber-300',
      };
    case 'bid_release':
      return {
        label: 'Outbid Escrow Release',
        icon: '🔓',
        sign: '+',
        colorClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        amountClass: 'text-cyan-300',
      };
    case 'auction_payment':
      return {
        label: 'Auction Settlement',
        icon: '🔨',
        sign: '-',
        colorClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        amountClass: 'text-rose-400',
      };
    case 'gacha_pull':
      return {
        label: 'Gacha Mystery Pull',
        icon: '✨',
        sign: '-',
        colorClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
        amountClass: 'text-rose-400',
      };
    case 'box_break_slot':
      return {
        label: 'Live Box Break Spot',
        icon: '📺',
        sign: '-',
        colorClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        amountClass: 'text-rose-400',
      };
    case 'preorder_payment':
      return {
        label: 'Pre-Order Allocation',
        icon: '📅',
        sign: '-',
        colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        amountClass: 'text-rose-400',
      };
    case 'withdrawal':
      return {
        label: 'Wallet Payout',
        icon: '🏦',
        sign: '-',
        colorClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        amountClass: 'text-rose-400',
      };
    case 'admin_adjustment':
    default:
      return {
        label: 'Admin Audit Adjustment',
        icon: '🛡️',
        sign: tx.balance_after >= tx.balance_before ? '+' : '-',
        colorClass: 'bg-slate-700/60 text-slate-200 border-slate-600',
        amountClass: tx.balance_after >= tx.balance_before ? 'text-emerald-400' : 'text-rose-400',
      };
  }
};

// ─── ACTION HANDLERS ─────────────────────────────────────────────────────────

// 1. PayMongo Dynamic QR Ph Generation & Live Polling
const isGeneratingDirectDebit = ref(false);

const handleStartDirectDebit = async (bank: 'bpi' | 'ubp') => {
  if (selectedTopUpAmount.value < 50) return;
  isGeneratingDirectDebit.value = true;
  try {
    const data = await walletStore.createDirectDebitTopUp(
      selectedTopUpAmount.value,
      bank,
      turnstileToken.value
    );
    if (data?.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      walletStore.successMessage = 'Direct Debit initialized! Please follow instructions.';
    }
  } catch (err: any) {
    walletStore.errorMessage = err.message || 'Failed to initiate Direct Debit.';
  } finally {
    isGeneratingDirectDebit.value = false;
  }
};

const handleStartQrPh = async () => {
  if (selectedTopUpAmount.value < 50) return;
  isGeneratingQrPh.value = true;
  stopQrPhPolling();

  try {
    const data = await walletStore.createQrPhTopUp(selectedTopUpAmount.value, turnstileToken.value);
    activeQrPhSession.value = data;
    qrSecondsRemaining.value = 1800;

    // Start timer countdown
    qrCountdownInterval = setInterval(() => {
      if (qrSecondsRemaining.value > 0) {
        qrSecondsRemaining.value--;
      } else {
        stopQrPhPolling();
      }
    }, 1000);

    // Start polling status every 3 seconds
    qrStatusPollTimer.value = setInterval(async () => {
      if (!activeQrPhSession.value?.payment_intent_id) return;
      const res = await walletStore.checkQrPhStatus(activeQrPhSession.value.payment_intent_id);
      if (res.status === 'completed') {
        stopQrPhPolling();
        activeQrPhSession.value = null;
        isTopUpOpen.value = false;
      }
    }, 3000);
  } catch {
    // Error handled in store
  } finally {
    isGeneratingQrPh.value = false;
  }
};

const stopQrPhPolling = () => {
  if (qrStatusPollTimer.value) {
    clearInterval(qrStatusPollTimer.value);
    qrStatusPollTimer.value = null;
  }
  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }
};

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// 2. Manual Proof File Select
const onProofFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      walletStore.errorMessage = 'Security validation failed: Only image receipts (JPEG, PNG, WEBP) are accepted.';
      input.value = '';
      manualProofFile.value = null;
      manualProofPreview.value = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      walletStore.errorMessage = 'File too large: Receipt image must be 5MB or smaller.';
      input.value = '';
      manualProofFile.value = null;
      manualProofPreview.value = null;
      return;
    }
    manualProofFile.value = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      manualProofPreview.value = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 3. Submit Manual Top-Up Request
const handleManualTopUpSubmit = async () => {
  if (selectedTopUpAmount.value < 50) return;
  if (!manualRefNumber.value.trim()) {
    walletStore.errorMessage = 'Please enter your transaction reference number from your bank or e-wallet.';
    return;
  }

  isSubmittingManual.value = true;
  try {
    const fd = new FormData();
    fd.append('amount', String(selectedTopUpAmount.value));
    fd.append('merchant', selectedChannel.value);
    fd.append('reference_number', manualRefNumber.value.trim());
    if (manualSenderName.value.trim()) {
      fd.append('sender_name', manualSenderName.value.trim());
    }
    if (manualProofFile.value) {
      fd.append('proof_image', manualProofFile.value);
    }

    await walletStore.submitManualTopUp(fd);
    manualRefNumber.value = '';
    manualSenderName.value = '';
    manualProofFile.value = null;
    manualProofPreview.value = null;
    isTopUpOpen.value = false;
  } catch {
    // Error handled in store
  } finally {
    isSubmittingManual.value = false;
  }
};

// 4. Withdrawal Handler
const handleWithdrawSubmit = async () => {
  if (!withdrawAccountName.value.trim() || !withdrawAccountNumber.value.trim()) return;
  try {
    await walletStore.requestWithdrawal({
      amount: withdrawAmount.value,
      payout_method: withdrawMethod.value,
      account_name: withdrawAccountName.value.trim(),
      account_number: withdrawAccountNumber.value.trim(),
    });
    isWithdrawOpen.value = false;
    withdrawAccountNumber.value = '';
  } catch {
    // Error handled in store
  }
};

onMounted(async () => {
  initQrCooldownFromStorage();
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to access and top up your collector digital wallet.');
  }
  await fetchActiveChannels();
  setTimeout(initTurnstile, 800);
  await walletStore.fetchWalletSummary();
  animateCounter(animatedAvailable, walletStore.walletBalance, 800);
  animateCounter(animatedHeld, walletStore.heldBalance, 800);
  animateCounter(animatedTotal, walletStore.totalEquity, 800);
  if (authStore.currentUser?.name) {
    withdrawAccountName.value = authStore.currentUser.name;
    manualSenderName.value = authStore.currentUser.name;
  }
});

watch(
  () => walletStore.walletBalance,
  (val) => {
    animateCounter(animatedAvailable, val, 400);
  }
);

watch(
  () => walletStore.heldBalance,
  (val) => {
    animateCounter(animatedHeld, val, 400);
  }
);

watch(
  () => walletStore.totalEquity,
  (val) => {
    animateCounter(animatedTotal, val, 400);
  }
);

onUnmounted(() => {
  stopQrPhPolling();
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1400px] w-full mx-auto space-y-8">
      <!-- Top Navigation Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
            <span>💳 RLG Vault Financial Ledger</span>
            <span>•</span>
            <span>Verified Payments &amp; Escrow</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Collector Digital Wallet &amp; Escrow Vault
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            @click="router.push('/raffles')"
          >
            <span>🎟️</span>
            <span>Live Slot Raffles</span>
          </button>
          <button
            type="button"
            class="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            @click="router.push('/gacha')"
          >
            <span>✨</span>
            <span>Gacha &amp; Box Breaks</span>
          </button>
          <button
            type="button"
            class="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            @click="router.push('/auctions')"
          >
            <span>🔨</span>
            <span>Live Auctions</span>
          </button>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
            @click="openTopUpModal"
          >
            <span>⚡ Top Up Wallet</span>
          </button>
        </div>
      </div>

      <!-- Status Feedback Banners -->
      <div
        v-if="walletStore.successMessage"
        class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between"
      >
        <span>✓ {{ walletStore.successMessage }}</span>
        <button type="button" class="text-emerald-300 hover:text-white cursor-pointer" @click="walletStore.successMessage = null">✕</button>
      </div>
      <div
        v-if="walletStore.errorMessage"
        class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between"
      >
        <span>⚠️ {{ walletStore.errorMessage }}</span>
        <button type="button" class="text-rose-300 hover:text-white cursor-pointer" @click="walletStore.errorMessage = null">✕</button>
      </div>

      <!-- HERO SECTION: DIGITAL CREDIT CARD + ESCROW BREAKDOWN -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Digital Collector Black/Gold Holographic Credit Card (7 cols) -->
        <div
          class="lg:col-span-7 relative rounded-3xl p-7 sm:p-8 overflow-hidden border border-white/15 shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-950 flex flex-col justify-between min-h-[270px] group"
        >
          <div class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl group-hover:bg-amber-400/30 transition-all duration-700"></div>
          <div class="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-fuchsia-500/15 blur-3xl"></div>
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_60%)]"></div>

          <!-- Card Top Row -->
          <div class="relative z-10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-1.5 shadow-inner border border-amber-100/50 flex flex-col justify-between">
                <div class="h-px bg-amber-900/40 w-full"></div>
                <div class="h-px bg-amber-900/40 w-full"></div>
                <div class="h-px bg-amber-900/40 w-full"></div>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  RLG HOBBY VAULT • BLACK EDITION
                </span>
                <span class="text-xs text-slate-300 font-semibold">
                  Verified QR Ph &amp; Direct Bank Transfer
                </span>
              </div>
            </div>

            <span class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-amber-300">
              {{ walletStore.cardNumberMasked }}
            </span>
          </div>

          <!-- Card Middle: Available Balance Display -->
          <div class="relative z-10 my-6">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Available Spendable Balance
            </span>
            <div class="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span class="text-amber-400">₱</span>
              <span>{{ formatCurrency(animatedAvailable) }}</span>
            </div>
          </div>

          <!-- Card Bottom Row: Cardholder + Action Controls -->
          <div class="relative z-10 flex items-end justify-between pt-4 border-t border-white/10">
            <div>
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 block">CARDHOLDER</span>
              <span class="text-sm font-bold text-white uppercase tracking-wider">
                {{ authStore.currentUser?.name || 'Collector Member' }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-amber-400/20"
                @click="openTopUpModal"
              >
                + Top Up
              </button>
              <button
                type="button"


              >

              </button>
            </div>
          </div>
        </div>

        <!-- Escrow & Security Status Breakdown (5 cols) -->
        <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <!-- Held Escrow Float Card -->
          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>🔒</span>
                <span>Bid Escrow Held</span>
              </span>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Pessimistic Lock
              </span>
            </div>
            <div class="my-3 text-3xl font-black font-mono text-amber-300">
              ₱{{ formatCurrency(animatedHeld) }}
            </div>
            <p class="text-[11px] text-slate-400">
              Allocated into active auction lots. Funds are automatically released back to available balance when outbid, or deducted upon winning.
            </p>
          </div>


          <!-- Total Equity & Instant Deposit Methods -->
          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>🛡️</span>
                <span>Total Portfolio Float</span>
              </span>
              <span class="text-[11px] font-mono text-emerald-400">100% Audited</span>
            </div>
            <div class="my-3 text-3xl font-black font-mono text-emerald-400">
              ₱{{ formatCurrency(animatedTotal) }}
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Methods:</span>
              <span class="font-bold text-slate-300">Instant QR Ph • MariBank • GoTyme • GCash • Maya</span>
            </div>
          </div>
          <div class="hidden">
            </div>

          <div>
            <button
              type="button"
              class="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              @click="openTopUpModal"
            >
              <span>⚡ Top Up Spendable Funds</span>
            </button>

          </div>
        </div>
      </div>

      <!-- LEDGER TRANSACTIONS SECTION -->
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black text-white flex items-center gap-2">
              <span>📜</span>
              <span>Ledger &amp; Financial Audit Trail</span>
            </h2>
            <p class="text-xs text-slate-400">



              Real-time audit trail of every top-up, auction bid hold, outbid release, gacha pull, and order payment.

            </p>
          </div>

          <!-- Filter Pills -->
          <div class="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
            <button

              v-for="filter in [
                { id: 'all', label: 'All Entries' },
                { id: 'pending', label: '⏳ Pending' },
                { id: 'top_up', label: 'Top-Ups' },
                { id: 'bid_hold', label: 'Holds' },
                { id: 'bid_release', label: 'Releases' },
                { id: 'gacha_pull', label: 'Gacha' },










              ]"
              :key="filter.id"
              type="button"
              class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              :class="
                activeFilter === filter.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              "
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Event Type / Status</th>
                <th class="py-3 px-4">Description / Reference</th>
                <th class="py-3 px-4 text-right">Amount</th>
                <th class="py-3 px-4 text-right">Available After</th>
                <th class="py-3 px-4 text-right">Held After</th>
                <th class="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-if="filteredTransactions.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400 font-sans">
                  No transactions found matching this filter.
                </td>
              </tr>
              <tr
                v-for="tx in filteredTransactions"
                :key="tx.id"
                class="hover:bg-slate-800/30 transition-colors font-sans"
              >
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold"
                    :class="getTxBadgeMeta(tx).colorClass"
                  >
                    <span>{{ getTxBadgeMeta(tx).icon }}</span>
                    <span>{{ getTxBadgeMeta(tx).label }}</span>
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <p class="font-bold text-slate-200">{{ tx.description || 'Wallet Ledger Entry' }}</p>
                  <span class="text-[10px] font-mono text-slate-400">
                    REF: {{ tx.reference_id || `TX-${tx.id}` }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right font-mono font-black whitespace-nowrap" :class="getTxBadgeMeta(tx).amountClass">
                  {{ getTxBadgeMeta(tx).sign }}₱{{ formatCurrency(tx.amount) }}
                </td>
                <td class="py-3.5 px-4 text-right font-mono text-slate-200 whitespace-nowrap">
                  ₱{{ formatCurrency(tx.balance_after) }}
                </td>
                <td class="py-3.5 px-4 text-right font-mono text-amber-300/90 whitespace-nowrap">
                  ₱{{ formatCurrency(tx.held_after) }}
                </td>
                <td class="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">
                  {{ new Date(tx.created_at).toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ─── SLIDE-IN TOP-UP MODAL ────────────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="isTopUpOpen"
        class="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
        @click="isTopUpOpen = false; stopQrPhPolling();"
      >
        <div
          class="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl"
          @click.stop
        >
          <div class="space-y-6">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Verified Deposit Gateway
                </span>
                <h3 class="text-xl font-black text-white">Top Up Collector Wallet</h3>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                @click="isTopUpOpen = false; stopQrPhPolling();"
              >
                ✕
              </button>
            </div>

            <!-- Amount Selection -->
            <div class="space-y-3">
              <label class="text-xs font-bold text-slate-300 block">Select Top-Up Amount (PHP)</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="amt in quickTopUpAmounts"
                  :key="amt"
                  type="button"
                  class="py-2.5 px-2 rounded-2xl border font-mono font-black text-xs transition-all cursor-pointer"
                  :class="
                    selectedTopUpAmount === amt
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  "
                  @click="selectedTopUpAmount = amt"
                >
                  ₱{{ amt.toLocaleString() }}
                </button>
              </div>

              <!-- Custom Amount -->
              <div class="relative mt-2">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-black text-amber-400">₱</span>
                <input
                  v-model.number="selectedTopUpAmount"
                  type="number"
                  min="50"
                  step="50"
                  placeholder="Enter custom amount..."
                  class="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <!-- Payment Method Channels -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-300 block">Choose Payment Method</label>

              <!-- Option 1: PayMongo QR Ph (Automated Instant) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['paymongo_qrph']"
                :class="[
                  selectedChannel === 'paymongo_qrph'
                    ? 'bg-indigo-950/70 border-amber-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['paymongo_qrph'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['paymongo_qrph']) { selectedChannel = 'paymongo_qrph'; activeQrPhSession = null; }"
              >
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-xl bg-white border border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                    <img src="/images/gateways/qrph-logo.png" alt="QR Ph" class="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span class="block text-white font-black">Instant Dynamic QR Ph</span>
                    <span class="text-[10px] text-amber-300 font-medium">
                      Instant Automated Crediting (GCash, Maya, ShopeePay, Banks)
                    </span>
                  </div>
                </div>
                <span v-if="selectedChannel === 'paymongo_qrph'" class="text-amber-400 font-bold">●</span>
              </button>

              <!-- Option 1b: BPI Direct Debit (PayMongo) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['paymongo_bpi']"
                :class="[
                  selectedChannel === 'paymongo_bpi'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['paymongo_bpi'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['paymongo_bpi']) { selectedChannel = 'paymongo_bpi'; activeQrPhSession = null; stopQrPhPolling(); }"
              >
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                    <img src="/images/gateways/bpi-logo.png" alt="BPI" class="h-full w-full object-contain rounded" />
                  </div>
                  <div>
                    <span class="block text-white font-black">BPI Direct Debit</span>
                    <span class="text-[10px] text-rose-300 font-medium">
                      Direct Online Banking (Instant Automated Crediting)
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">Direct Debit</span>
                  <span v-if="selectedChannel === 'paymongo_bpi'" class="text-rose-400 font-bold">●</span>
                </div>
              </button>

              <!-- Option 1c: UnionBank Direct Debit (PayMongo) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['paymongo_ubp']"
                :class="[
                  selectedChannel === 'paymongo_ubp'
                    ? 'bg-orange-950/40 border-orange-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['paymongo_ubp'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['paymongo_ubp']) { selectedChannel = 'paymongo_ubp'; activeQrPhSession = null; stopQrPhPolling(); }"
              >
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-xl bg-orange-950/60 border border-orange-500/40 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                    <img src="/images/gateways/ubp-logo.png" alt="UnionBank" class="h-full w-full object-contain rounded" />
                  </div>
                  <div>
                    <span class="block text-white font-black">UnionBank Direct Debit</span>
                    <span class="text-[10px] text-orange-300 font-medium">
                      Direct Online Banking (Instant Automated Crediting)
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">Direct Debit</span>
                  <span v-if="selectedChannel === 'paymongo_ubp'" class="text-orange-400 font-bold">●</span>
                </div>
              </button>

              <!-- Option 2: MariBank Direct QR (Manual) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['maribank']"
                :class="[
                  selectedChannel === 'maribank'
                    ? 'bg-orange-950/40 border-orange-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['maribank'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['maribank']) { selectedChannel = 'maribank'; stopQrPhPolling(); instructionEmailSent = false; }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">🏦</span>
                  <div>
                    <span class="block text-white font-black">MariBank QR Transfer</span>
                    <span class="text-[10px] text-orange-300 font-medium">Direct Transfer (Requires Admin Approval)</span>
                  </div>
                </div>
                <span v-if="selectedChannel === 'maribank'" class="text-orange-400 font-bold">●</span>
              </button>

              <!-- Option 3: GoTyme Bank (Manual) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['gotyme']"
                :class="[
                  selectedChannel === 'gotyme'
                    ? 'bg-teal-950/40 border-teal-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['gotyme'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['gotyme']) { selectedChannel = 'gotyme'; stopQrPhPolling(); instructionEmailSent = false; }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">💳</span>
                  <div>
                    <span class="block text-white font-black">GoTyme Bank QR</span>
                    <span class="text-[10px] text-teal-300 font-medium">Direct Transfer (Requires Admin Approval)</span>
                  </div>
                </div>
                <span v-if="selectedChannel === 'gotyme'" class="text-teal-400 font-bold">●</span>
              </button>

              <!-- Option 4: GCash QR (Manual) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['gcash']"
                :class="[
                  selectedChannel === 'gcash'
                    ? 'bg-sky-950/40 border-sky-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['gcash'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['gcash']) { selectedChannel = 'gcash'; stopQrPhPolling(); instructionEmailSent = false; }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">📱</span>
                  <div>
                    <span class="block text-white font-black">GCash QR Transfer</span>
                    <span class="text-[10px] text-sky-300 font-medium">Direct Transfer (Requires Admin Approval)</span>
                  </div>
                </div>
                <span v-if="selectedChannel === 'gcash'" class="text-sky-400 font-bold">●</span>
              </button>

              <!-- Option 5: Maya QR (Manual) -->
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                :disabled="!activeChannelsMap['maya']"
                :class="[
                  selectedChannel === 'maya'
                    ? 'bg-emerald-950/40 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700',
                  !activeChannelsMap['maya'] ? 'opacity-40 cursor-not-allowed grayscale' : ''
                ]"
                @click="if (activeChannelsMap['maya']) { selectedChannel = 'maya'; stopQrPhPolling(); instructionEmailSent = false; }"
              >
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">🟣</span>
                  <div>
                    <span class="block text-white font-black">Maya QR Transfer</span>
                    <span class="text-[10px] text-emerald-300 font-medium">Direct Transfer (Requires Admin Approval)</span>
                  </div>
                </div>
                <span v-if="selectedChannel === 'maya'" class="text-emerald-400 font-bold">●</span>
              </button>
            </div>

            <!-- ─── SUB-SECTION A: PAYMONGO DYNAMIC QR PH DISPLAY ────────────── -->
            <div v-if="selectedChannel === 'paymongo_qrph'" class="space-y-4 pt-2">
              <div v-if="!activeQrPhSession" class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <span>⚡ Instant Automated Flow:</span>
                </div>
                <p class="text-xs text-slate-300">
                  When you click below, a real-time QR Ph code will be generated. Scan with GCash, Maya, ShopeePay, or any PH bank.
                  <span class="text-amber-300 font-bold block mt-1">
                    Your wallet is credited automatically once payment is verified.
                  </span>
                </p>
                <button
                  type="button"
                  :disabled="isGeneratingQrPh || selectedTopUpAmount < 50"
                  class="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  @click="handleStartQrPh"
                >
                  <span v-if="isGeneratingQrPh">Generating QR Ph Code...</span>
                  <span v-else>Generate QR Ph Code (₱{{ formatCurrency(selectedTopUpAmount) }})</span>
                </button>
              </div>

              <!-- Active QR Ph Code Display -->
              <div v-else class="p-5 rounded-2xl bg-slate-950 border border-amber-400/50 space-y-4 text-center">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono text-amber-300 font-bold">REF: {{ activeQrPhSession.order_number }}</span>
                  <span class="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[11px] animate-pulse">
                    Expires in {{ formatSeconds(qrSecondsRemaining) }}
                  </span>
                </div>

                <div class="p-3 bg-white rounded-2xl inline-block shadow-2xl mx-auto">
                  <img
                    :src="activeQrPhSession.qr_image_url || '/images/qr/qrph-logo.png'"
                    alt="Dynamic QR Ph"
                    class="w-56 h-56 object-contain mx-auto"
                  />
                </div>

                <div class="space-y-1">
                  <p class="text-xs font-black text-white">Amount to Pay: ₱{{ formatCurrency(activeQrPhSession.amount) }}</p>
                  <p class="text-[11px] text-slate-400">
                    Scan using your bank or e-wallet app. This page will automatically update once verified.
                  </p>
                </div>

                <div class="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
                  <div class="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
                  <span>Listening for payment confirmation...</span>
                </div>
              </div>
            </div>

            <!-- ─── SUB-SECTION B: PAYMONGO DIRECT DEBIT (BPI / UNIONBANK) ───── -->
            <div v-else-if="selectedChannel === 'paymongo_bpi' || selectedChannel === 'paymongo_ubp'" class="space-y-4 pt-2">
              <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div class="flex items-center gap-3">
                    <div v-if="selectedChannel === 'paymongo_bpi'" class="h-10 px-2 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0">
                      <img src="/images/gateways/bpi-logo.png" alt="BPI" class="h-7 w-auto object-contain rounded" />
                    </div>
                    <div v-else class="h-10 w-10 rounded-xl bg-orange-950/60 border border-orange-500/40 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                      <img src="/images/gateways/ubp-logo.png" alt="UnionBank" class="h-full w-full object-contain rounded" />
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-white">
                        {{ selectedChannel === 'paymongo_bpi' ? 'BPI Online Direct Debit' : 'UnionBank Online Direct Debit' }}
                      </h4>
                      <p class="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                        <span>⚡</span>
                        <span>Instant Automated Crediting</span>
                      </p>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300 font-bold">
                    Amount: ₱{{ selectedTopUpAmount.toLocaleString('en-PH') }}
                  </span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <p class="text-xs text-slate-300 leading-relaxed">
                    You will be securely redirected to the official
                    <strong class="text-white">{{ selectedChannel === 'paymongo_bpi' ? 'BPI Online Banking' : 'UnionBank Online' }}</strong>
                    secure banking portal to authorize this direct debit transfer of
                    <strong class="text-amber-400">₱{{ formatCurrency(selectedTopUpAmount) }}</strong>.
                  </p>
                  <ul class="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>No manual receipt upload or admin approval needed.</li>
                    <li>Funds are credited to your Collector Wallet balance immediately upon bank OTP confirmation.</li>
                    <li>Safe and encrypted with official Bangko Sentral ng Pilipinas (BSP) banking standards.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  :disabled="isGeneratingDirectDebit || selectedTopUpAmount < 50"
                  class="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  @click="handleStartDirectDebit(selectedChannel === 'paymongo_bpi' ? 'bpi' : 'ubp')"
                >
                  <span v-if="isGeneratingDirectDebit">Initializing Secure Bank Gateway...</span>
                  <span v-else>
                    Authorize {{ selectedChannel === 'paymongo_bpi' ? 'BPI' : 'UnionBank' }} Direct Debit (₱{{ formatCurrency(selectedTopUpAmount) }}) →
                  </span>
                </button>
              </div>
            </div>

            <!-- ─── SUB-SECTION C: MANUAL QR DETAILS & RECEIPT UPLOAD ─────────── -->
            <div v-else class="space-y-4 pt-2">
              <div
                class="p-4 rounded-2xl border space-y-4"
                :class="manualMerchants[selectedChannel]?.colorClass"
              >
                <!-- Merchant Header & Account Details -->
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span class="text-[10px] font-black uppercase tracking-wider block">
                      {{ manualMerchants[selectedChannel]?.badge }}
                    </span>
                    <h4 class="text-sm font-black text-white">
                      {{ manualMerchants[selectedChannel]?.name }}
                    </h4>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300 font-bold">
                    Amount: ₱{{ selectedTopUpAmount.toLocaleString('en-PH') }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Account Name</span>
                    <div class="flex items-center justify-between gap-1.5 mt-0.5">
                      <span class="font-bold text-white truncate">{{ manualMerchants[selectedChannel]?.account_name }}</span>
                      <button
                        type="button"
                        class="text-[10px] text-amber-300 hover:text-white underline cursor-pointer shrink-0 font-bold"
                        @click="copyToClipboard(manualMerchants[selectedChannel]?.account_name, 'Account Name')"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Account / Mobile</span>
                    <div class="flex items-center justify-between gap-1.5 mt-0.5">
                      <span class="font-mono font-bold text-white truncate">{{ manualMerchants[selectedChannel]?.account_number }}</span>
                      <button
                        type="button"
                        class="text-[10px] text-amber-300 hover:text-white underline cursor-pointer shrink-0 font-bold"
                        @click="copyToClipboard(manualMerchants[selectedChannel]?.account_number, 'Account Number')"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Email Instructions Push Card (Sent to user email instead of displaying QR on screen) -->
                <div class="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                      <span>📧</span>
                    </div>
                    <div class="space-y-0.5 text-xs">
                      <h5 class="font-black text-white">Official QR Code &amp; Payment Instructions</h5>
                      <p class="text-[11px] text-slate-300">
                        To protect payment security, the official static QR code and payment steps will be sent directly to your email:
                        <strong class="text-amber-300 font-mono">{{ authStore.currentUser?.email || 'your account email' }}</strong>.
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      :disabled="isSendingInstructions || qrEmailCooldown > 0"
                      class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                      :class="
                        qrEmailCooldown > 0
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                          : instructionEmailSent
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md cursor-pointer'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md cursor-pointer'
                      "
                      @click="handleSendInstructions"
                    >
                      <span v-if="isSendingInstructions" class="animate-spin">🌀</span>
                      <span v-else-if="qrEmailCooldown > 0">⏳</span>
                      <span v-else>{{ instructionEmailSent ? '✓' : '📨' }}</span>
                      <span>
                        {{
                          isSendingInstructions
                            ? 'Sending Instructions...'
                            : qrEmailCooldown > 0
                              ? `Email Sent! Resend in ${Math.floor(qrEmailCooldown / 60)}:${String(qrEmailCooldown % 60).padStart(2, '0')}`
                              : instructionEmailSent
                                ? 'Email Sent! Click to Resend'
                                : 'Email Me Payment QR & Instructions'
                        }}
                      </span>
                    </button>

                    <span v-if="instructionEmailSent" class="text-[10px] text-emerald-400 font-bold">
                      ✓ Check your inbox for the attached QR!
                    </span>
                  </div>
                </div>

                <p class="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Next Step:</strong> Open your {{ manualMerchants[selectedChannel]?.name }} app, complete the transfer using the emailed QR or account above, then enter the Reference Number and upload the receipt screenshot below.
                </p>
              </div>

              <!-- Form Inputs for Reference ID and Proof -->
              <div class="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label class="text-xs font-bold text-slate-300 block mb-1">
                    Transaction Reference No. <span class="text-rose-400">*</span>
                  </label>
                  <input
                    id="manual-ref-input"
                    v-model="manualRefNumber"
                    type="text"
                    placeholder="e.g. 1002948192018 or Ref ID"
                    class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-300 block mb-1">
                    Sender Account Name / Mobile (Optional)
                  </label>
                  <input
                    v-model="manualSenderName"
                    type="text"
                    placeholder="Name appearing on your receipt"
                    class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-300 block mb-1">
                    Upload Payment Receipt / Proof Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                    @change="onProofFileChange"
                  />
                  <div v-if="manualProofPreview" class="mt-2">
                    <img :src="manualProofPreview" alt="Receipt Preview" class="h-24 rounded-lg object-contain border border-slate-700" />
                  </div>
                </div>

                <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  ⚠️ Note: Manual transfers must be verified and approved by our admin team before balance is added.
                </div>

                <button
                  type="button"
                  :disabled="isSubmittingManual || !manualRefNumber.trim() || selectedTopUpAmount < 50"
                  class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  @click="handleManualTopUpSubmit"
                >
                  <span v-if="isSubmittingManual">Submitting for Verification...</span>
                  <span v-else>Submit Manual Top-Up (₱{{ formatCurrency(selectedTopUpAmount) }})</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Total Preview -->
          <div class="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-400">Balance After Approval:</span>
            <span class="font-mono font-black text-emerald-400">
              ₱{{ formatCurrency(walletStore.walletBalance + (selectedTopUpAmount || 0)) }}
            </span>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── SLIDE-IN WITHDRAWAL MODAL ────────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="isWithdrawOpen"
        class="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
        @click="isWithdrawOpen = false"
      >
        <div
          class="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl"
          @click.stop
        >
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">Secure Vault Payout</span>
                <h3 class="text-xl font-black text-white">Request Wallet Payout</h3>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                @click="isWithdrawOpen = false"
              >
                ✕
              </button>
            </div>

            <!-- Available Balance Note -->
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span class="text-xs text-slate-400">Available to Withdraw:</span>
              <span class="text-sm font-mono font-black text-white">
                ₱{{ formatCurrency(walletStore.walletBalance) }}
              </span>
            </div>

            <!-- Amount Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 block">Payout Amount (PHP)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-black text-amber-400">₱</span>
                <input
                  v-model.number="withdrawAmount"
                  type="number"
                  min="100"
                  :max="walletStore.walletBalance"
                  class="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <!-- Payout Method -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 block">Destination Channel</label>
              <select
                v-model="withdrawMethod"
                class="w-full p-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="MariBank">MariBank Philippines</option>
                <option value="GoTyme Bank">GoTyme Bank</option>
                <option value="BDO Unibank">BDO Unibank</option>
                <option value="BPI">BPI (Bank of the Philippine Islands)</option>
                <option value="UnionBank">UnionBank of the Philippines</option>
              </select>
            </div>

            <!-- Account Details -->
            <div class="space-y-3">
              <div>
                <label class="text-xs font-bold text-slate-300 block mb-1">Account Holder Full Name</label>
                <input
                  v-model="withdrawAccountName"
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label class="text-xs font-bold text-slate-300 block mb-1">Account / Mobile Number</label>
                <input
                  v-model="withdrawAccountNumber"
                  type="text"
                  placeholder="e.g. 0917XXXXXXX or Bank Account No"
                  class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
              💡 Payout requests are placed in escrow immediately and disbursed by our finance team via InstaPay/PESONet within 24 business hours.
            </div>
          </div>

          <div class="pt-6 border-t border-slate-800">
            <button
              type="button"
              :disabled="
                walletStore.isSubmitting ||
                withdrawAmount < 100 ||
                withdrawAmount > walletStore.walletBalance ||
                !withdrawAccountName.trim() ||
                !withdrawAccountNumber.trim()
              "
              class="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              @click="handleWithdrawSubmit"
            >
              <span v-if="walletStore.isSubmitting">Submitting Request...</span>
              <span v-else>Confirm Payout Request (₱{{ formatCurrency(withdrawAmount) }})</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>



    <!-- WITHDRAWAL REQUEST MODAL REMOVED -->
    <teleport to="body">
      <div
        v-if="false"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        @click="isWithdrawOpen = false"
      >
        <div
          class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-black text-white">Request Wallet Payout</h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="isWithdrawOpen = false">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold text-slate-300 block mb-1">Withdrawal Amount (Available: ₱{{ formatCurrency(walletStore.walletBalance) }})</label>
              <input
                v-model.number="withdrawAmount"
                type="number"
                min="100"
                :max="walletStore.walletBalance"
                class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
              />
            </div>

            <div>
              <label class="font-bold text-slate-300 block mb-1">Payout Destination</label>
              <select
                v-model="withdrawMethod"
                class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              >
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="BPI">BPI Bank Transfer</option>
                <option value="BDO">BDO Bank Transfer</option>
                <option value="UnionBank">UnionBank</option>
              </select>
            </div>

            <div>
              <label class="font-bold text-slate-300 block mb-1">Account Holder Name</label>
              <input
                v-model="withdrawAccountName"
                type="text"
                placeholder="Juan Dela Cruz"
                class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label class="font-bold text-slate-300 block mb-1">Account / Mobile Number</label>
              <input
                v-model="withdrawAccountNumber"
                type="text"
                placeholder="0917XXXXXXX"
                class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <button
            type="button"
            :disabled="walletStore.isSubmitting || withdrawAmount < 100"
            class="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
            @click="handleWithdrawSubmit"
          >
            {{ walletStore.isSubmitting ? 'Submitting...' : `Submit ₱${formatCurrency(withdrawAmount)} Withdrawal Request` }}
          </button>
        </div>
      </div>
    </teleport>

    <!-- OFFICIAL QR CODE & PAYMENT INSTRUCTIONS POPUP MODAL -->
    <teleport to="body">
      <div
        v-if="isQrModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
        @click="isQrModalOpen = false"
      >
        <div
          class="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📱</span>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  {{ manualMerchants[selectedChannel]?.badge || 'Official Payment QR' }}
                </span>
                <h3 class="text-lg font-black text-white">
                  {{ manualMerchants[selectedChannel]?.name }} Instructions
                </h3>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              @click="isQrModalOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Email Sent Confirmation Banner -->
          <div class="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs">
            <span class="text-emerald-400 text-base font-black">✓</span>
            <div class="space-y-0.5 text-emerald-300">
              <p class="font-bold">Instructions &amp; QR code also sent to your email!</p>
              <p class="text-[11px] text-emerald-400/80">
                A copy was sent to <strong class="text-white">{{ authStore.currentUser?.email || 'your account email' }}</strong>. You can scan and transfer right here without leaving this page.
              </p>
            </div>
          </div>

          <!-- QR Code Display Card -->
          <div class="text-center p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div class="inline-block p-3.5 bg-white rounded-2xl shadow-2xl mx-auto border-2 border-amber-400/50">
              <img
                :src="manualMerchants[selectedChannel]?.qr_image"
                :alt="`${manualMerchants[selectedChannel]?.name} QR Code`"
                class="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
              />
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top-Up Amount to Pay</div>
              <div class="text-2xl font-black font-mono text-amber-300">
                ₱{{ formatCurrency(selectedTopUpAmount) }}
              </div>
            </div>
          </div>

          <!-- Account Details with Copy Buttons -->
          <div class="space-y-2.5 bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl text-xs">
            <div class="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Account Name:</span>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white truncate max-w-[200px]">{{ manualMerchants[selectedChannel]?.account_name }}</span>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors"
                  @click="copyToClipboard(manualMerchants[selectedChannel]?.account_name, 'Account Name')"
                >
                  Copy
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Account / Mobile No:</span>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-white">{{ manualMerchants[selectedChannel]?.account_number }}</span>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors"
                  @click="copyToClipboard(manualMerchants[selectedChannel]?.account_number, 'Account Number')"
                >
                  Copy
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-slate-400">Exact Amount:</span>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-amber-400">₱{{ formatCurrency(selectedTopUpAmount) }}</span>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors"
                  @click="copyToClipboard(selectedTopUpAmount.toString(), 'Amount')"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- Step Instructions -->
          <div class="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px] space-y-1">
            <p class="font-bold">Transfer Guide:</p>
            <ol class="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Open your <strong>{{ manualMerchants[selectedChannel]?.name }}</strong> app and scan the QR code above (or send to the account number).</li>
              <li>Transfer the exact amount of <strong class="text-amber-400 font-mono">₱{{ formatCurrency(selectedTopUpAmount) }}</strong>.</li>
              <li>Take a screenshot of the completed transfer receipt.</li>
              <li>Close this modal and submit the Reference Number and receipt screenshot below for manual verification.</li>
            </ol>
          </div>

          <!-- Action Button -->
          <button
            type="button"
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all"
            @click="closeQrModalAndFocusForm"
          >
            I Have Sent Payment → Enter Reference ID &amp; Upload Proof
          </button>
        </div>
      </div>
    </teleport>

  </main>
</template>
