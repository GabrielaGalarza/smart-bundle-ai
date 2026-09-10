# Smart Bundle AI

**Smart Bundle AI** es una solución de eCommerce que utiliza Inteligencia Artificial para ayudar a los usuarios a encontrar productos o combinaciones de productos que se ajusten a su presupuesto, disponibilidad de stock y necesidades.

El proyecto fue desarrollado en el marco de **eCommerce Day 2026**, con el objetivo de reducir la fricción durante el proceso de compra y disminuir el abandono provocado por restricciones de presupuesto, falta de tiempo o dificultad para encontrar productos adecuados.

## Problema

En una tienda online, un usuario puede encontrar múltiples opciones, pero no siempre sabe:

* Qué productos puede comprar con su presupuesto.
* Qué alternativa elegir cuando un producto no tiene stock.
* Cómo encontrar rápidamente la mejor combinación de productos.
* Cómo continuar la compra sin comenzar nuevamente la búsqueda.

Esto puede generar frustración y abandono del proceso de compra.

## Nuestra solución

Smart Bundle AI incorpora un **agente inteligente** dentro del eCommerce que interpreta las necesidades del usuario y genera recomendaciones personalizadas.

Por ejemplo:

> “Tengo $80.000 y quiero unas zapatillas.”

El agente analiza el catálogo disponible y devuelve una opción compatible con el presupuesto y el stock actual.

El usuario puede continuar la conversación, solicitar alternativas y avanzar directamente hacia la compra mediante WhatsApp.

## Funcionalidades principales

* Catálogo online de productos.
* Búsqueda y filtrado por marca y precio.
* Ordenamiento de productos.
* Visualización individual de cada producto.
* Agente conversacional integrado al sitio.
* Recomendaciones basadas en presupuesto.
* Validación de disponibilidad de productos.
* Búsqueda de alternativas cercanas.
* Generación de recomendaciones individuales o combinaciones.
* Historial de conversación.
* Continuación del proceso de compra mediante WhatsApp.
* Diseño responsive para computadora y dispositivos móviles.

## ¿Cómo funciona?

El flujo principal es:

**Usuario → Agente IA → Catálogo → Motor de recomendación → Producto recomendado → WhatsApp**

El usuario realiza una consulta en lenguaje natural.

El sistema interpreta su intención, consulta los productos disponibles y utiliza el motor de recomendación para seleccionar las alternativas que mejor cumplen las condiciones solicitadas.

La recomendación queda asociada a un identificador que permite continuar posteriormente con el proceso de compra.

## Tecnologías utilizadas

### Frontend

* HTML
* CSS
* JavaScript
* Vercel para despliegue

### Backend

* Node.js
* TypeScript
* API REST
* Render para despliegue

### Inteligencia Artificial

* Gemini API
* Procesamiento de consultas en lenguaje natural
* Motor propio de recomendaciones y optimización de productos

### Integraciones

* WhatsApp
* Catálogo de productos
* APIs
* Integración experimental con VTEX

## Arquitectura simplificada

```text
┌─────────────────┐
│     Usuario     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Frontend     │
│    Ecommerce    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Agente de IA  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Catálogo     │
│ + Recomendador  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Recomendación / │
│    WhatsApp     │
└─────────────────┘
```

## Demo

**Tienda:**
https://smart-bundle-ai-ten.vercel.app/

**Catálogo:**
https://smart-bundle-ai-ten.vercel.app/productos

**Agente / Widget:**
https://smart-bundle-ai-ten.vercel.app/widget

**Backend:**
https://smart-bundle-ai-api.onrender.com

## Ejecución local

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd smart-bundle-ai
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear los archivos `.env` necesarios tomando como referencia:

```text
.env.example
```

Las credenciales privadas y API Keys no deben subirse al repositorio.

### 4. Ejecutar el proyecto

Para iniciar el backend:

```bash
npm run dev:api
```

Para iniciar el frontend, utilizar el script correspondiente definido en `package.json`.

## Estado del proyecto

Actualmente el proyecto cuenta con:

* Ecommerce funcional publicado.
* Catálogo público de productos.
* Agente inteligente integrado.
* Backend desplegado.
* Recomendaciones según presupuesto.
* Integración con WhatsApp.
* Experiencia responsive.
* Flujo completo desde la consulta hasta la intención de compra.

## Próximas mejoras

Como evolución del proyecto se plantea:

* Integración directa con plataformas de eCommerce.
* Conexión con stock en tiempo real.
* Registro e inicio de sesión de usuarios.
* Carrito y checkout integrado.
* Personalización basada en historial de compras.
* Seguimiento automático de recomendaciones.
* Incorporación de nuevas tiendas y catálogos.

## Objetivo

Smart Bundle AI busca transformar la búsqueda tradicional de productos en una experiencia de compra **conversacional, personalizada y orientada a la acción**, permitiendo que la tecnología ayude al usuario no solo a encontrar productos, sino también a tomar una decisión y avanzar en su compra.

