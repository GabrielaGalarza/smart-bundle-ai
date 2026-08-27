import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Server } from 'node:http'
import type { Product } from '@sba/core'
import { buildApp } from '../src/app.js'

const shoe = (id: string, brand: string, price: number): Product => ({
  id,
  name: `${brand} ${id}`,
  brand,
  category: 'zapatillas',
  price,
  inStock: undefined,
  tags: ['zapatillas', brand.toLowerCase()],
  source: 'lenaldi',
})

const catalog: Product[] = [
  shoe('nike-a', 'Nike', 78000), shoe('nike-b', 'Nike', 92000),
  shoe('nike-c', 'Nike', 105000), shoe('nike-d', 'Nike', 110000), shoe('nike-e', 'Nike', 125000),
  shoe('puma-a', 'Puma', 65000), shoe('puma-b', 'Puma', 82000), shoe('puma-c', 'Puma', 99000),
  shoe('vans-a', 'Vans', 48000),
]

let server: Server
let baseUrl: string

beforeAll(() => {
  const app = buildApp(catalog, undefined, '5491178236492')
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address()
      baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
      resolve()
    })
  })
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

async function bundle(freeText: string, conversationId?: string) {
  const response = await fetch(`${baseUrl}/bundle`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ freeText, ...(conversationId ? { conversationId } : {}) }),
  })
  return { response, body: await response.json() }
}

describe('asistente comercial Lenaldi', () => {
  it('no sustituye una categoría inexistente por zapatillas', async () => {
    const { response, body } = await bundle('Quiero una remera')
    expect(response.status).toBe(200)
    expect(body.bundle.items).toEqual([])
    expect(body.unsupportedCategory).toMatchObject({ requested: 'remera', available: ['zapatillas'] })
    expect(body.explanation).toMatch(/Lenaldi.*catálogo de zapatillas.*remeras?/i)
  })

  it('respeta Puma como marca fuerte y devuelve primero la más barata', async () => {
    const { body } = await bundle('Quiero Puma barata')
    expect(body.bundle.items).toHaveLength(1)
    expect(body.bundle.items[0]).toMatchObject({ id: 'puma-a', brand: 'Puma', price: 65000 })
    expect(body.request.priceOrder).toBe('asc')
  })

  it('ordena varias zapatillas más caras por precio descendente', async () => {
    const { body } = await bundle('Mostrame las zapatillas más caras')
    const prices = body.bundle.items.map((product: Product) => product.price)
    expect(prices.length).toBeGreaterThan(1)
    expect(prices).toEqual([...prices].sort((left, right) => right - left))
  })

  it('usa un presupuesto alto para armar varias Nike sin superarlo', async () => {
    const { body } = await bundle('Tengo 600 mil y quiero zapatillas Nike')
    expect(body.request.maxBudget).toBe(600000)
    expect(body.bundle.items.length).toBeGreaterThan(1)
    expect(body.bundle.items.every((product: Product) => product.brand === 'Nike')).toBe(true)
    expect(body.bundle.totalPrice).toBeLessThanOrEqual(600000)
  })

  it('informa la falta de coincidencia exacta antes de ofrecer otras marcas', async () => {
    const { body } = await bundle('Quiero Puma por menos de 50 mil')
    expect(body.bundle.items).toEqual([])
    expect(body.explanation).toContain('No encontré zapatillas Puma')
    expect(body.explanation).toContain('$50.000')
    expect(body.explanation).toContain('$65.000')
    expect(body.noExactMatch.cheapestExact.id).toBe('puma-a')
    expect(body.noExactMatch.alternatives.map((product: Product) => product.id)).toContain('vans-a')
  })

  it('recuerda la selección y reemplaza el segundo producto rechazado', async () => {
    const initial = await bundle('Tengo 600 mil y quiero zapatillas Nike')
    const removed = initial.body.bundle.items[1].id
    const next = await bundle('Sacá la segunda y buscame otra', initial.body.conversationId)
    expect(next.body.request.avoidedProducts).toContain(removed)
    expect(next.body.bundle.items.map((product: Product) => product.id)).not.toContain(removed)
    expect(next.body.bundle.items.every((product: Product) => product.brand === 'Nike')).toBe(true)
    expect(next.body.bundle.totalPrice).toBeLessThanOrEqual(600000)
  })

  it('actualiza la cantidad y conserva el presupuesto entre turnos', async () => {
    const initial = await bundle('Tengo 500 mil para zapatillas')
    const next = await bundle('Quiero tres zapatillas', initial.body.conversationId)
    expect(next.body.request).toMatchObject({ maxBudget: 500000, quantity: 3 })
    expect(next.body.conversation.state.quantity).toBe(3)
    expect(next.body.bundle.items).toHaveLength(3)
    expect(next.body.bundle.totalPrice).toBeLessThanOrEqual(500000)
  })

  it('devuelve exactamente dos Nike y mantiene la marca al cambiar solo la cantidad', async () => {
    const initial = await bundle('Tengo 500 mil y quiero Nike')
    const next = await bundle('Mejor mostrame dos', initial.body.conversationId)
    expect(next.body.request).toMatchObject({ maxBudget: 500000, quantity: 2 })
    expect(next.body.bundle.items).toHaveLength(2)
    expect(next.body.bundle.items.every((product: Product) => product.brand === 'Nike')).toBe(true)
  })

  it('interpreta cinco Puma y no toma talle 38 como cantidad', async () => {
    const puma = await bundle('Quiero cinco Puma con 500 mil')
    expect(puma.body.request.quantity).toBe(5)
    expect(puma.body.bundle.items.every((product: Product) => product.brand === 'Puma')).toBe(true)
    const size = await bundle('Talle 38', puma.body.conversationId)
    expect(size.body.request.quantity).toBe(5)
  })

  it('conserva un presupuesto informado antes de la marca y la cantidad', async () => {
    const initial = await bundle('Tengo 500 mil')
    expect(initial.response.status).toBe(200)
    const next = await bundle('Quiero cuatro Puma', initial.body.conversationId)
    expect(next.body.request).toMatchObject({ maxBudget: 500000, quantity: 4 })
    expect(next.body.bundle.items).toHaveLength(3)
    expect(next.body.bundle.items.every((product: Product) => product.brand === 'Puma')).toBe(true)
    expect(next.body.explanation).toMatch(/Encontré 3 de 4 opciones compatibles/i)
  })
})
