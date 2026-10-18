// Stateful Mock API Interceptor for RLG Online Shop Admin Panel Demo

const ALL_PATHS = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/inventory',
  '/admin/product-upload',
  '/admin/auctions',
  '/admin/customers',
  '/admin/marketing',
  '/admin/pro-subscriptions',
  '/admin/cms',
  '/admin/analytics',
  '/admin/mobile-tools',
  '/admin/settings',
]

const ALL_CODES = [
  'dashboard',
  'orders',
  'inventory',
  'product-upload',
  'auctions',
  'customers',
  'marketing',
  'pro-subscriptions',
  'cms',
  'analytics',
  'mobile-tools',
  'settings',
]

const staffModules = ALL_PATHS.map((p, idx) => ({
  id: idx + 1,
  matrix_id: idx + 1,
  code: ALL_CODES[idx],
  name: ALL_CODES[idx].replace('-', ' ').toUpperCase(),
  path: p,
  can_read: true,
  can_create: true,
  can_update: true,
  can_delete: true,
}))

const mockProducts = [
  {
    id: 1,
    sku: 'PKM-151-UPC',
    barcode: '0820650853210',
    name: 'Pokémon TCG: Scarlet & Violet—151 Ultra-Premium Collection',
    category: { id: 1, name: 'Pokémon TCG' },
    brand: { id: 1, name: 'The Pokémon Company' },
    condition: { id: 1, name: 'Factory Sealed' },
    price: 7850,
    original_price: 8499,
    cost_price: 5900,
    stock: 14,
    low_stock_threshold: 5,
    is_promotion: true,
    sale_percentage_id: 10,
    sale_percentage: { id: 10, value: 10, name: '10% VIP Off' },
    image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    rating: 4.9,
    review_count: 142,
    description: 'Factory-sealed Pokémon 151 Ultra-Premium Collection featuring Metal Mew ex, promo cards, playmat, and 16 booster packs.',
  },
  {
    id: 2,
    sku: 'PKM-charizard-ex-199',
    barcode: '0820650851995',
    name: 'Charizard ex — 199/165 Special Illustration Rare (PSA 10 Gem Mint)',
    category: { id: 1, name: 'Pokémon TCG' },
    brand: { id: 1, name: 'The Pokémon Company' },
    condition: { id: 2, name: 'PSA 10 Gem Mint' },
    price: 24500,
    original_price: 26900,
    cost_price: 18500,
    stock: 2,
    low_stock_threshold: 3,
    is_promotion: true,
    sale_percentage_id: 10,
    sale_percentage: { id: 10, value: 10, name: '10% VIP Off' },
    image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
    rating: 5.0,
    review_count: 64,
    description: 'PSA 10 Gem Mint graded Charizard ex #199/165 SIR from Scarlet & Violet 151.',
  },
  {
    id: 3,
    sku: 'OP-05-BB-JP',
    barcode: '4549660862914',
    name: 'One Piece Card Game: Awakening of the New Era [OP-05] Booster Box',
    category: { id: 2, name: 'One Piece TCG' },
    brand: { id: 2, name: 'Bandai Namco' },
    condition: { id: 1, name: 'Factory Sealed' },
    price: 6495,
    original_price: 6995,
    cost_price: 4600,
    stock: 9,
    low_stock_threshold: 5,
    is_promotion: false,
    sale_percentage_id: null,
    image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    rating: 4.9,
    review_count: 98,
    description: '1st Anniversary OP-05 Booster Box featuring Gear 5 Luffy Manga Rare chase card.',
  },
  {
    id: 4,
    sku: 'PKM-UMBREON-VMAX-215',
    barcode: '0820650802157',
    name: 'Umbreon VMAX 215/203 Alt Art (Moonbreon) — Evolving Skies NM',
    category: { id: 1, name: 'Pokémon TCG' },
    brand: { id: 1, name: 'The Pokémon Company' },
    condition: { id: 3, name: 'Near Mint (NM)' },
    price: 46800,
    original_price: 49500,
    cost_price: 36000,
    stock: 1,
    low_stock_threshold: 2,
    is_promotion: true,
    sale_percentage_id: 5,
    sale_percentage: { id: 5, value: 5, name: '5% VIP Off' },
    image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    rating: 5.0,
    review_count: 53,
    description: 'Grail Alternate Art Umbreon VMAX from Sword & Shield Evolving Skies.',
  },
  {
    id: 5,
    sku: 'PKM-PIKACHU-EX-238',
    barcode: '0820650852381',
    name: 'Pikachu ex 238/191 Special Illustration Rare — Surging Sparks',
    category: { id: 1, name: 'Pokémon TCG' },
    brand: { id: 1, name: 'The Pokémon Company' },
    condition: { id: 3, name: 'Near Mint (NM)' },
    price: 18900,
    original_price: null,
    cost_price: 13500,
    stock: 3,
    low_stock_threshold: 3,
    is_promotion: false,
    sale_percentage_id: null,
    image_url: 'https://images.pokemontcg.io/sv8/238_hires.png',
    rating: 4.9,
    review_count: 37,
    description: 'Tera Stellar Pikachu ex SIR from Scarlet & Violet Surging Sparks.',
  },
  {
    id: 6,
    sku: 'ACC-ULT-PRO-100',
    barcode: '0074427152147',
    name: 'Ultra PRO 35pt UV One-Touch Magnetic Holder (Box of 25)',
    category: { id: 4, name: 'TCG Accessories & Graded Slabs' },
    brand: { id: 4, name: 'Ultra PRO' },
    condition: { id: 1, name: 'Factory Sealed' },
    price: 3450,
    original_price: 3800,
    cost_price: 2100,
    stock: 32,
    low_stock_threshold: 10,
    is_promotion: true,
    sale_percentage_id: 15,
    sale_percentage: { id: 15, value: 15, name: '15% VIP Off' },
    image_url: 'https://images.pokemontcg.io/sv4pt5/234_hires.png',
    rating: 4.8,
    review_count: 215,
    description: 'Archival-safe UV-blocking magnetic card cases for grail singles.',
  },
]

