import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { resolveApiUrl } from '@/shared/utils/api';
import { useAuthStore } from '@/modules/auth/auth.store';

export interface WalletTransactionItem {
  id: number;
  user_id: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  held_before: number;
  held_after: number;
  type:
    | 'top_up'
    | 'bid_hold'
    | 'bid_release'
    | 'auction_payment'
    | 'gacha_pull'
    | 'box_break_slot'
    | 'preorder_payment'
    | 'withdrawal'
    | 'admin_adjustment'
    | 'vault_credit_exchange';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference_type?: string | null;
  reference_id?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface WithdrawalRequestItem {
  id: number;
  user_id: number;
  amount: number;
  payout_method: string;
  account_name: string;
  account_number: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export const useWalletStore = defineStore('wallet', () => {
  const authStore = useAuthStore();

  const walletBalance = ref<number>(0);
  const heldBalance = ref<number>(0);
  const totalEquity = ref<number>(0);
  const cardNumberMasked = ref<string>('4892 •••• •••• 1024');

  const transactions = ref<WalletTransactionItem[]>([]);
  const withdrawals = ref<WithdrawalRequestItem[]>([]);

  const isLoading = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token =
      authStore.token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('rlg_sanctum_token') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token')
        : null);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (authStore.isAuthenticated && authStore.currentUser) {
      if (authStore.currentUser.id && authStore.currentUser.email !== 'collector@rlgshop.local') {
        headers['X-User-Id'] = String(authStore.currentUser.id);
      }
      if (authStore.currentUser.email && authStore.currentUser.email !== 'collector@rlgshop.local') {
        headers['X-User-Email'] = String(authStore.currentUser.email);
      }
    }
    return headers;
  };

  const fetchWalletSummary = async () => {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet'), {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        walletBalance.value = Number(json.data.wallet_balance || 0);
        heldBalance.value = Number(json.data.held_balance || 0);
        totalEquity.value = Number(json.data.total_equity || 0);
        cardNumberMasked.value = json.data.card_number_masked || '4892 •••• •••• 1024';
        transactions.value = (json.data.transactions || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount || 0),
          balance_before: Number(t.balance_before || 0),
          balance_after: Number(t.balance_after || 0),
          held_before: Number(t.held_before || 0),
          held_after: Number(t.held_after || 0),
        }));
        withdrawals.value = (json.data.withdrawals || []).map((w: any) => ({
          ...w,
          amount: Number(w.amount || 0),
        }));
      }
    } catch (e: any) {
      errorMessage.value = e.message || 'Unable to load wallet ledger.';
    } finally {
      isLoading.value = false;
    }
  };

  const topUpWallet = async (amount: number, paymentMethod = 'QR Ph / GCash') => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/top-up'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount,
          payment_method: paymentMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to top up wallet.');
      }
      walletBalance.value = Number(json.data.wallet_balance || 0);
      heldBalance.value = Number(json.data.held_balance || 0);
      totalEquity.value = walletBalance.value + heldBalance.value;
      successMessage.value = json.message;
      await fetchWalletSummary();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Top-up failed.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

    const createDirectDebitTopUp = async (amount: number, bank: 'bpi' | 'ubp', turnstileToken?: string) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/top-up/initiate'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount,
          payment_method: bank === 'ubp' ? 'paymongo_ubp' : 'paymongo_bpi',
          turnstile_token: turnstileToken,
          email: authStore.currentUser?.email,
          user_id: authStore.currentUser?.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to initialize ${bank.toUpperCase()} Direct Debit.`);
      }
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || `Failed to initialize ${bank.toUpperCase()} Direct Debit.`;
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const createQrPhTopUp = async (amount: number, turnstileToken?: string) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/top-up/qrph'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, turnstile_token: turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to generate QR Ph code.');
      }
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Failed to generate QR Ph.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const checkQrPhStatus = async (intentId: string) => {
    try {
      const res = await fetch(resolveApiUrl(`/wallet/top-up/status/${intentId}`), {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.status === 'completed') {
        walletBalance.value = Number(json.data?.wallet_balance ?? walletBalance.value);
        heldBalance.value = Number(json.data?.held_balance ?? heldBalance.value);
        totalEquity.value = walletBalance.value + heldBalance.value;
        successMessage.value = json.message || 'Payment confirmed and credited to your wallet!';
        await fetchWalletSummary();
      }
      return json;
    } catch (e: any) {
      return { success: false, status: 'error', message: e.message };
    }
  };

  const submitManualTopUp = async (formData: FormData) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      if (authStore.currentUser?.id) {
        headers['X-User-Id'] = String(authStore.currentUser.id);
      }

      const res = await fetch(resolveApiUrl('/wallet/top-up/manual'), {
        method: 'POST',
        headers,
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit manual top-up request.');
      }
      successMessage.value = json.message;
      await fetchWalletSummary();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Manual top-up request failed.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const initiateTopup = async (payload: {
    amount: number;
    payment_method: string;
    turnstile_token?: string;
  }) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/top-up/initiate'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to initiate top-up.');
      }
      successMessage.value = json.message;
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Top-up initiation failed.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const sendPaymentInstructions = async (channel: string, amount: number) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/top-up/send-instructions'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          channel,
          amount,
          email: authStore.currentUser?.email,
          user_id: authStore.currentUser?.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to send payment instructions.');
      }
      successMessage.value = json.message;
      return json;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not send instructions to email.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const requestWithdrawal = async (payload: {
    amount: number;
    payout_method: string;
    account_name: string;
    account_number: string;
  }) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl('/wallet/withdraw'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg =
          json.errors?.wallet?.[0] ||
          json.errors?.amount?.[0] ||
          json.message ||
          'Failed to submit withdrawal.';
        throw new Error(msg);
      }
      walletBalance.value = Number(json.data.wallet_balance || 0);
      heldBalance.value = Number(json.data.held_balance || 0);
      totalEquity.value = walletBalance.value + heldBalance.value;
      successMessage.value = json.message;
      await fetchWalletSummary();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Withdrawal request failed.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const availableBalance = computed(() => {
    if (!authStore.isAuthenticated) return 0;
    return walletBalance.value;
  });

  const spendableBalance = computed(() => {
    return availableBalance.value;
  });

  const resetWallet = () => {
    walletBalance.value = 0;
    heldBalance.value = 0;
    totalEquity.value = 0;
    cardNumberMasked.value = '4892 •••• •••• 1024';
    transactions.value = [];
    withdrawals.value = [];
    errorMessage.value = null;
    successMessage.value = null;
  };

  return {
    walletBalance,
    availableBalance,
    spendableBalance,
    resetWallet,
    heldBalance,
    totalEquity,
    cardNumberMasked,
    transactions,
    withdrawals,
    isLoading,
    isSubmitting,
    errorMessage,
    successMessage,
    fetchWalletSummary,
    fetchWallet: fetchWalletSummary,
    topUpWallet,
    initiateTopup,
    createQrPhTopUp,
    createDirectDebitTopUp,
    checkQrPhStatus,
    submitManualTopUp,
    sendPaymentInstructions,
    requestWithdrawal,
  };
});
