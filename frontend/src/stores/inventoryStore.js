import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rlgProjectData } from '../data/projectsData'

export const useInventoryStore = defineStore('inventory', () => {
  const products = ref([...rlgProjectData.sampleProducts])

  // AI Intake Engine state
  const isAnalyzing = ref(false)
  const analysisStep = ref('')
  const analysisProgress = ref(0)
  const selectedImagePreview = ref(null)

  // Intake Form model
  const intakeForm = ref({
    name: '',
    japaneseName: '',
    set: '',
    cardNumber: '',
    rarity: '',
    condition: 'Gem Mint 10 (Ungraded)',
    price: 0,
    category: 'Singles',
    stock: 1,
    image: '',
    description: '',
    seoTitle: '',
    seoSlug: '',
    seoKeywords: '',
    schemaJson: ''
  })

  // Sample card image presets for instant testing in demo
  const sampleCardPresets = [
    {
      label: 'Charizard VSTAR SAR (Japanese s12a)',
      image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80',
      detected: {
        name: 'Charizard VSTAR #212/S-P (VSTAR Universe)',
        japaneseName: 'リザードンVSTAR',
        set: 'VSTAR Universe s12a',
        cardNumber: '212/S-P SAR',
        rarity: 'Special Art Rare (SAR)',
        condition: 'Gem Mint 10 (Ungraded)',
        price: 95.00,
        category: 'Singles',
        description: 'Authentic Japanese Pokémon card from High Class Pack VSTAR Universe. Pristine surface with vivid gold and rainbow foil.'
      }
    },
    {
      label: 'Manga Shanks SEC (One Piece OP-01)',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      detected: {
        name: 'Manga Shanks Super Parallel OP01-120',
        japaneseName: 'シャンクス SEC スーパーパラレル',
        set: 'OP-01 Romance Dawn',
        cardNumber: 'OP01-120 SEC',
        rarity: 'Manga Parallel (SEC)',
        condition: 'Gem Mint 10 Contender',
        price: 540.00,
        category: 'Singles',
        description: 'Iconic Romance Dawn Manga artwork variant with crisp Japanese Kanji callouts. Zero surface scratching detected.'
      }
    },
    {
      label: 'Pikachu Illustrator Foil (Promo)',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
      detected: {
        name: 'Pikachu Illustrator Special Hologram Promo',
        japaneseName: 'ピカチュウ イラストレーター',
        set: 'Promo Collection JP',
        cardNumber: '001/PROMO-SP',
        rarity: 'Secret Rare (SR)',
        condition: 'Near Mint 9',
        price: 260.00,
        category: 'Singles',
        description: 'Double-star holographic anniversary illustration. Symmetrical border margins verified by AI optical centering matrix.'
      }
    }
  ]

  // Simulate Gemini API Vision OCR ingestion
  async function triggerAiVisionIntake(presetIndex = 0) {
    const preset = sampleCardPresets[presetIndex] || sampleCardPresets[0]
    selectedImagePreview.value = preset.image
    isAnalyzing.value = true
    analysisProgress.value = 10
    analysisStep.value = 'Uploading image to Gemini Vision OCR pipeline...'

    await new Promise(r => setTimeout(r, 450))
    analysisProgress.value = 35
    analysisStep.value = 'Extracting Japanese typography & card serial identifier...'

    await new Promise(r => setTimeout(r, 550))
    analysisProgress.value = 70
    analysisStep.value = 'Cross-referencing PokéTCG / Bandai database schemas...'

    await new Promise(r => setTimeout(r, 450))
    analysisProgress.value = 90
    analysisStep.value = 'Evaluating centering margins & surface condition grade...'

    await new Promise(r => setTimeout(r, 350))
    analysisProgress.value = 100
    analysisStep.value = 'AI Extraction complete! Populating structured form...'

    // Populate the form fields with extracted data
    intakeForm.value.name = preset.detected.name
    intakeForm.value.japaneseName = preset.detected.japaneseName
    intakeForm.value.set = preset.detected.set
    intakeForm.value.cardNumber = preset.detected.cardNumber
    intakeForm.value.rarity = preset.detected.rarity
    intakeForm.value.condition = preset.detected.condition
    intakeForm.value.price = preset.detected.price
    intakeForm.value.category = preset.detected.category
    intakeForm.value.image = preset.image
    intakeForm.value.description = preset.detected.description

    await new Promise(r => setTimeout(r, 400))
    isAnalyzing.value = false
    analysisStep.value = ''
  }

  // One-click SEO Generation
  const isGeneratingSeo = ref(false)
  async function generateSeoMetadata() {
    if (!intakeForm.value.name) return
    isGeneratingSeo.value = true

    await new Promise(r => setTimeout(r, 600))

    const cleanSlug = intakeForm.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    intakeForm.value.seoTitle = `${intakeForm.value.name} | Authentic Japanese TCG | RLG Shop`
    intakeForm.value.seoSlug = cleanSlug
    intakeForm.value.seoKeywords = `${intakeForm.value.set}, ${intakeForm.value.cardNumber}, ${intakeForm.value.rarity}, Japanese Pokémon, PSA 10, RLG Shop Philippines`

    // Generate valid JSON-LD schema
    intakeForm.value.schemaJson = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": intakeForm.value.name,
      "image": [intakeForm.value.image || "https://rlgonlineshop.com/og-card.jpg"],
      "description": intakeForm.value.description,
      "sku": intakeForm.value.cardNumber,
      "brand": {
        "@type": "Brand",
        "name": "Pokémon TCG / Bandai"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://rlgonlineshop.com/products/${cleanSlug}`,
        "priceCurrency": "USD",
        "price": intakeForm.value.price,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "RLG Online Shop"
        }
      }
    }, null, 2)

    isGeneratingSeo.value = false
  }

  // Publish / add product to the active live inventory
  function publishProduct() {
    if (!intakeForm.value.name) return false
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: intakeForm.value.name,
      japaneseName: intakeForm.value.japaneseName || '',
      category: intakeForm.value.category || 'Singles',
      set: intakeForm.value.set || 'Custom Set',
      cardNumber: intakeForm.value.cardNumber || 'EXP-001',
      rarity: intakeForm.value.rarity || 'Ultra Rare',
      condition: intakeForm.value.condition || 'Gem Mint 10',
      price: Number(intakeForm.value.price) || 49.99,
      jpyPrice: Math.round((Number(intakeForm.value.price) || 49.99) * 150),
      stock: Number(intakeForm.value.stock) || 1,
      status: 'In Stock',
      image: intakeForm.value.image || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80',
      description: intakeForm.value.description || '',
      seoSlug: intakeForm.value.seoSlug || 'new-product-item',
      isHot: true
    }

    products.value.unshift(newProduct)

    // Reset form
    intakeForm.value = {
      name: '',
      japaneseName: '',
      set: '',
      cardNumber: '',
      rarity: '',
      condition: 'Gem Mint 10 (Ungraded)',
      price: 0,
      category: 'Singles',
      stock: 1,
      image: '',
      description: '',
      seoTitle: '',
      seoSlug: '',
      seoKeywords: '',
      schemaJson: ''
    }
    selectedImagePreview.value = null
    return true
  }

  function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
  }

  return {
    products,
    isAnalyzing,
    analysisStep,
    analysisProgress,
    selectedImagePreview,
    sampleCardPresets,
    intakeForm,
    isGeneratingSeo,
    triggerAiVisionIntake,
    generateSeoMetadata,
    publishProduct,
    deleteProduct
  }
})

