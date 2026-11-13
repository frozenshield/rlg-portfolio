export interface RaffleTicketSlot {
  id: number;
  raffle_id: number;
  slot_number: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  status: 'confirmed' | 'won' | 'refunded';
  created_at?: string;
}

