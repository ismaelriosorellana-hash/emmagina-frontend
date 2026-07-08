# Conexión de imágenes reales desde Cloudinary + MongoDB

Esta versión del frontend ya queda configurada para leer los productos reales desde el backend/MongoDB.

## 1. Cambio aplicado en el frontend

En `js/config.js` quedó:

```js
USE_STATIC_KSD_CATALOG: false
```

Eso significa que la tienda deja de usar el catálogo demo de `js/ksd-catalog-data.js` y pasa a cargar productos reales desde:

```txt
CONFIG.API_BASE_URL + /productos
```

En producción actualmente apunta a:

```txt
https://key-soul-desing-backend.onrender.com/api
```

Si tu backend de Render tiene otra URL, cambia `API_BASE_URL` en `js/config.js`.

---

## 2. Cómo debe guardarse la imagen en MongoDB

Cada producto debe tener un campo `imagenes` como arreglo. Puedes usar cualquiera de estas dos formas:

### Opción recomendada

```json
"imagenes": [
  {
    "url": "https://res.cloudinary.com/TU_CLOUD/image/upload/v1234567890/emmagina/productos/figura-familiar.png",
    "principal": true,
    "orden": 1
  }
]
```

### Opción simple

```json
"imagenes": [
  "https://res.cloudinary.com/TU_CLOUD/image/upload/v1234567890/emmagina/productos/figura-familiar.png"
]
```

Ambas son compatibles.

---

## 3. Cómo cargar productos desde el panel admin

En `admin/productos.html`, abre el producto y pega las URLs de Cloudinary en el campo:

```txt
Imágenes generales desde Cloudinary
```

Pega una URL por línea. La primera será la imagen principal de la tarjeta y del detalle del producto.

Ejemplo:

```txt
https://res.cloudinary.com/TU_CLOUD/image/upload/v1234567890/emmagina/productos/mini-alma.png
https://res.cloudinary.com/TU_CLOUD/image/upload/v1234567890/emmagina/productos/mini-alma-2.png
```

---

## 4. Requisitos en el backend / Render

En Render deben existir estas variables de entorno:

```env
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URLS=https://emmagina.cl,https://www.emmagina.cl,https://TU_FRONTEND_NETLIFY.netlify.app
PUBLIC_FRONTEND_URL=https://emmagina.cl
PUBLIC_BACKEND_URL=https://TU_BACKEND.onrender.com
```

Para mostrar imágenes ya subidas a Cloudinary, el frontend solo necesita la URL HTTPS guardada en MongoDB.
Las variables de Cloudinary del backend serán necesarias para subir archivos desde formularios o paneles administrativos.

---

## 5. Verificación rápida

1. Abre el backend en el navegador:

```txt
https://TU_BACKEND.onrender.com/api/productos
```

2. Debes ver productos en JSON.
3. Cada producto debe traer `imagenes`.
4. El frontend debe mostrar esas imágenes reales en el catálogo, carruseles y detalle del producto.

---

## 6. Importante

No subas claves de Cloudinary ni `.env` al frontend.
El frontend solo usa URLs públicas de imágenes. Las claves viven únicamente en Render/backend.
