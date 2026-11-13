export interface AuctionImage {
  id: number;
  auction_id: number;
  image_path: string;
  is_primary: boolean;
  url: string;
}

export interface BidRecord {
  id: number;
  user_id: number;
  amount: number;
  max_bid_cap?: number | null;
  held_amount?: number;
  status?: string;
  is_proxy: boolean;
  masked_username: string;
  user_name?: string;
  created_at: string;
  created_at_human: string;
}

export interface UserProxyBid {
  id: number;
  max_amount: number;
  held_amount?: number;
  status: 'active' | 'outbid' | 'won';
}

export interface AuctionDetail {
  id: number;
  item_name: string;
  description?: string;
  starting_price: number;
  current_price: number;
  bid_increment: number;
  min_next_bid: number;
  buy_it_now_price?: number | null;
  can_buy_it_now?: boolean;
  has_reserve?: boolean;
  is_reserve_met?: boolean;
  anti_snipe_window_seconds?: number;
  anti_snipe_extend_seconds?: number;
  extensions_count?: number;
  won_via?: string | null;
  status: 'active' | 'ended' | 'cancelled';
  is_ended: boolean;
  end_time: string;
  images: AuctionImage[];
  primary_image_url?: string;
  total_bids: number;
  currentUserBidStatus: 'winning' | 'outbid' | 'none';
  userWalletBalance?: number;
  userHeldBalance?: number;
  userProxyBid?: UserProxyBid | null;
  highest_bid?: {
    amount: number;
    masked_username: string;
    is_proxy: boolean;
    created_at: string;
  } | null;
  is_favorited?: boolean;
  winning_payment?: {
    id: number;
    winning_amount: number;
    payment_status: string;
    fulfillment_status: string;
    deadline_at?: string;
    paid_at?: string;
  } | null;
  bids: BidRecord[];
}

export interface AuctionListItem {
  id: number;
  item_name: string;
  description?: string;
  starting_price: number;
  current_price: number;
  bid_increment: number;
  min_next_bid: number;
  buy_it_now_price?: number | null;
  can_buy_it_now?: boolean;
  has_reserve?: boolean;
  is_reserve_met?: boolean;
  status: 'active' | 'ended' | 'cancelled';
  is_ended: boolean;
  end_time: string;
  primary_image_url?: string;
  bids_count: number;
  images?: AuctionImage[];
  highest_bid?: {
    amount: number;
    masked_username: string;
    is_proxy: boolean;
    created_at: string;
  } | null;
  is_favorited?: boolean;
  favorites_count?: number;
}

export interface CustomerBiddingPaymentRecord {
  id: number;
  auction_id: number;
  user_id: number;
  bid_id?: number;
  winning_amount: number;
  payment_status: 'awaiting_payment' | 'processing' | 'paid' | 'cancelled' | 'expired';
  payment_method?: string;
  payment_reference?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  shipping_notes?: string;
  fulfillment_status: 'order_placed' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'completed';
  tracking_number?: string;
  courier?: string;
  deadline_at?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  auction?: AuctionListItem;
}

export interface UserBidSummaryItem {
  auction: AuctionListItem;
  is_winning: boolean;
  is_ended: boolean;
  user_highest_bid: number | null;
  current_price: number;
}