const mockOrders = [
  {
    id: 1042,
    invoice_id: 'INV-2026-8841',
    order_date: '2026-04-17T14:22:00Z',
    total: 32350,
    payment_method_name: 'GCash (PayMongo)',
    payment_status: 'Paid',
    status: { id: 1, name: 'Pending', label: 'Pending', badge_color: 'amber' },
    carrier: null,
    tracking_number: '',
    packing_slip_printed: false,
    refund_status: 'None',
    refund_amount: 0,
    notes: 'Please double-box the PSA 10 slab and include bubble wrap.',
    customer_profile: {
      id: 1,
      name: 'Marco Villanueva',
      email: 'marco.v@gmail.com',
      phone: '+63 917 842 9901',
      street: 'Unit 24B, One Uptown Residence, BGC',
      city: 'Taguig City',
      postal_code: '1634',
    },
    items: [
      {
        id: 1,
        product_id: 2,
        product_name: 'Charizard ex — 199/165 Special Illustration Rare (PSA 10 Gem Mint)',
        sku: 'PKM-charizard-ex-199',
        price: 24500,
        quantity: 1,
        subtotal: 24500,
        image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
        category: 'Pokémon TCG',
        condition: 'PSA 10 Gem Mint',
      },
      {
        id: 2,
        product_id: 1,
        product_name: 'Pokémon TCG: Scarlet & Violet—151 Ultra-Premium Collection',
        sku: 'PKM-151-UPC',
        price: 7850,
        quantity: 1,
        subtotal: 7850,
        image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
        category: 'Pokémon TCG',
        condition: 'Factory Sealed',
      },
    ],
  },
  {
    id: 1041,
    invoice_id: 'INV-2026-8840',
    order_date: '2026-04-17T11:05:00Z',
    total: 12990,
    payment_method_name: 'Maya / QRPh',
    payment_status: 'Paid',
    status: { id: 2, name: 'Processing', label: 'Processing', badge_color: 'blue' },
    carrier: { id: 1, name: 'J&T Express', code: 'jnt' },
    tracking_number: 'PH8920411982',
    packing_slip_printed: true,
    refund_status: 'None',
    refund_amount: 0,
    notes: 'Factory sealed case protection requested.',
    customer_profile: {
      id: 2,
      name: 'Patricia Lim',
      email: 'patricia.lim@yahoo.com',
      phone: '+63 918 331 4402',
      street: '88 Emerald Ave, Ortigas Center',
      city: 'Pasig City',
      postal_code: '1605',
    },
    items: [
      {
        id: 3,
        product_id: 3,
        product_name: 'One Piece Card Game: Awakening of the New Era [OP-05] Booster Box',
        sku: 'OP-05-BB-JP',
        price: 6495,
        quantity: 2,
        subtotal: 12990,
        image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        category: 'One Piece TCG',
        condition: 'Factory Sealed',
      },
    ],
  },
  {
    id: 1040,
    invoice_id: 'INV-2026-8839',
    order_date: '2026-04-16T09:15:00Z',
    total: 46800,
    payment_method_name: 'Credit Card (Stripe)',
    payment_status: 'Paid',
    status: { id: 5, name: 'Completed', label: 'Completed', badge_color: 'emerald' },
    carrier: { id: 2, name: 'LBC Express', code: 'lbc' },
    tracking_number: 'LBC-773190441',
    packing_slip_printed: true,
    refund_status: 'None',
    refund_amount: 0,
    customer_profile: {
      id: 3,
      name: 'Kenji Takahashi',
      email: 'kenji.t@collectors.ph',
      phone: '+63 917 550 1128',
      street: '14 Ayala Alabang Village',
      city: 'Muntinlupa City',
      postal_code: '1780',
    },
    items: [
      {
        id: 4,
        product_id: 4,
        product_name: 'Umbreon VMAX 215/203 Alt Art (Moonbreon) — Evolving Skies NM',
        sku: 'PKM-UMBREON-VMAX-215',
        price: 46800,
        quantity: 1,
        subtotal: 46800,
        image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
        category: 'Pokémon TCG',
        condition: 'Near Mint (NM)',
      },
    ],
  },
]

const mockBundles = [
  {
    id: 1,
    primary_product_id: 1,
    primary_product: mockProducts[0],
    title: 'Pokémon 151 Grail Protection Combo',
    bundle_product_ids: [6],
    bundled_products: [mockProducts[5]],
    discount_percentage: 12,
    original_total_price: 11300,
    discount_amount: 1356,
    combo_price: 9944,
    conversion_lift: '+24.8%',
    badge_text: 'COLLECTOR BUNDLE • SAVE 12%',
    is_active: true,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 2,
    primary_product_id: 2,
    primary_product: mockProducts[1],
    title: 'Slab Vault + Booster Box Pair',
    bundle_product_ids: [3],
    bundled_products: [mockProducts[2]],
    discount_percentage: 10,
    original_total_price: 30995,
    discount_amount: 3099,
    combo_price: 27896,
    conversion_lift: '+19.2%',
    badge_text: 'GRAIL COMBO • 10% OFF',
    is_active: true,
    created_at: '2026-04-05T10:00:00Z',
  },
]

const mockAbandonedCarts = [
  {
    id: 501,
    customer_id: 1,
    customer_email: 'marco.v@gmail.com',
    customer_name: 'Marco Villanueva',
    items_count: 2,
    total_value: 26750,
    discount_code: 'COMEBACK10',
    discount_percent: 10,
    last_active: '18 mins ago',
    recovered: false,
    reminder_sent: false,
  },
  {
    id: 502,
    customer_id: 2,
    customer_email: 'patricia.lim@yahoo.com',
    customer_name: 'Patricia Lim',
    items_count: 1,
    total_value: 18900,
    discount_code: 'COMEBACK10',
    discount_percent: 10,
    last_active: '2 hours ago',
    recovered: true,
    reminder_sent: true,
  },
]

