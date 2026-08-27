import { describe, it, expect } from 'vitest'
import { composeBundle } from '../../src/bundle/compose.js'
import type { Product } from '../../src/types.js'

const p = (id: string, category: string, price: number, inStock = true, tags: string[] = []): Product => ({
  id, name: id, category, price, inStock, tags,
})

const catalog: Product[] = [
  p('detergente', 'limpieza', 1200, false, ['detergente', 'ropa']),
  p('detergente-2', 'limpieza', 1350, true, ['detergente', 'ropa']),
  p('esponja', 'limpieza', 300),
  p('lavandina', 'limpieza', 800),
  p('mouse', 'tecnologia', 5000),
]

describe('composeBundle', () => {
  it('solo considera productos de la categoría pedida', () => {
    const bundle = composeBundle(catalog, 'limpieza', 10000)
    expect(bundle.items.every((i) => i.category === 'limpieza')).toBe(true)
  })

  it('respeta el presupuesto también con preferencias', () => {
    const bundle = composeBundle(catalog, 'limpieza', 1000, ['esponja'])
    expect(bundle.totalPrice).toBeLessThanOrEqual(1000)
  })

  it('arma la sustitución cuando la preferencia pedida está sin stock', () => {
    const bundle = composeBundle(catalog, 'limpieza', 10000, ['detergente'])
    expect(bundle.substitutions).toHaveLength(1)
    expect(bundle.substitutions[0].outOfStock.id).toBe('detergente')
    expect(bundle.substitutions[0].replacement?.id).toBe('detergente-2')
  })

  it('no arma sustitución si la preferencia ya tiene stock', () => {
    const bundle = composeBundle(catalog, 'limpieza', 10000, ['esponja'])
    expect(bundle.substitutions).toHaveLength(0)
  })

  it('sin preferencias no hay sustituciones', () => {
    const bundle = composeBundle(catalog, 'limpieza', 10000)
    expect(bundle.substitutions).toEqual([])
  })

  it('arma una selección múltiple sin repetir productos ni superar un presupuesto alto', () => {
    const shoes = [
      p('nike-a', 'zapatillas', 78000, true, ['zapatillas', 'nike']),
      p('nike-b', 'zapatillas', 92000, true, ['zapatillas', 'nike']),
      p('nike-c', 'zapatillas', 105000, true, ['zapatillas', 'nike']),
      p('nike-d', 'zapatillas', 110000, true, ['zapatillas', 'nike']),
      p('nike-e', 'zapatillas', 125000, true, ['zapatillas', 'nike']),
    ]
    const bundle = composeBundle(shoes, {
      category: 'zapatillas', maxBudget: 600000, preferences: ['zapatillas'],
      requiredProducts: ['zapatillas'], preferredTags: ['nike'], strategy: 'maximize-budget',
      selectionSize: 'multiple',
    }, [])
    expect(bundle.items.length).toBeGreaterThan(1)
    expect(new Set(bundle.items.map((product) => product.id)).size).toBe(bundle.items.length)
    expect(bundle.totalPrice).toBeLessThanOrEqual(600000)
  })

  it('ordena selecciones relativas por precio ascendente o descendente', () => {
    const shoes = [p('a', 'zapatillas', 50000), p('b', 'zapatillas', 70000), p('c', 'zapatillas', 90000)]
    const cheapest = composeBundle(shoes, {
      category: 'zapatillas', maxBudget: 210000, preferences: ['zapatillas'], requiredProducts: ['zapatillas'],
      strategy: 'lowest-cost', priceOrder: 'asc', selectionSize: 'multiple',
    }, [])
    const expensive = composeBundle(shoes, {
      category: 'zapatillas', maxBudget: 210000, preferences: ['zapatillas'], requiredProducts: ['zapatillas'],
      strategy: 'balanced', priceOrder: 'desc', selectionSize: 'multiple',
    }, [])
    expect(cheapest.items.map((product) => product.price)).toEqual([50000, 70000, 90000])
    expect(expensive.items.map((product) => product.price)).toEqual([90000, 70000, 50000])
  })

  it('prioriza la cantidad exacta y conserva el presupuesto', () => {
    const shoes = [
      p('a', 'zapatillas', 150000), p('b', 'zapatillas', 140000),
      p('c', 'zapatillas', 130000), p('d', 'zapatillas', 90000),
    ]
    const bundle = composeBundle(shoes, {
      category: 'zapatillas', maxBudget: 400000, preferences: ['zapatillas'], requiredProducts: ['zapatillas'],
      strategy: 'maximize-budget', selectionSize: 'multiple', quantity: 3,
    }, [])
    expect(bundle.items).toHaveLength(3)
    expect(bundle.totalPrice).toBeLessThanOrEqual(400000)
    expect(new Set(bundle.items.map((product) => product.id)).size).toBe(3)
  })

  it('devuelve hasta la cantidad pedida si no existen suficientes opciones compatibles', () => {
    const shoes = [p('a', 'zapatillas', 70000), p('b', 'zapatillas', 80000)]
    const bundle = composeBundle(shoes, {
      category: 'zapatillas', maxBudget: 300000, preferences: ['zapatillas'], requiredProducts: ['zapatillas'],
      strategy: 'balanced', quantity: 5,
    }, [])
    expect(bundle.items).toHaveLength(2)
  })
})
