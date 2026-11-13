import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore } from './catalog.store'
import { useCatalogFilterComposable } from './catalog-filter.composable'

describe('catalog-filter.composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useCatalogStore()
    store.toys = [
      {
        id: '1',
        name: 'Pikachu Plush',
        price: 999,
        originalPrice: 999,
        category: 'tcg',
        rating: 4.8,
        reviewCount: 10,
        imageUrl: '/test.png',
        inStock: true,
        isNew: true,
        ageGroup: 'all',
      },
      {
        id: '2',
        name: 'Gundam Aerial',
        price: 1500,
        originalPrice: 1500,
        category: 'anime-merchandise',
        rating: 4.9,
        reviewCount: 20,
        imageUrl: '/test.png',
        inStock: true,
        isNew: false,
        ageGroup: 'teen',
      },
    ] as any
  })

  it('initially returns all toys', () => {
    const { filteredToys } = useCatalogFilterComposable()
    expect(filteredToys.value.length).toBeGreaterThan(0)
  })

  it('filters toys by category', () => {
    const store = useCatalogStore()
    const { filteredToys } = useCatalogFilterComposable()

    store.setCategory('tcg')
    expect(filteredToys.value.every((toy) => toy.category === 'tcg')).toBe(true)
    expect(filteredToys.value.length).toBeGreaterThan(0)
  })

  it('filters toys by search query', () => {
    const store = useCatalogStore()
    const { filteredToys } = useCatalogFilterComposable()

    store.setSearchQuery('Pikachu')
    expect(filteredToys.value.length).toBeGreaterThan(0)
    expect(filteredToys.value[0].name).toContain('Pikachu')
  })

  it('sorts toys by price ascending', () => {
    const store = useCatalogStore()
    const { filteredToys } = useCatalogFilterComposable()

    store.sortBy = 'price-asc'
    const prices = filteredToys.value.map((t) => t.price)
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1])
    }
  })

  it('resets filters properly', () => {
    const store = useCatalogStore()
    const { hasActiveFilters, resetFilters } = useCatalogFilterComposable()

    store.setCategory('anime-merchandise')
    expect(hasActiveFilters.value).toBe(true)

    resetFilters()
    expect(hasActiveFilters.value).toBe(false)
    expect(store.selectedCategory).toBe('all')
  })

  it('provides per page options starting at 20, 30, 40 by 10s', () => {
    const { itemsPerPage, pageSizeOptions } = useCatalogFilterComposable()
    expect(itemsPerPage.value).toBe(20)
    expect(pageSizeOptions).toEqual([20, 30, 40, 50])
  })
})
