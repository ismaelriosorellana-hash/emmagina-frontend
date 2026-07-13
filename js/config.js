"use strict";

const IS_LOCAL_ENVIRONMENT = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL = IS_LOCAL_ENVIRONMENT
  ? "http://localhost:3000/api"
  : "https://emmagina-backend.onrender.com/api";

const CATEGORIES = [
  "Librería",
  "Juguetería",
  "Decoración",
  "Retratos 3D",
  "Servicio 3D",
  "Repuestos y prototipos",
  "Regalos",
  "Todos"
];

const PLACEHOLDER_IMAGE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" rx="70" fill="#EAF4F8"/>
  <circle cx="302" cy="336" r="94" fill="#8ECAE6"/>
  <circle cx="454" cy="306" r="120" fill="#FFFFFF" opacity="0.78"/>
  <circle cx="604" cy="354" r="88" fill="#219EBC" opacity="0.72"/>
  <path d="M230 620c58-132 132-192 225-192s167 60 225 192" fill="#FFB703" opacity="0.55"/>
  <text x="450" y="695" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#023047">Rhema Diseños</text>
  <text x="450" y="746" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" fill="#125373">Producto en preparación</text>
</svg>`);

window.CONFIG = Object.freeze({
  APP_VERSION: "5.14.0-seguimiento-produccion",
  SITE_NAME: "Rhema Diseños",
  BRAND_NAME: "Rhema Diseños",
  SITE_URL: "https://emmagina-frontend.onrender.com",
  API_BASE_URL,
  CATEGORIES: Object.freeze(CATEGORIES),
  locale: "es-CL",
  currency: "CLP",
  whatsapp: "56900000000",
  soporteTelefono: "+56 9 0000 0000",
  soporteEmail: "contacto@rhemadisenos.cl",
  ventasEmail: "contacto@rhemadisenos.cl",
  placeholderImage: PLACEHOLDER_IMAGE,
  DELIVERY_DEFAULTS: Object.freeze({
    shipping: Object.freeze({
      enabled: true,
      instructions: "Envíos a Santiago y regiones según coordinación. Los productos a pedido consideran tiempo de fabricación."
    }),
    pickup: Object.freeze({
      enabled: true,
      instructions: "Retiro en Santiago previa coordinación."
    })
  }),
  ENDPOINTS: Object.freeze({
    productos: "/productos",
    categorias: "/categorias"
  })
});

window.ProductLinks = Object.freeze({
  detail(productOrId) {
    const product = productOrId && typeof productOrId === "object" ? productOrId : { id: productOrId };
    const slug = String(product.slug || "").trim();
    const id = String(product.id || product._id || "").trim();
    if (slug) return `producto.html?slug=${encodeURIComponent(slug)}`;
    if (id) return `producto.html?id=${encodeURIComponent(id)}`;
    return "catalogo.html";
  },
  legacyDetail(productOrId) {
    return this.detail(productOrId);
  }
});