const mockSeoMetadata = [
  {
    id: 1,
    entity_type: 'page',
    page_name: 'Storefront Home',
    route_path: '/',
    meta_title: 'RLG Online Hobby Shop | Authentic Pokémon TCG, One Piece & Graded Grails',
    meta_description: 'Shop authentic factory-sealed Pokémon TCG booster boxes, PSA 10 graded slabs, and One Piece Card Game singles in the Philippines with fast nationwide shipping.',
    meta_keywords: 'Pokemon TCG Philippines, PSA 10 slabs, One Piece OP-05, RLG Hobby Shop',
    focus_keyword: 'Pokemon TCG Philippines',
    seo_score: 96,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash',
    is_active: true,
  },
  {
    id: 2,
    entity_type: 'page',
    page_name: 'Live Auctions Vault',
    route_path: '/auctions',
    meta_title: 'Live Grail Auctions | Bid on PSA 10 & Alt Art Singles — RLG Shop',
    meta_description: 'Real-time collector auctions with anti-sniping protection for PSA 10 Charizard ex, Moonbreon, and Japanese booster cases.',
    meta_keywords: 'TCG live auctions, Pokemon card bidding, PSA 10 auction',
    focus_keyword: 'TCG live auctions',
    seo_score: 93,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash',
    is_active: true,
  },
]

const mockConversations = [
  {
    id: 1,
    customer_id: 101,
    admin_id: 1,
    status: 'active',
    created_at: '2026-04-17T13:10:00Z',
    updated_at: '2026-04-17T14:05:00Z',
    unread_count: 1,
    customer: {
      id: 101,
      name: 'Marco Villanueva',
      email: 'marco.v@gmail.com',
      phone: '+63 917 842 9901',
      customer_profile: {
        name: 'Marco Villanueva',
        segment_rank: 'VIP',
      },
    },
    latest_message: {
      id: 10,
      conversation_id: 1,
      sender_id: 101,
      content: 'Hi! Can I request close-up back corner photos of the PSA 10 Charizard ex slab before dispatch?',
      is_read: false,
      created_at: '2026-04-17T14:05:00Z',
    },
  },
  {
    id: 2,
    customer_id: 102,
    admin_id: 1,
    status: 'active',
    created_at: '2026-04-16T09:00:00Z',
    updated_at: '2026-04-16T10:15:00Z',
    unread_count: 0,
    customer: {
      id: 102,
      name: 'Patricia Lim',
      email: 'patricia.lim@yahoo.com',
      phone: '+63 918 331 4402',
      customer_profile: {
        name: 'Patricia Lim',
        segment_rank: 'VIP',
      },
    },
    latest_message: {
      id: 11,
      conversation_id: 2,
      sender_id: 1,
      content: 'Your OP-05 Booster Boxes have been packed with acrylic cases and handed over to J&T!',
      is_read: true,
      created_at: '2026-04-16T10:15:00Z',
    },
  },
]

