import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  AuctionDetail,
  AuctionListItem,
  BidRecord,
  CustomerBiddingPaymentRecord,
  UserBidSummaryItem,
} from './types';
import { useAuthStore } from '../auth/auth.store';
import { resolveApiUrl } from '@/shared/utils/api';

declare global {
  interface Window {
    Echo?: any;
  }
}

export const useAuctionStore = defineStore('auction', () => {
  const authStore = useAuthStore();

  const auctions = ref<AuctionListItem[]>([]);
  const auction = ref<AuctionDetail | null>(null);
  const bids = ref<BidRecord[]>([]);
  const currentUserBidStatus = ref<'winning' | 'outbid' | 'none'>('none');
  const userProxyBid = ref<AuctionDetail['userProxyBid']>(null);

  // User Dashboard State
  const userFavorites = ref<AuctionListItem[]>([]);
  const userBidsList = ref<UserBidSummaryItem[]>([]);
  const userWonPayments = ref<CustomerBiddingPaymentRecord[]>([]);

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  let activeEchoChannel: any = null;
  let pollInterval: any = null;

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    if (authStore.currentUser?.id) {
      headers['X-User-Id'] = String(authStore.currentUser.id);
    }
    return headers;
  };

  /**
   * Fetch list of auctions
   */
  const fetchAuctions = async (status = 'all') => {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl(`/auctions?status=${status}`), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        auctions.value = json.data;
      }
    } catch (e: any) {
      console.error('Failed to load auctions', e);
      errorMessage.value = e.message || 'Failed to load auctions.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch single auction details with current bid ledger and user status
   */
  const fetchAuction = async (id: number | string) => {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl(`/auctions/${id}`), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        auction.value = json.data;
        bids.value = json.data.bids || [];
        currentUserBidStatus.value = json.data.currentUserBidStatus || 'none';
        userProxyBid.value = json.data.userProxyBid || null;
      } else {
        throw new Error(json.message || 'Auction not found');
      }
    } catch (e: any) {
      console.error('Failed to load auction detail', e);
      errorMessage.value = e.message || 'Failed to load auction.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Real-time listener using Laravel Echo with smart fallback
   */
  const listenForBids = (auctionId: number | string) => {
    stopListeningForBids();

    // 1. Try Laravel Echo WebSocket if configured
    if (typeof window !== 'undefined' && window.Echo) {
      try {
        const channelName = `auction.${auctionId}`;
        activeEchoChannel = window.Echo.channel(channelName);

        activeEchoChannel.listen('.BidPlaced', (data: any) => {
          handleIncomingBid(data);
        });

        activeEchoChannel.listen('BidPlaced', (data: any) => {
          handleIncomingBid(data);
        });
      } catch (err) {
        console.warn('Echo listener setup warning:', err);
      }
    }

    // 2. Poll fallback (every 3 seconds) for guaranteed synchronization
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auctions/${auctionId}`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success && json.data && auction.value) {
          // If price changed or new bids exist, sync smoothly
          if (
            json.data.current_price !== auction.value.current_price ||
            json.data.bids.length !== bids.value.length ||
            json.data.end_time !== auction.value.end_time
          ) {
            auction.value.current_price = json.data.current_price;
            auction.value.min_next_bid = json.data.min_next_bid;
            auction.value.end_time = json.data.end_time;
            auction.value.status = json.data.status;
            auction.value.is_ended = json.data.is_ended;
            bids.value = json.data.bids;
            currentUserBidStatus.value = json.data.currentUserBidStatus;
            userProxyBid.value = json.data.userProxyBid;
          }
        }
      } catch {
        // silent poll failure
      }
    }, 3000);
  };

  const handleIncomingBid = (data: any) => {
    if (!auction.value || data.auction_id !== auction.value.id) return;

    auction.value.current_price = data.current_price;
    auction.value.min_next_bid = data.min_next_bid;
    auction.value.end_time = data.end_time;

    if (data.bid) {
      // Avoid duplicate entry if poll or echo already received it
      const exists = bids.value.some((b) => b.id === data.bid.id);
      if (!exists) {
        bids.value.unshift(data.bid);
      }

      // Update current user bid status
      if (authStore.currentUser?.id) {
        if (data.bid.user_id === authStore.currentUser.id) {
          currentUserBidStatus.value = 'winning';
        } else if (bids.value.some((b) => b.user_id === authStore.currentUser?.id)) {
          currentUserBidStatus.value = 'outbid';
        }
      }
    }
  };

  const stopListeningForBids = () => {
    if (activeEchoChannel && typeof window !== 'undefined' && window.Echo) {
      try {
        window.Echo.leaveChannel(`auction.${auction.value?.id}`);
      } catch {}
      activeEchoChannel = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  /**
   * Option A: Quick Bid (Manual) at current_price + 50
   */
  const placeQuickBid = async (auctionId: number | string, customAmount?: number) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    const amount = customAmount ?? auction.value?.min_next_bid ?? (auction.value ? auction.value.current_price + 50 : 50);

    try {
      const res = await fetch(resolveApiUrl(`/auctions/${auctionId}/bid`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorMsg = json.errors?.amount?.[0] || json.message || 'Failed to place bid.';
        throw new Error(errorMsg);
      }

      successMessage.value = `Bid of ₱${amount.toLocaleString()} placed successfully!`;

      // Immediately refresh/sync state
      await fetchAuction(auctionId);
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not place bid.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Option B: Auto-Bid (Proxy) up to max_amount
   */
  const setProxyBid = async (auctionId: number | string, maxAmount: number) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      const res = await fetch(resolveApiUrl(`/auctions/${auctionId}/proxy-bid`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ max_amount: maxAmount }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorMsg = json.errors?.max_amount?.[0] || json.message || 'Failed to set proxy bid.';
        throw new Error(errorMsg);
      }

      successMessage.value = `Proxy limit of ₱${maxAmount.toLocaleString()} active! The system will bid on your behalf.`;

      await fetchAuction(auctionId);
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not configure auto-bid.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Admin: Create a new auction
   */
  const buyItNow = async (auctionId: number | string) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl(`/auctions/${auctionId}/buy-now`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = json.errors?.buy_it_now?.[0] || json.errors?.wallet?.[0] || json.message || 'Buy It Now failed.';
        throw new Error(msg);
      }
      successMessage.value = json.message || 'Congratulations! You won this lot instantly via Buy It Now!';
      await fetchAuction(auctionId);
      await fetchAuctions();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not execute Buy It Now.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const adminCancelBid = async (auctionId: number | string, bidId: number | string, reason: string) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl(`/admin/auctions/${auctionId}/bids/${bidId}/cancel`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to cancel bid.');
      }
      successMessage.value = json.message || 'Bid cancelled and wallet hold released.';
      await fetchAuction(auctionId);
      await fetchAuctions();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not cancel bid.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  const createAuction = async (payload: FormData | Record<string, any>) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      let options: RequestInit;
      if (payload instanceof FormData) {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
        options = {
          method: 'POST',
          headers,
          body: payload,
        };
      } else {
        options = {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        };
      }

      const res = await fetch(resolveApiUrl('/auctions'), options);
      const json = await res.json();
      if (!res.ok || !json.success) {
        const errors = (json.errors || {}) as Record<string, string[]>;
        const firstErrorList = Object.values(errors)[0];
        const firstError = Array.isArray(firstErrorList) ? firstErrorList[0] : undefined;
        const errorMsg = json.message || firstError || 'Failed to create auction.';
        throw new Error(errorMsg);
      }

      successMessage.value = 'Auction lot created and launched successfully!';
      await fetchAuctions();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not create auction.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Admin: Update existing auction lot
   */
  const updateAuction = async (id: number | string, payload: FormData | Record<string, any>) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      let options: RequestInit;

      if (payload instanceof FormData) {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
        options = {
          method: 'POST',
          headers,
          body: payload,
        };
      } else {
        options = {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        };
      }

      const res = await fetch(resolveApiUrl(`/auctions/${id}`), options);
      const json = await res.json();
      if (!res.ok || !json.success) {
        const errors = (json.errors || {}) as Record<string, string[]>;
        const firstErrorList = Object.values(errors)[0];
        const firstError = Array.isArray(firstErrorList) ? firstErrorList[0] : undefined;
        const errorMsg = json.message || firstError || 'Failed to update auction.';
        throw new Error(errorMsg);
      }

      successMessage.value = 'Auction lot updated successfully!';
      await fetchAuctions();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not update auction.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Admin: Update auction status (e.g. end early or cancel)
   */
  const updateAuctionStatus = async (id: number | string, status: 'active' | 'ended' | 'cancelled') => {
    isSubmitting.value = true;
    try {
      const res = await fetch(resolveApiUrl(`/auctions/${id}/status`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update status.');
      }
      await fetchAuctions();
      return json.data;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Admin: Delete auction lot
   */
  const deleteAuction = async (id: number | string) => {
    isSubmitting.value = true;
    try {
      const res = await fetch(resolveApiUrl(`/auctions/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete auction.');
      }
      await fetchAuctions();
      return true;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Toggle favourite / watchlist for an auction
   */
  const toggleFavorite = async (auctionId: number | string) => {
    try {
      const res = await fetch(resolveApiUrl(`/auctions/${auctionId}/favorite`), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Update local auction item if present in auctions array
        const found = auctions.value.find((a) => a.id === Number(auctionId));
        if (found) {
          found.is_favorited = json.data.is_favorited;
          found.favorites_count = json.data.favorites_count;
        }
        if (auction.value && auction.value.id === Number(auctionId)) {
          auction.value.is_favorited = json.data.is_favorited;
        }
        // Refresh favorites list if it was loaded
        if (userFavorites.value.length > 0 || !json.data.is_favorited) {
          await fetchFavorites();
        }
        return json.data;
      }
      throw new Error(json.message || 'Failed to toggle favorite.');
    } catch (e: any) {
      console.error('Favorite error:', e);
      throw e;
    }
  };

  /**
   * Fetch user's favorited auctions watchlist
   */
  const fetchFavorites = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(resolveApiUrl('/user/favorite-auctions'), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        userFavorites.value = json.data || [];
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch auctions where user placed bids
   */
  const fetchUserBids = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(resolveApiUrl('/user/bids'), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        userBidsList.value = json.data || [];
      }
    } catch (e) {
      console.error('Failed to load user bids', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch won auctions & payment process records
   */
  const fetchWonAuctions = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(resolveApiUrl('/user/won-auctions'), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        userWonPayments.value = json.data || [];
      }
    } catch (e) {
      console.error('Failed to load won auctions', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Process checkout / payment for a won auction
   */
  const checkoutAuctionPayment = async (paymentId: number | string, payload: Record<string, any>) => {
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
      const res = await fetch(resolveApiUrl(`/auction-payments/${paymentId}/checkout`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Payment processing failed.');
      }
      successMessage.value = 'Won lot payment settled successfully! Proceeding to fulfillment.';
      await fetchWonAuctions();
      return json.data;
    } catch (e: any) {
      errorMessage.value = e.message || 'Could not complete payment.';
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    auctions,
    auction,
    bids,
    currentUserBidStatus,
    userProxyBid,
    userFavorites,
    userBidsList,
    userWonPayments,
    isLoading,
    isSubmitting,
    errorMessage,
    successMessage,
    fetchAuctions,
    fetchAuction,
    listenForBids,
    stopListeningForBids,
    placeQuickBid,
    setProxyBid,
    buyItNow,
    adminCancelBid,
    createAuction,
    updateAuction,
    updateAuctionStatus,
    deleteAuction,
    toggleFavorite,
    fetchFavorites,
    fetchUserBids,
    fetchWonAuctions,
    checkoutAuctionPayment,
  };
});
