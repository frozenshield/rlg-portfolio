import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([
    {
      id: 'prod-1',
      name: 'Charizard VSTAR #212/S-P (VSTAR Universe)',
      category: 'Singles',
      price: 89.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80',
      condition: 'Gem Mint 10 (Ungraded)'
    }
  ])

  const isCartOpen = ref(false)
  const isCheckingOut = ref(false)
  const checkoutSuccess = ref(false)
  const promoCode = ref('')
  const discountPercent = ref(0)

  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + item.price * item.quantity, 0)
  })

  const discountAmount = computed(() => {
    return subtotal.value * (discountPercent.value / 100)
  })

  const shipping = computed(() => {
    return subtotal.value > 150 || subtotal.value === 0 ? 0 : 9.99
  })

  const total = computed(() => {
    return Math.max(0, subtotal.value - discountAmount.value + shipping.value)
  })

  function addToCart(product) {
    const existing = items.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: 1,
        image: product.image,
        condition: product.condition
      })
    }
    isCartOpen.value = true
  }

  function removeFromCart(id) {
    items.value = items.value.filter(item => item.id !== id)
  }

  function updateQuantity(id, delta) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.quantity += delta
    if (item.quantity <= 0) {
      removeFromCart(id)
    }
  }

  function applyPromo(code) {
    const trimmed = code.trim().toUpperCase()
    if (trimmed === 'HOBBY10' || trimmed === 'RLG10' || trimmed === 'SULIT') {
      discountPercent.value = 10
      return { success: true, message: '10% Collector discount applied!' }
    } else if (trimmed === 'GUNPLA20') {
      discountPercent.value = 20
      return { success: true, message: '20% Gunpla drop discount applied!' }
    }
    return { success: false, message: 'Invalid promo code. Try "HOBBY10" or "GUNPLA20"' }
  }

  async function checkout() {
    if (items.value.length === 0) return
    isCheckingOut.value = true
    await new Promise(r => setTimeout(r, 1200))
    isCheckingOut.value = false
    checkoutSuccess.value = true
    items.value = []
    setTimeout(() => {
      checkoutSuccess.value = false
      isCartOpen.value = false
    }, 3000)
  }

  function toggleCart() {
    isCartOpen.value = !isCartOpen.value
  }

  return {
    items,
    isCartOpen,
    isCheckingOut,
    checkoutSuccess,
    promoCode,
    discountPercent,
    itemCount,
    subtotal,
    discountAmount,
    shipping,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromo,
    checkout,
    toggleCart
  }
})