const mockConversationMessages: Record<number, any[]> = {
  1: [
    {
      id: 9,
      conversation_id: 1,
      sender_id: 1,
      content: 'Welcome to RLG Collectors Concierge! How can we help with your grail order today?',
      is_read: true,
      created_at: '2026-04-17T13:12:00Z',
      sender: { id: 1, name: 'Russel Luis Gementiza', email: 'russel@rlghobby.com', user_type: 'admin' },
    },
    {
      id: 10,
      conversation_id: 1,
      sender_id: 101,
      content: 'Hi! Can I request close-up back corner photos of the PSA 10 Charizard ex slab before dispatch?',
      is_read: false,
      created_at: '2026-04-17T14:05:00Z',
      sender: { id: 101, name: 'Marco Villanueva', email: 'marco.v@gmail.com', user_type: 'customer' },
    },
  ],
  2: [
    {
      id: 11,
      conversation_id: 2,
      sender_id: 1,
      content: 'Your OP-05 Booster Boxes have been packed with acrylic cases and handed over to J&T!',
      is_read: true,
      created_at: '2026-04-16T10:15:00Z',
      sender: { id: 1, name: 'Russel Luis Gementiza', email: 'russel@rlghobby.com', user_type: 'admin' },
    },
  ],
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function setupMockAdminApi() {
  if (typeof window === 'undefined') return
  if ((window as any).__rlgMockApiInstalled) return
  ;(window as any).__rlgMockApiInstalled = true

  // Ensure default super-admin session is seeded in localStorage so AdminLayout opens directly
  const defaultSession = JSON.stringify({
    id: 'STAFF-1',
    name: 'Russel Luis Gementiza',
    email: 'admin@rlghobby.com',
    role: 'super-admin',
    roleLabel: 'Super Admin',
    token: 'demo-sanctum-token-rlg-super-admin',
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    allowedPaths: ALL_PATHS,
    allowedCodes: ALL_CODES,
  })
  window.localStorage.setItem('rlg-admin-session', defaultSession)
  window.localStorage.setItem('rlg-admin-session-v1', defaultSession)
  try {
    window.sessionStorage.setItem('rlg_staff_unlocked', 'true')
  } catch {}

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    let urlObj: URL
    try {
      urlObj = new URL(rawUrl, window.location.origin)
    } catch {
      return originalFetch(input, init)
    }

    const path = urlObj.pathname
    const method = (init?.method || 'GET').toUpperCase()

    if (!path.startsWith('/api/')) {
      return originalFetch(input, init)
    }

    let bodyData: any = {}
    if (init?.body && typeof init.body === 'string') {
      try {
        bodyData = JSON.parse(init.body)
      } catch {
        bodyData = {}
      }
    }

    // 1. Staff Modules RBAC
    if (path === '/api/staff-modules') {
      return jsonResponse({
        success: true,
        role: { id: 1, name: 'super-admin', label: 'Super Admin', permissions_label: 'Full System Access' },
        staff: { id: 1, name: 'Russel Luis Gementiza', email: 'admin@rlghobby.com' },
        modules: staffModules,
        allowed_paths: ALL_PATHS,
        allowed_codes: ALL_CODES,
      })
    }

    // 2. Dashboard Metrics
    if (path === '/api/admin/dashboard') {
      return jsonResponse({
        success: true,
        data: {
          metrics: {
            total_revenue: 482950,
            total_orders: 148,
            total_cancelled: 3,
            total_returned: 1,
            average_order_value: 3263,
            total_added_cart: 312,
            total_cart_unique_items: 84,
            total_added_favourite: 529,
            pending_orders_count: 6,
            low_stock_count: 3,
            unread_inquiries_count: 2,
            active_visitors_today: 42,
            checkout_active_visitors: 7,
            telemetry_source: 'ga4_realtime',
            telemetry_label: 'GA4 Live Stream + Sanctum Sessions',
            telemetry_window: 'Rolling 30m window',
            ga4_configured: true,
            revenue_growth_pct: 28.4,
            order_velocity_pct: 19.2,
            aov_bundle_lift: 22.5,
          },
          top_products: [
            { name: 'Charizard ex 199/165 SIR (PSA 10)', unitsSold: 14, revenue: 343000, share: '38%' },
            { name: 'Pokémon SV 151 Ultra-Premium Collection', unitsSold: 28, revenue: 219800, share: '26%' },
            { name: 'One Piece OP-05 Booster Box [JP]', unitsSold: 31, revenue: 201345, share: '22%' },
            { name: 'Umbreon VMAX Alt Art (Moonbreon)', unitsSold: 3, revenue: 140400, share: '14%' },
          ],
          top_referrers: [
            { source: 'Direct / Collectors Vault', visitors: 4820, conversionRate: '5.4%' },
            { source: 'Facebook PH TCG Groups', visitors: 3190, conversionRate: '4.8%' },
            { source: 'Google Organic Search (SEO)', visitors: 2640, conversionRate: '3.9%' },
            { source: 'TikTok Live Box Breaks', visitors: 1950, conversionRate: '6.2%' },
          ],
          recent_orders: mockOrders,
        },
      })
    }

    // 3. Executive Analytics Report
    if (path === '/api/admin/analytics/report') {
      return jsonResponse({
        success: true,
        timeframe: urlObj.searchParams.get('timeframe') || '30d',
        period_label: 'Last 30 Days',
        generated_at: new Date().toISOString(),
        currency: 'PHP',
        kpis: {
          gross_sales: 540904,
          total_refunds: 4250,
          net_store_sales: 482950,
          vat_collected: 57954,
          est_logistics_expense: 18400,
          total_orders: 148,
          total_cancelled: 3,
          total_returned: 1,
          average_order_value: 3263,
          tied_up_capital: 642500,
          total_inventory_units: 386,
          low_stock_count: 3,
          out_of_stock_count: 1,
          total_active_skus: 64,
          active_customers_count: 412,
          total_cart_items: 49,
          total_favourites_count: 529,
        },
        monthlyTrajectory: [
          { month_key: '2025-11', month: 'Nov', year: 2025, gross: 310000, refunds: 2100, net: 276785, orders: 88, height: '55%' },
          { month_key: '2025-12', month: 'Dec', year: 2025, gross: 590000, refunds: 4800, net: 526785, orders: 174, height: '94%' },
          { month_key: '2026-01', month: 'Jan', year: 2026, gross: 420000, refunds: 1900, net: 375000, orders: 121, height: '72%' },
          { month_key: '2026-02', month: 'Feb', year: 2026, gross: 465000, refunds: 3200, net: 415178, orders: 132, height: '79%' },
          { month_key: '2026-03', month: 'Mar', year: 2026, gross: 512000, refunds: 2800, net: 457142, orders: 141, height: '86%' },
          { month_key: '2026-04', month: 'Apr', year: 2026, gross: 540904, refunds: 4250, net: 482950, orders: 148, height: '92%' },
        ],
        highVelocityItems: [
          { sku: 'PKM-151-UPC', name: 'Pokémon SV 151 Ultra-Premium Collection', stock: 14, price: 7850, velocityPerDay: 2.4, daysToStockout: 5, runRate: 'Critical' },
          { sku: 'OP-05-BB-JP', name: 'One Piece OP-05 Booster Box [JP]', stock: 9, price: 6495, velocityPerDay: 1.8, daysToStockout: 5, runRate: 'Critical' },
          { sku: 'PKM-PIKACHU-EX-238', name: 'Pikachu ex 238/191 SIR — Surging Sparks', stock: 3, price: 18900, velocityPerDay: 0.5, daysToStockout: 6, runRate: 'High' },
        ],
        deadStockItems: [
          { sku: 'PKM-SHROUDED-ETB', name: 'Pokémon Shrouded Fable Elite Trainer Box', stock: 18, price: 2650, daysInStock: 74, unitsSold30d: 1, tiedUpCapital: 47700 },
        ],
        categoryDistribution: [
          { id: 1, name: 'Pokémon TCG', revenue: 312500, unitsSold: 94, productCount: 38, sharePct: 64.7 },
          { id: 2, name: 'One Piece TCG', revenue: 118450, unitsSold: 36, productCount: 16, sharePct: 24.5 },
          { id: 4, name: 'TCG Accessories & Slabs', revenue: 52000, unitsSold: 18, productCount: 10, sharePct: 10.8 },
        ],
        paymentGatewayDistribution: [
          { method: 'GCash (PayMongo)', orders: 68, volume: 224500, sharePct: 46.5 },
          { method: 'Credit/Debit Card (Stripe)', orders: 42, volume: 158200, sharePct: 32.8 },
          { method: 'Maya / QRPh', orders: 29, volume: 78450, sharePct: 16.2 },
          { method: 'Cash on Delivery (COD)', orders: 9, volume: 21800, sharePct: 4.5 },
        ],
      })
    }

    if (path === '/api/admin/analytics/export') {
      return new Response('SKU\tProduct\tRevenue\nPKM-151-UPC\tPokemon 151 UPC\t219800', {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.ms-excel' },
      })
    }

    // 4. Products & Catalog
    if (path === '/api/products') {
      if (method === 'POST') {
        const created = {
          id: mockProducts.length + 1,
          sku: bodyData.sku || `RLG-SKU-${Date.now().toString().slice(-4)}`,
          barcode: bodyData.barcode || '0820650850000',
          name: bodyData.name || 'New Collector Card',
          category: { id: 1, name: bodyData.category || 'Pokémon TCG' },
          brand: { id: 1, name: 'The Pokémon Company' },
          condition: { id: 1, name: bodyData.condition || 'Near Mint (NM)' },
          price: Number(bodyData.price || 1500),
          original_price: bodyData.original_price ? Number(bodyData.original_price) : null,
          cost_price: Number(bodyData.cost_price || 900),
          stock: Number(bodyData.stock ?? 5),
          low_stock_threshold: 3,
          is_promotion: Boolean(bodyData.is_promotion),
          image_url: bodyData.image_url || 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
        }
        mockProducts.unshift(created as any)
        return jsonResponse({ success: true, data: created })
      }
      return jsonResponse({ success: true, data: mockProducts, meta: { last_page: 1, total: mockProducts.length } })
    }

    if (path === '/api/products/vip') {
      const created = {
        id: mockProducts.length + 1,
        sku: bodyData.sku || `VIP-SKU-${Date.now().toString().slice(-4)}`,
        name: bodyData.name || 'VIP Exclusive Collectible',
        category: { id: 1, name: bodyData.category || 'Pokémon TCG' },
        price: Number(bodyData.price || 4500),
        original_price: Number(bodyData.original_price || 5500),
        is_promotion: true,
        stock: Number(bodyData.stock ?? 5),
        image_url: bodyData.image_url || 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      }
      mockProducts.unshift(created as any)
      return jsonResponse({ success: true, data: created })
    }

    if (path === '/api/products/apply-promotion') {
      return jsonResponse({ success: true, message: 'Promotion applied to selected products.' })
    }

    if (path.startsWith('/api/products/')) {
      const id = Number(path.split('/').pop())
      const prod = mockProducts.find((p) => p.id === id) || mockProducts[0]
      if (method === 'PUT' || method === 'PATCH') {
        Object.assign(prod, bodyData)
      }
      return jsonResponse({ success: true, data: prod })
    }

    // 5. Orders & Fulfillment
    if (path === '/api/customer-orders') {
      return jsonResponse({ success: true, data: mockOrders })
    }

    if (path.startsWith('/api/customer-orders/')) {
      const parts = path.split('/')
      const orderId = Number(parts[3])
      const action = parts[4]
      const order = mockOrders.find((o) => o.id === orderId) || mockOrders[0]
      if (action === 'status' && bodyData.status) {
        order.status = { id: 2, name: bodyData.status, label: bodyData.status, badge_color: 'emerald' }
      } else if (action === 'fulfillment') {
        order.tracking_number = bodyData.tracking_number || order.tracking_number
        order.carrier = { id: 1, name: bodyData.carrier || 'J&T Express', code: 'jnt' }
      } else if (action === 'print-packing-slip') {
        order.packing_slip_printed = true
      } else if (action === 'refund') {
        order.refund_status = bodyData.type || 'Full'
        order.refund_amount = bodyData.amount || order.total
        order.status = { id: 9, name: 'Refunded', label: 'Refunded', badge_color: 'rose' }
      }
      return jsonResponse({ success: true, data: order })
    }

    if (path === '/api/ref-shipping-carriers') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'J&T Express', code: 'jnt', short_name: 'J&T', is_active: true },
          { id: 2, name: 'LBC Express', code: 'lbc', short_name: 'LBC', is_active: true },
          { id: 3, name: 'GrabExpress Same-Day (Metro Manila)', code: 'grab', short_name: 'Grab', is_active: true },
          { id: 4, name: 'DHL Express International', code: 'dhl', short_name: 'DHL', is_active: true },
        ],
      })
    }

    if (path === '/api/ref-order-statuses') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'Pending', label: 'Pending', badge_color: 'amber' },
          { id: 2, name: 'Processing', label: 'Processing', badge_color: 'blue' },
          { id: 3, name: 'Shipped', label: 'Shipped', badge_color: 'indigo' },
          { id: 4, name: 'Delivered', label: 'Delivered', badge_color: 'teal' },
          { id: 5, name: 'Completed', label: 'Completed', badge_color: 'emerald' },
          { id: 6, name: 'Canceled', label: 'Canceled', badge_color: 'rose' },
        ],
      })
    }

    // 6. Product Bundles, Abandoned Carts, SEO, Promo Codes, Newsletter
    if (path.startsWith('/api/product-bundles')) {
      if (method === 'POST') {
        const newBundle = { id: Date.now(), ...bodyData, is_active: true }
        mockBundles.unshift(newBundle)
        return jsonResponse({ success: true, data: newBundle })
      }
      return jsonResponse({ success: true, data: mockBundles })
    }

    if (path.startsWith('/api/admin/abandoned-carts')) {
      return jsonResponse({ success: true, data: mockAbandonedCarts, sent_count: mockAbandonedCarts.length })
    }

    if (path === '/api/seo-metadata/generate-ai') {
      return jsonResponse({
        success: true,
        data: {
          meta_title: `${bodyData.page_name || 'RLG Collector Page'} | Authentic TCG Singles & Sealed Boxes`,
          meta_description: `Explore verified ${bodyData.focus_keyword || 'Pokémon & One Piece TCG'} grails at RLG Online Hobby Shop with vault-grade packaging and nationwide PH delivery.`,
          meta_keywords: `${bodyData.focus_keyword || 'Pokemon TCG'}, PSA 10 Slabs, RLG Hobby Shop, Booster Box PH`,
          og_title: `${bodyData.page_name || 'RLG Collector Page'} — Verified TCG Vault`,
          og_description: '100% authentic trading cards, live auctions, and graded collectibles.',
          seo_score: 97,
          ai_model: 'gemini-2.5-flash',
        },
      })
    }

    if (path.startsWith('/api/seo-metadata')) {
      if (method === 'POST') {
        const saved = { id: Date.now(), ...bodyData, seo_score: 95, ai_generated: true }
        mockSeoMetadata.unshift(saved)
        return jsonResponse({ success: true, data: saved })
      }
      return jsonResponse({ success: true, data: mockSeoMetadata })
    }

    if (path.startsWith('/api/promo-codes')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, code: 'RLGVIP15', type: 'percentage', value: 15, usage_count: 48, usage_limit: 200, expiry_date: '2026-12-31', is_active: true, min_order_amount: 3000 },
          { id: 2, code: 'FREESHIPPH', type: 'shipping', value: 100, usage_count: 115, usage_limit: 500, expiry_date: '2026-10-30', is_active: true, min_order_amount: 2500 },
          { id: 3, code: 'MASTERBALL500', type: 'fixed', value: 500, usage_count: 29, usage_limit: 100, expiry_date: '2026-08-31', is_active: true, min_order_amount: 5000 },
        ],
      })
    }

    if (path.startsWith('/api/newsletter/subscribers')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, email: 'marco.v@gmail.com', is_active: true, created_at: '2026-02-14T10:00:00Z' },
          { id: 2, email: 'patricia.lim@yahoo.com', is_active: true, created_at: '2026-03-02T14:30:00Z' },
          { id: 3, email: 'kenji.t@collectors.ph', is_active: true, created_at: '2026-03-19T08:15:00Z' },
        ],
      })
    }

    if (path === '/api/newsletter/generate-copy') {
      return jsonResponse({
        success: true,
        data: {
          subject: '🔥 Vault Drop: Scarlet & Violet 151 Restock + PSA 10 Grail Auctions Live Tonight!',
          content: 'Fellow Collectors,\n\nOur latest shipment of factory-sealed Pokémon 151 Ultra-Premium Collections and PSA 10 Gem Mint slabs has officially landed in the RLG Vault. Pro Subscribers get 24-hour early access and up to 15% automatic checkout discounts.\n\nSecure your chase cards before stock runs out!',
        },
      })
    }

    if (path === '/api/newsletter/broadcast') {
      return jsonResponse({ success: true, message: 'Broadcast dispatched to 3 active subscribers.' })
    }

    // 7. Customers, Messages, Conversations & Reviews
    if (path === '/api/customer-profiles') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'Marco Villanueva', user: { name: 'Marco Villanueva', email: 'marco.v@gmail.com' }, phone: '+63 917 842 9901', city: 'Taguig City', orders_count: 14, lifetime_value: 168400, segment_rank: 'VIP', updated_at: '2026-04-17T14:22:00Z', bio: 'PSA 10 Charizard & Alt Art specialist.' },
          { id: 2, name: 'Patricia Lim', user: { name: 'Patricia Lim', email: 'patricia.lim@yahoo.com' }, phone: '+63 918 331 4402', city: 'Pasig City', orders_count: 9, lifetime_value: 84200, segment_rank: 'VIP', updated_at: '2026-04-17T11:05:00Z', bio: 'One Piece OP-05 & OP-09 case buyer.' },
          { id: 3, name: 'Kenji Takahashi', user: { name: 'Kenji Takahashi', email: 'kenji.t@collectors.ph' }, phone: '+63 917 550 1128', city: 'Muntinlupa City', orders_count: 6, lifetime_value: 112500, segment_rank: 'Wholesale', updated_at: '2026-04-16T09:15:00Z', bio: 'High-end Evolving Skies & Japanese booster cases.' },
          { id: 4, name: 'andrea.santos@gmail.com', user: { name: 'Andrea Santos', email: 'andrea.santos@gmail.com' }, phone: '+63 919 204 7712', city: 'Quezon City', orders_count: 3, lifetime_value: 14800, segment_rank: 'Regular', updated_at: '2026-04-12T16:40:00Z' },
        ],
      })
    }

    if (path.startsWith('/api/customer-messages')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            customer_name: 'Marco Villanueva',
            email: 'marco.v@gmail.com',
            phone: '+63 917 842 9901',
            subject: 'PSA 10 Cert Verification & UV Sleeve Request',
            message: 'Could you include a snug PSA graded slab sleeve on my Charizard ex #199 order?',
            status: 'ongoing',
            created_at: '2026-04-17T13:30:00Z',
          },
          {
            id: 2,
            customer_name: 'Kenji Takahashi',
            email: 'kenji.t@collectors.ph',
            phone: '+63 917 550 1128',
            subject: 'Wholesale Case Inquiry — Surging Sparks',
            message: 'Looking to reserve 2 sealed master cases of Surging Sparks for next week.',
            status: 'resolve',
            staff_reply: 'Reserved 2 factory-sealed master cases under your VIP Wholesale account!',
            staff_name: 'Russel Luis Gementiza',
            resolved_at: '2026-04-16T15:00:00Z',
            created_at: '2026-04-16T11:20:00Z',
          },
        ],
      })
    }

    if (path.startsWith('/api/customer-reviews')) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: 1,
            product_id: 2,
            product_name: 'Charizard ex — 199/165 Special Illustration Rare (PSA 10 Gem Mint)',
            product_image: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
            customer_name: 'Marco Villanueva',
            email: 'marco.v@gmail.com',
            stars: 5,
            message: 'Bomb-proof packaging! Slab arrived in pristine condition with magnetic vault box.',
            staff_reply: 'Thank you Marco! Enjoy the grail Charizard ex SIR!',
            staff_name: 'Russel Luis Gementiza',
            created_at: '2026-04-17T10:00:00Z',
          },
          {
            id: 2,
            product_id: 3,
            product_name: 'One Piece Card Game: Awakening of the New Era [OP-05] Booster Box',
            product_image: 'https://images.pokemontcg.io/swsh7/215_hires.png',
            customer_name: 'Patricia Lim',
            email: 'patricia.lim@yahoo.com',
            stars: 5,
            message: '100% legit unsearched Japanese booster boxes. Pulled an SP rare on box #1!',
            created_at: '2026-04-16T18:30:00Z',
          },
        ],
      })
    }

    if (path === '/api/conversations') {
      return jsonResponse({ success: true, data: mockConversations })
    }

    if (path.startsWith('/api/conversations/')) {
      const parts = path.split('/')
      const convId = Number(parts[3])
      const sub = parts[4]
      if (sub === 'messages') {
        if (method === 'POST') {
          const msg = {
            id: Date.now(),
            conversation_id: convId,
            sender_id: 1,
            content: bodyData.content || '',
            is_read: true,
            created_at: new Date().toISOString(),
            sender: { id: 1, name: 'Russel Luis Gementiza', email: 'admin@rlghobby.com', user_type: 'admin' },
          }
          if (!mockConversationMessages[convId]) mockConversationMessages[convId] = []
          mockConversationMessages[convId].push(msg)
          return jsonResponse({ success: true, data: msg })
        }
        return jsonResponse({ success: true, data: mockConversationMessages[convId] || [] })
      }
      return jsonResponse({ success: true })
    }

    // 8. Reference Data (Categories, Brands, Conditions, Sets, Sale Percentages)
    if (path === '/api/categories') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'Pokémon TCG', slug: 'pokemon-tcg' },
          { id: 2, name: 'One Piece TCG', slug: 'one-piece-tcg' },
          { id: 3, name: 'Magic: The Gathering', slug: 'mtg' },
          { id: 4, name: 'TCG Accessories & Graded Slabs', slug: 'accessories' },
        ],
      })
    }

    if (path === '/api/brands') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'The Pokémon Company' },
          { id: 2, name: 'Bandai Namco' },
          { id: 3, name: 'Wizards of the Coast' },
          { id: 4, name: 'Ultra PRO' },
        ],
      })
    }

    if (path === '/api/conditions') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'Factory Sealed' },
          { id: 2, name: 'PSA 10 Gem Mint' },
          { id: 3, name: 'Near Mint (NM)' },
          { id: 4, name: 'Lightly Played (LP)' },
        ],
      })
    }

    if (path.startsWith('/api/pokemon-sets')) {
      if (path.endsWith('/series')) {
        return jsonResponse({ success: true, data: ['Scarlet & Violet', 'Sword & Shield', 'Sun & Moon'] })
      }
      return jsonResponse({
        success: true,
        data: [
          { id: 'sv3pt5', name: '151', series: 'Scarlet & Violet', printedTotal: 165, total: 207 },
          { id: 'sv8', name: 'Surging Sparks', series: 'Scarlet & Violet', printedTotal: 191, total: 252 },
          { id: 'swsh7', name: 'Evolving Skies', series: 'Sword & Shield', printedTotal: 203, total: 237 },
        ],
      })
    }

    if (path.startsWith('/api/onepiece-sets')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 'op05', name: 'OP-05: Awakening of the New Era', code: 'OP-05' },
          { id: 'op09', name: 'OP-09: Emperors in the New World', code: 'OP-09' },
        ],
      })
    }

    if (path === '/api/sale-percentages') {
      return jsonResponse({
        success: true,
        data: [
          { id: 5, value: 5, name: '5% VIP Discount' },
          { id: 10, value: 10, name: '10% Pro Collector Discount' },
          { id: 15, value: 15, name: '15% Flash Vault Sale' },
          { id: 20, value: 20, name: '20% Anniversary Promo' },
        ],
      })
    }

    // 9. Pro Subscriptions
    if (path === '/api/admin/pro-subscriptions') {
      return jsonResponse({
        success: true,
        data: {
          total_subscribers: 3,
          subscription_price: 999,
          estimated_revenue: 2997,
          users: [
            { id: 1, name: 'Marco Villanueva', email: 'marco.v@gmail.com', is_vip: true, vip_expires_at: '2027-04-17T00:00:00Z', updated_at: '2026-04-17T10:00:00Z' },
            { id: 2, name: 'Patricia Lim', email: 'patricia.lim@yahoo.com', is_vip: true, vip_expires_at: '2027-03-15T00:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
            { id: 3, name: 'Kenji Takahashi', email: 'kenji.t@collectors.ph', is_vip: true, vip_expires_at: '2027-01-20T00:00:00Z', updated_at: '2026-01-20T10:00:00Z' },
            { id: 4, name: 'Andrea Santos', email: 'andrea.santos@gmail.com', is_vip: false, vip_expires_at: null, updated_at: '2026-04-10T10:00:00Z' },
          ],
        },
      })
    }

    if (path.includes('/api/admin/pro-subscriptions/') && path.endsWith('/toggle')) {
      return jsonResponse({ success: true, message: 'VIP Pro status updated.' })
    }

    // 10. AI Vision & CMS AI Generation
    if (path === '/api/ai/analyze-product-image') {
      return jsonResponse({
        success: true,
        data: {
          name: 'Charizard ex — 199/165 Special Illustration Rare',
          category: 'Pokémon TCG',
          brand: 'The Pokémon Company',
          condition: 'Near Mint (NM)',
          set_name: '151',
          card_number: '199/165',
          rarity: 'Special Illustration Rare',
          suggested_price: 14500,
          description: 'Authentic Scarlet & Violet—151 Charizard ex #199/165 Special Illustration Rare with textured holo foil.',
        },
      })
    }

    if (path === '/api/ai/generate-article') {
      return jsonResponse({
        success: true,
        data: {
          title: 'Collector Investment Guide: Why Scarlet & Violet 151 & PSA 10 Alt Arts Lead the 2026 Market',
          excerpt: 'An in-depth breakdown of population reports, pull rates, and sealed booster box appreciation across Pokémon 151 and One Piece OP-05.',
          content: '### Market Overview\n\nDemand for nostalgic Kanto illustrations in **Scarlet & Violet—151** continues to set records across Asian and Western hobby markets...',
          readTime: '5 min read',
        },
      })
    }

    if (path === '/api/upload') {
      return jsonResponse({
        success: true,
        url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
        path: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      })
    }

    // 11. Mobile Tools — FastBatchScanner Config & Upload
    if (path === '/api/v1/mobile-tools/cards/config') {
      return jsonResponse({
        success: true,
        config: {
          folder_id: '1RLG_VAULT_BATCH_FOLDER_2026',
          has_credentials: true,
          auth_mode: 'service_account',
          updated_at: '2026-04-17T12:00:00Z',
        },
        history: [
          {
            id: 1,
            batch_code: 'BATCH-20260417-01',
            cards_count: 24,
            folder_url: 'https://drive.google.com/drive/folders/1RLG_VAULT',
            status: 'completed',
            created_at: '2026-04-17 11:30 AM',
          },
        ],
      })
    }

    if (path.includes('/mobile-tools/cards/batch-upload')) {
      return jsonResponse({
        success: true,
        message: 'Batch uploaded and composited onto RLG template successfully!',
        batch_code: `BATCH-${Date.now().toString().slice(-6)}`,
        uploaded_count: 1,
      })
    }

    // 12. Settings, RBAC, Payment Gateways, Security, Shipping & Localization
    if (path === '/api/ref-payment-methods') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'GCash (PayMongo)', code: 'gcash', provider: 'PayMongo', is_active: true },
          { id: 2, name: 'Maya / QRPh', code: 'maya', provider: 'PayMongo', is_active: true },
          { id: 3, name: 'Credit / Debit Card (Stripe)', code: 'stripe', provider: 'Stripe', is_active: true },
          { id: 4, name: 'Cash on Delivery (COD)', code: 'cod', provider: 'Internal', is_active: true },
        ],
      })
    }

    if (path.startsWith('/api/admin/security/2fa-status')) {
      return jsonResponse({ success: true, two_factor_enabled: true, email: 'admin@rlghobby.com' })
    }

    if (path.startsWith('/api/admin/secret-questions')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, question: 'What was the first PSA 10 grail card sold in the RLG Vault?', is_active: true, created_at: '2026-01-10T00:00:00Z' },
        ],
      })
    }

    if (path === '/api/admin/analytics/realtime') {
      return jsonResponse({
        success: true,
        active_users: 42,
        checkout_users: 7,
        source: 'GA4 Live + Sanctum Sessions',
      })
    }

    if (path === '/api/staff-roles') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'super-admin', label: 'Super Admin', permissions_label: 'Full System Access', modules: staffModules },
          { id: 2, name: 'manager', label: 'Store Manager', permissions_label: 'Catalog, Orders, Inventory & Marketing', modules: staffModules.slice(0, 9) },
          { id: 3, name: 'fulfillment', label: 'Fulfillment Specialist', permissions_label: 'Orders, Packing Slips & Batch Scanner', modules: staffModules.slice(0, 4) },
        ],
      })
    }

    if (path.startsWith('/api/staff')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, name: 'Russel Luis Gementiza', email: 'admin@rlghobby.com', role: 'super-admin', role_label: 'Super Admin', ref_staff_role_id: 1, is_active: true },
          { id: 2, name: 'angelica.ops@rlghobby.com', email: 'angelica.ops@rlghobby.com', role: 'manager', role_label: 'Store Manager', ref_staff_role_id: 2, is_active: true },
          { id: 3, name: 'carlo.vault@rlghobby.com', email: 'carlo.vault@rlghobby.com', role: 'fulfillment', role_label: 'Fulfillment Specialist', ref_staff_role_id: 3, is_active: true },
        ],
      })
    }

    if (path.startsWith('/api/shipping-tax')) {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, region_name: 'Metro Manila (NCR)', shipping_fee: 120, free_shipping_threshold: 3500, tax_rate_percent: 12, is_active: true, is_default: true },
          { id: 2, region_name: 'Luzon Provincial', shipping_fee: 165, free_shipping_threshold: 4500, tax_rate_percent: 12, is_active: true, is_default: false },
          { id: 3, region_name: 'Visayas & Mindanao Air Cargo', shipping_fee: 220, free_shipping_threshold: 5000, tax_rate_percent: 12, is_active: true, is_default: false },
        ],
      })
    }

    if (path === '/api/ref-currencies') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
          { id: 2, code: 'USD', symbol: '$', name: 'US Dollar' },
          { id: 3, code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        ],
      })
    }

    if (path === '/api/ref-weight-units') {
      return jsonResponse({
        success: true,
        data: [
          { id: 1, code: 'g', name: 'Grams (g)' },
          { id: 2, code: 'kg', name: 'Kilograms (kg)' },
        ],
      })
    }

    if (path === '/api/localization') {
      return jsonResponse({
        success: true,
        data: {
          store_name: 'RLG Online Hobby Shop',
          currency_id: 1,
          currency_code: 'PHP',
          currency_symbol: '₱',
          weight_unit_id: 1,
          weight_unit_code: 'g',
          timezone: 'Asia/Manila',
        },
      })
    }

    if (path === '/api/auth/staff-login') {
      return jsonResponse({
        success: true,
        token: 'demo-sanctum-token-rlg-super-admin',
        staff: {
          id: 1,
          name: 'Russel Luis Gementiza',
          email: bodyData.email || 'admin@rlghobby.com',
          role: 'super-admin',
          role_label: 'Super Admin',
          allowed_paths: ALL_PATHS,
          allowed_codes: ALL_CODES,
        },
      })
    }

    // Default fallback for any other /api/* endpoint
    return jsonResponse({ success: true, data: [] })
  }
}
