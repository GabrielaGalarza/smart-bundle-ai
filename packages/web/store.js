(function () {
  const BRANDS = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Vans']
  const state = { products: [], source: null, health: null, deps: null, filters: { brand: '', maxPrice: '', sort: 'featured', search: '' } }

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
  const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const productPath = (product) => `/producto/${encodeURIComponent(product.id)}`
  const imageMarkup = (product, className = '') => product.imageUrl
    ? `<img class="${className}" src="${escapeHtml(state.deps.catalogImageUrl(product))}" data-product-id="${escapeHtml(product.id)}" data-image-index="0" alt="${escapeHtml(product.name)}" loading="lazy">`
    : `<span class="product-image-fallback" aria-hidden="true">L</span>`
  const sourceText = () => state.source?.source === 'lenaldi'
    ? 'Catálogo Lenaldi · datos públicos del sitio'
    : state.source?.source === 'local-fallback'
      ? 'Catálogo de demostración · respaldo local'
      : 'Catálogo configurado para la demostración'

  function getApp() { return document.getElementById('store-app') }
  function uniqueProducts(products) {
    const unique = new Map()
    products.forEach((product) => unique.set(product.id, product))
    return [...unique.values()]
  }
  async function fetchProducts(search = '') {
    const query = new URLSearchParams({ category: 'zapatillas' })
    if (search) query.set('search', search)
    return state.deps.requestJson(`${state.deps.API}/products?${query}`)
  }
  async function loadCatalog() {
    const first = await fetchProducts()
    state.source = first.catalog
    let products = [...first.products]
    const loadedBrands = new Set(products.map((product) => normalize(product.brand)))
    for (const brand of BRANDS) {
      if (loadedBrands.has(normalize(brand))) continue
      try {
        const response = await fetchProducts(brand)
        state.source = response.catalog ?? state.source
        products.push(...response.products)
      } catch { /* El primer catálogo válido sigue disponible. */ }
    }
    state.products = uniqueProducts(products).sort((a, b) => String(a.brand).localeCompare(String(b.brand), 'es') || a.price - b.price)
  }

  function navigate(path) {
    if (/^\/productos\/?$/.test(path)) state.filters.brand = ''
    if (window.location.pathname !== path) history.pushState({}, '', path)
    renderRoute()
    document.getElementById('store-navigation')?.classList.remove('store-navigation--open')
    document.getElementById('mobile-menu')?.setAttribute('aria-expanded', 'false')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function linkListeners(root = document) {
    root.querySelectorAll('[data-route]').forEach((link) => link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault(); navigate(new URL(link.href, window.location.origin).pathname)
    }))
    root.querySelectorAll('[data-agent-product]').forEach((button) => button.addEventListener('click', () => {
      const product = state.products.find((item) => item.id === button.dataset.agentProduct)
      if (product) openAgent(product)
    }))
    root.querySelectorAll('[data-whatsapp-product]').forEach((button) => button.addEventListener('click', () => {
      const product = state.products.find((item) => item.id === button.dataset.whatsappProduct)
      if (product) openWhatsApp(product)
    }))
  }
  function openAgent(product) {
    window.dispatchEvent(new CustomEvent('lenaldi:open-agent', { detail: product ? { product } : {} }))
  }
  function directWhatsAppUrl(product) {
    const number = state.health?.whatsappNumber
    if (!number) return null
    const message = `Hola, vengo desde la tienda Lenaldi. Quiero consultar por ${product.name}, precio publicado ${state.deps.priceFormatter.format(product.price)}. Referencia: ${product.id}. ¿Me ayudan con disponibilidad y talles?`
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  }
  function openWhatsApp(product) {
    const url = directWhatsAppUrl(product)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else openAgent(product)
  }
  function setSelectionCount(count) {
    const cart = document.querySelector('.cart-button')
    if (!cart) return
    cart.querySelector('b').textContent = String(count)
    cart.setAttribute('aria-label', `Selección Smart Bundle, ${count} producto${count === 1 ? '' : 's'}`)
  }

  function productCard(product) {
    const whatsappUrl = directWhatsAppUrl(product)
    return `<article class="shop-card">
      <a class="shop-card__media" href="${productPath(product)}" data-route>${imageMarkup(product)}</a>
      <div class="shop-card__body"><p>${escapeHtml(product.brand || 'Lenaldi')}</p><a class="shop-card__name" href="${productPath(product)}" data-route>${escapeHtml(product.name)}</a>
      <strong>${state.deps.priceFormatter.format(product.price)}</strong><span class="unknown-stock">Disponibilidad no informada</span>
      <div class="shop-card__actions"><a href="${productPath(product)}" data-route>Ver producto</a>${whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noreferrer">Comprar por WhatsApp</a>` : ''}<button type="button" data-agent-product="${escapeHtml(product.id)}" aria-label="Consultar ${escapeHtml(product.name)} al agente">Preguntar al agente</button></div></div>
    </article>`
  }
  function productGrid(products) {
    if (!products.length) return `<div class="catalog-empty"><strong>No encontramos productos con esos filtros.</strong><p>Probá ampliar el precio o consultale al agente.</p><button type="button" data-open-agent>Hablar con Smart Bundle AI</button></div>`
    return `<div class="shop-grid">${products.map(productCard).join('')}</div>`
  }

  function homeView() {
    const featured = [...state.products].sort((a, b) => a.price - b.price).slice(0, 8)
    const hero = state.products.find((product) => normalize(product.brand) === 'nike' && product.imageUrl) || state.products.find((product) => product.imageUrl)
    const brands = BRANDS.map((brand) => {
      const example = state.products.find((product) => normalize(product.brand) === normalize(brand))
      return `<a class="brand-tile" href="/marca/${encodeURIComponent(brand)}" data-route>${example ? imageMarkup(example) : ''}<span>Explorar</span><strong>${escapeHtml(brand)}</strong></a>`
    }).join('')
    getApp().innerHTML = `<section class="shop-hero"><div class="shop-hero__copy"><p class="shop-kicker">Nueva forma de comprar</p><h1>Encontrá las zapatillas<br><em>que van con vos.</em></h1><p>Explorá los modelos publicados por Lenaldi o contale a nuestro asistente qué buscás y cuánto querés gastar.</p><div><a href="/productos" data-route>Ver colección</a><button type="button" data-open-agent>Pedile una recomendación a la IA</button></div><small>${escapeHtml(sourceText())}</small></div><div class="shop-hero__visual">${hero ? imageMarkup(hero, 'shop-hero__shoe') : '<span class="hero-monogram">L</span>'}<span class="hero-orbit">LENALDI · SELECCIÓN ·</span></div></section>
      <section class="store-section"><div class="store-section__head"><div><p class="shop-kicker">Marcas</p><h2>Elegí tu favorita</h2></div><a href="/productos" data-route>Ver todas →</a></div><div class="brand-grid">${brands}</div></section>
      <section class="assistant-strip"><div><span>✦</span><div><p>Smart Bundle AI</p><h2>¿No sabés cuál elegir?</h2><small>Decime tu presupuesto, marca y estilo. Te muestro opciones reales del catálogo.</small></div></div><button type="button" data-open-agent>Empezar conversación</button></section>
      <section class="store-section"><div class="store-section__head"><div><p class="shop-kicker">Selección Lenaldi</p><h2>Modelos destacados</h2></div><a href="/productos" data-route>Todo el catálogo →</a></div>${productGrid(featured)}</section>`
    document.title = 'Lenaldi · Zapatillas con asistencia inteligente'
    linkListeners(getApp())
  }

  function filteredProducts() {
    let products = [...state.products]
    if (state.filters.brand) products = products.filter((product) => normalize(product.brand) === normalize(state.filters.brand))
    if (state.filters.search) {
      const search = normalize(state.filters.search)
      products = products.filter((product) => normalize([product.name, product.brand, ...(product.tags || [])].join(' ')).includes(search))
    }
    if (state.filters.maxPrice) products = products.filter((product) => product.price <= Number(state.filters.maxPrice))
    if (state.filters.sort === 'price-asc') products.sort((a, b) => a.price - b.price)
    if (state.filters.sort === 'price-desc') products.sort((a, b) => b.price - a.price)
    if (state.filters.sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    return products
  }
  function catalogView(routeBrand = '') {
    if (routeBrand) state.filters.brand = routeBrand
    const products = filteredProducts()
    const heading = routeBrand ? routeBrand : state.filters.search ? `Resultados para “${state.filters.search}”` : 'Todas las zapatillas'
    getApp().innerHTML = `<section class="catalog-hero"><p class="shop-kicker">Catálogo Lenaldi</p><h1>${escapeHtml(heading)}</h1><p>Precios observados en las páginas públicas. Consultá disponibilidad y talles antes de comprar.</p></section>
      <section class="catalog-layout"><aside class="filters"><div class="filters__heading"><strong>Filtrar</strong><button id="clear-filters" type="button">Limpiar</button></div><label>Marca<select id="brand-filter"><option value="">Todas</option>${BRANDS.map((brand) => `<option value="${escapeHtml(brand)}" ${normalize(state.filters.brand) === normalize(brand) ? 'selected' : ''}>${escapeHtml(brand)}</option>`).join('')}</select></label><label>Precio máximo<select id="price-filter"><option value="">Sin límite</option>${[60000, 70000, 80000, 90000, 100000].map((price) => `<option value="${price}" ${String(state.filters.maxPrice) === String(price) ? 'selected' : ''}>Hasta ${state.deps.priceFormatter.format(price)}</option>`).join('')}</select></label><button class="filters__agent" type="button" data-open-agent>✦ Pedir recomendación</button></aside>
      <div class="catalog-results"><div class="catalog-toolbar"><span><strong>${products.length}</strong> producto${products.length === 1 ? '' : 's'}</span><label>Ordenar<select id="sort-filter"><option value="featured">Destacados</option><option value="price-asc" ${state.filters.sort === 'price-asc' ? 'selected' : ''}>Menor precio</option><option value="price-desc" ${state.filters.sort === 'price-desc' ? 'selected' : ''}>Mayor precio</option><option value="name" ${state.filters.sort === 'name' ? 'selected' : ''}>Nombre</option></select></label></div>${productGrid(products)}</div></section>`
    document.title = `${heading} · Lenaldi`
    linkListeners(getApp())
    document.getElementById('brand-filter')?.addEventListener('change', (event) => { state.filters.brand = event.target.value; catalogView() })
    document.getElementById('price-filter')?.addEventListener('change', (event) => { state.filters.maxPrice = event.target.value; catalogView() })
    document.getElementById('sort-filter')?.addEventListener('change', (event) => { state.filters.sort = event.target.value; catalogView() })
    document.getElementById('clear-filters')?.addEventListener('click', () => { state.filters = { brand: '', maxPrice: '', sort: 'featured', search: '' }; document.getElementById('store-search').value = ''; catalogView() })
  }

  function productView(id) {
    const product = state.products.find((item) => item.id === id)
    if (!product) { notFoundView(); return }
    const whatsappUrl = directWhatsAppUrl(product)
    const related = state.products.filter((item) => item.id !== product.id && normalize(item.brand) === normalize(product.brand)).slice(0, 4)
    getApp().innerHTML = `<nav class="breadcrumbs" aria-label="Ruta"><a href="/" data-route>Inicio</a><span>/</span><a href="/productos" data-route>Productos</a><span>/</span><span>${escapeHtml(product.name)}</span></nav>
      <article class="product-detail"><div class="product-detail__media">${imageMarkup(product)}</div><div class="product-detail__copy"><p class="shop-kicker">${escapeHtml(product.brand || 'Lenaldi')}</p><h1>${escapeHtml(product.name)}</h1><strong class="product-detail__price">${state.deps.priceFormatter.format(product.price)}</strong><p class="product-detail__status">Disponibilidad no informada <small>Consultá stock y talles directamente con Lenaldi.</small></p><div class="product-facts"><span>Marca<strong>${escapeHtml(product.brand || 'No informada')}</strong></span><span>Categoría<strong>Zapatillas</strong></span><span>Precio<strong>Publicado</strong></span></div>${whatsappUrl ? `<a class="buy-whatsapp" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noreferrer">Comprar por WhatsApp</a>` : '<button class="buy-whatsapp" type="button" data-agent-product="' + escapeHtml(product.id) + '">Consultar cómo comprar</button>'}<button class="ask-agent" type="button" data-agent-product="${escapeHtml(product.id)}">✦ Preguntarle al agente por este modelo</button>${product.productUrl ? `<a class="source-link" href="${escapeHtml(product.productUrl)}" target="_blank" rel="noreferrer">Ver publicación original ↗</a>` : ''}<p class="product-accuracy">No se inventan stock, talles ni promociones: estos datos deben confirmarse con la tienda.</p></div></article>
      ${related.length ? `<section class="store-section related"><div class="store-section__head"><div><p class="shop-kicker">También puede gustarte</p><h2>Más de ${escapeHtml(product.brand)}</h2></div></div>${productGrid(related)}</section>` : ''}`
    document.title = `${product.name} · Lenaldi`
    linkListeners(getApp())
  }
  function notFoundView() {
    getApp().innerHTML = `<section class="not-found"><span>404</span><h1>No encontramos esa página</h1><p>Volvé al catálogo para seguir explorando.</p><a href="/productos" data-route>Ver productos</a></section>`
    document.title = 'Página no encontrada · Lenaldi'; linkListeners(getApp())
  }
  function renderRoute() {
    if (/^\/widget\/?$/.test(location.pathname)) return
    const path = decodeURIComponent(location.pathname)
    if (path === '/' || path === '') homeView()
    else if (/^\/productos\/?$/.test(path)) { state.filters.brand = ''; catalogView() }
    else if (path.startsWith('/marca/')) { state.filters = { ...state.filters, brand: path.slice(7), search: '' }; catalogView(path.slice(7)) }
    else if (path.startsWith('/producto/')) productView(path.slice(10))
    else notFoundView()
    document.querySelectorAll('.store-navigation a').forEach((link) => link.toggleAttribute('aria-current', new URL(link.href).pathname === location.pathname))
  }

  async function initialize(deps) {
    state.deps = deps; state.health = deps.health
    const footerWhatsApp = document.getElementById('footer-whatsapp')
    if (deps.health.whatsappNumber && footerWhatsApp) { footerWhatsApp.href = `https://wa.me/${deps.health.whatsappNumber}`; footerWhatsApp.hidden = false }
    try { await loadCatalog(); renderRoute() }
    catch (error) {
      getApp().innerHTML = `<section class="catalog-empty catalog-empty--error"><strong>No pudimos cargar el catálogo.</strong><p>${escapeHtml(deps.connectionHelp(error))}</p><button type="button" data-open-agent>Hablar con el agente</button></section>`
      linkListeners(getApp())
    }
  }

  document.addEventListener('click', (event) => {
    const route = event.target.closest?.('[data-route]')
    if (route && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(new URL(route.href, location.origin).pathname) }
    const opener = event.target.closest?.('[data-open-agent]')
    if (opener && !event.defaultPrevented) openAgent()
  })
  document.addEventListener('error', (event) => {
    if (!(event.target instanceof HTMLImageElement) || !event.target.closest('#store-app')) return
    const product = state.products.find((candidate) => candidate.id === event.target.dataset.productId)
    const alternatives = product?.imageUrls ?? (product?.imageUrl ? [product.imageUrl] : [])
    const nextIndex = Number(event.target.dataset.imageIndex ?? 0) + 1
    if (product && alternatives[nextIndex]) {
      event.target.dataset.imageIndex = String(nextIndex)
      event.target.src = state.deps.catalogImageUrl({ ...product, imageUrl: alternatives[nextIndex] })
      return
    }
    const fallback = document.createElement('span')
    fallback.className = 'product-image-fallback'
    fallback.textContent = 'L'
    fallback.setAttribute('aria-label', 'Imagen no disponible en la fuente pública')
    event.target.replaceWith(fallback)
  }, true)
  window.addEventListener('popstate', renderRoute)
  document.getElementById('mobile-menu')?.addEventListener('click', (event) => {
    const navigation = document.getElementById('store-navigation'); const open = navigation.classList.toggle('store-navigation--open'); event.currentTarget.setAttribute('aria-expanded', String(open))
  })
  document.getElementById('search-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); state.filters.search = document.getElementById('store-search').value.trim(); state.filters.brand = ''; navigate('/productos')
  })

  window.LenaldiStore = Object.freeze({ initialize, renderRoute, setSelectionCount })
})()
