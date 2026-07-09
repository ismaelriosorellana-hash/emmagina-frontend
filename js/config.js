"use strict";

const IS_LOCAL_ENVIRONMENT =
    ["localhost", "127.0.0.1"]
        .includes(window.location.hostname);

const API_BASE_URL =
    IS_LOCAL_ENVIRONMENT
        ? "http://localhost:3000/api"
        : "https://emmagina-backend.onrender.com/api";

window.CONFIG = Object.freeze({
    APP_VERSION: "1.4.0-emmagina-estable",
    SITE_URL: "https://emmagina-frontend.onrender.com",
    SITE_NAME: "Emmagina",
    BRAND_NAME: "Emmagina",
    DEFAULT_SEO_IMAGE: "",

    FREE_SHIPPING_THRESHOLD: 70000,

    ANALYTICS: Object.freeze({
        enabled: false,
        ga4MeasurementId: "",
        clarityProjectId: "",
        anonymizeIp: true,
        trackEcommerce: true
    }),

    PAYMENT: Object.freeze({
        receiptHours: 3,
        emailEnabled: false,
        paymentsEmail: "",
        designsEmail: "",
        bankDetailsConfigured: false,
        bankDetailsMessage: "Los datos bancarios se entregarán únicamente mediante un canal oficial de Emmagina. Verifica siempre el nombre del destinatario antes de transferir."
    }),

    API_BASE_URL,

    ENDPOINTS: Object.freeze({
        productos: "/productos",
        categorias: "/categorias",
        mercadoPagoEstado: "/pagos/mercadopago/estado"
    }),

    CATEGORIES: Object.freeze([
        "Accesorios",
        "Coleccionables",
        "Decoración",
        "Herramientas",
        "Linea Memories",
        "Librería",
        "Linea Alma",
        "Ofertas",
        "Otros",
        "Vasos Temáticos",
        "Todos"
    ]),

    SEASON_CATEGORIES: Object.freeze([
        "Nacimiento",
        "Baby Shower",
        "Día de la Madre",
        "Día del Padre",
        "Cumpleaños",
        "Aniversario",
        "Abuelos"
    ]),

    /* Tipos disponibles exclusivamente en el personalizador. */
    CUSTOMIZATION_CATEGORIES: Object.freeze([
        "Figura individual",
        "Escena dúo",
        "Escena familiar",
        "Pack regalo",
        "Placa personalizada",
        "Otro recuerdo"
    ]),

    CUSTOMIZATION_PRICING: Object.freeze({
        categoryBase: Object.freeze({
            "Librería": 7990,
            "Tazas": 4990,
            "Vasos": 6990,
            "Botellas": 7990,
            "Vestuario": 12990,
            "Accesorios": 5990,
            "Otros": 7990
        }),

        productBaseOverrides: Object.freeze({
            "poleron": 12990,
            "polerón": 12990,
            "taza": 4990
        }),

        extras: Object.freeze({
            image: 3000,
            mainText: 2000,
            secondaryText: 2000
        })
    }),


/*
 * Banner principal. Para cambiarlo, pega aquí la URL de Cloudinary.
 * Puedes agregar más objetos al arreglo y se mostrarán automáticamente.
 */
HOME_BANNERS: Object.freeze([
    Object.freeze({
        desktopImage: "",
        mobileImage: "",
        position: "center",
        eyebrow: "Recuerdos que toman forma",
        title: "Escenas 3D familiares inspiradas en tus fotos",
        buttonText: "Ver catálogo",
        target: "#lo-mas-vendido"
    })
]),


    DELIVERY_DEFAULTS: Object.freeze({
        shipping: Object.freeze({
            enabled: true,
            instructions: "Santiago: retiro coordinado o despacho local según comuna. Regiones de Chile: envío por pagar o cotizado antes de fabricar. El plazo estimado de producción es de 7 a 12 días hábiles según complejidad."
        }),
        pickup: Object.freeze({
            enabled: true,
            instructions: "Retiro en Santiago previa coordinación. La fecha y hora se confirmarán al finalizar la producción de la pieza."
        })
    }),

    soporteTelefono: "+56 9 0000 0000",
    whatsapp: "56900000000",
    soporteEmail: "contacto@emmagina.cl",
    ventasEmail: "contacto@emmagina.cl",
    correoVentas: "contacto@emmagina.cl",
    soporteMensaje: "Hola Emmagina, quiero crear una escena 3D personalizada",

    social: Object.freeze({
        instagram: "#",
        whatsapp: "https://wa.me/56900000000",
        threads: "#",
        tiktok: "#"
    }),

    locale: "es-CL",
    currency: "CLP",
    USE_STATIC_KSD_CATALOG: false,
    environment:
        IS_LOCAL_ENVIRONMENT
            ? "development"
            : "production",
    requestTimeoutMs: 90000,

    placeholderImage:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
                <rect width="900" height="900" rx="90" fill="#eef8fc"/>
                <circle cx="290" cy="335" r="92" fill="#ffffff" opacity="0.78"/>
                <circle cx="455" cy="310" r="120" fill="#ffffff" opacity="0.68"/>
                <circle cx="610" cy="355" r="86" fill="#ffffff" opacity="0.74"/>
                <path d="M230 610c55-130 130-190 225-190s170 60 225 190" fill="#d8c6b6" opacity="0.62"/>
                <text x="450" y="680" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#45505f">Emmagina</text>
                <text x="450" y="732" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#738093">Producto en preparación</text>
            </svg>
        `)
});


window.ProductLinks = Object.freeze({
    detail(productOrId, options = {}) {
        const product =
            productOrId && typeof productOrId === "object"
                ? productOrId
                : { id: productOrId };

        const slug = String(product.slug || "").trim();
        const id = String(product.id || product._id || "").trim();

        const variant =
            options.variantId ||
            options.variante ||
            product.variantId ||
            "";

        const size =
            options.size ||
            options.talla ||
            product.size ||
            "";

        const optionParams = new URLSearchParams();
        if (variant) optionParams.set("variante", String(variant));
        if (size) optionParams.set("talla", String(size));

        if (slug) {
            const query = optionParams.toString();
            return `/producto/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`;
        }

        if (id) {
            const params = new URLSearchParams();
            params.set("id", id);
            for (const [key, value] of optionParams.entries()) {
                params.set(key, value);
            }
            return `producto.html?${params.toString()}`;
        }

        return "catalogo.html";
    },

    legacyDetail(productOrId, options = {}) {
        const product =
            productOrId && typeof productOrId === "object"
                ? productOrId
                : { id: productOrId };

        const slug = String(product.slug || "").trim();
        const id = String(product.id || product._id || "").trim();
        const params = new URLSearchParams();

        if (slug) params.set("slug", slug);
        else if (id) params.set("id", id);

        const variant = options.variantId || options.variante || product.variantId || "";
        const size = options.size || options.talla || product.size || "";

        if (variant) params.set("variante", String(variant));
        if (size) params.set("talla", String(size));

        const query = params.toString();
        return query ? `producto.html?${query}` : "catalogo.html";
    }
});
