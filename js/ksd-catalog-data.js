
"use strict";
(function () {
    function svgCard(title, subtitle, icon, accent = "#d8c6b6") {
        const safeTitle = String(title).replace(/[&<>]/g, "");
        const safeSubtitle = String(subtitle).replace(/[&<>]/g, "");
        const safeIcon = String(icon).replace(/[&<>]/g, "");
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
                <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#fbfdff"/>
                        <stop offset="0.46" stop-color="#eaf6fb"/>
                        <stop offset="1" stop-color="#f8efe3"/>
                    </linearGradient>
                    <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
                </defs>
                <rect width="1200" height="1200" rx="120" fill="url(#bg)"/>
                <circle cx="270" cy="280" r="150" fill="#ffffff" opacity=".65" filter="url(#blur)"/>
                <circle cx="850" cy="320" r="210" fill="#ffffff" opacity=".52" filter="url(#blur)"/>
                <circle cx="660" cy="830" r="280" fill="#ffffff" opacity=".42" filter="url(#blur)"/>
                <rect x="230" y="205" width="740" height="690" rx="84" fill="#ffffff" opacity=".48" stroke="#ffffff" stroke-width="3"/>
                <circle cx="600" cy="445" r="142" fill="${accent}" opacity=".82"/>
                <text x="600" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="124" font-weight="700" fill="#fffaf4">${safeIcon}</text>
                <path d="M380 700c70-105 140-155 220-155s150 50 220 155" fill="#ffffff" opacity=".72"/>
                <rect x="365" y="745" width="470" height="72" rx="36" fill="#fffaf4" opacity=".92"/>
                <text x="600" y="990" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#45505f">${safeTitle}</text>
                <text x="600" y="1052" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#738093">${safeSubtitle}</text>
            </svg>`);
    }

    const products = [
        {
            id: "ksd-mini-alma-3d",
            slug: "mini-alma-3d",
            nombre: "Mini Alma 3D",
            precio: 14990,
            precioOriginal: 0,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Decoración", "Todos"],
            insignia: "Desde $14.990",
            destacado: true,
            stock: 50,
            orden: 10,
            marca: "Emmagina",
            sku: "KSD-MINI-ALMA",
            diasPreparacion: 7,
            pesoGramos: 25,
            dimensiones: { largoCm: 5, anchoCm: 5, altoCm: 7 },
            imagenes: [svgCard("Mini Alma 3D", "1 figura sin pintar", "1", "#b9d8e6")],
            descripcion: "Figura pequeña personalizada inspirada en tus fotografías. Incluye 1 persona, base simple y acabado sin pintar. Ideal para una primera muestra o regalo pequeño.",
            caracteristicas: ["Incluye: 1 persona", "Acabado: PLA sin pintar", "Base: simple", "Tamaño: 5 a 7 cm aprox.", "Fotos sugeridas: 2 referencias de la persona"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2, descripcion: "Sube 2 fotos de referencia y cuéntanos el momento que quieres representar.", aviso: "La figura es una interpretación artística, no una réplica exacta." }
        },
        {
            id: "ksd-mini-alma-placa",
            slug: "mini-alma-con-placa",
            nombre: "Mini Alma con Placa",
            precio: 18990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Accesorios", "Todos"],
            insignia: "Entrada",
            destacado: true,
            stock: 50,
            orden: 20,
            marca: "Emmagina",
            sku: "KSD-MINI-PLACA",
            diasPreparacion: 7,
            pesoGramos: 35,
            dimensiones: { largoCm: 6, anchoCm: 5, altoCm: 7 },
            imagenes: [svgCard("Mini Alma con Placa", "Nombre o fecha", "✦", "#d8c6b6")],
            descripcion: "Figura pequeña sin pintar con base y placa personalizada con nombre, fecha o frase corta.",
            caracteristicas: ["Incluye: 1 persona", "Placa: nombre, fecha o frase corta", "Acabado: PLA sin pintar", "Ideal para bebés y recuerdos simples"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2, descripcion: "Indica el texto de la placa y sube tus fotos de referencia.", aviso: "Frase recomendada: hasta 45 caracteres." }
        },
        {
            id: "ksd-figura-esencial",
            slug: "figura-esencial",
            nombre: "Figura Esencial",
            precio: 24990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Decoración", "Todos"],
            insignia: "Simple",
            destacado: false,
            stock: 40,
            orden: 30,
            marca: "Emmagina",
            sku: "KSD-ESENCIAL",
            diasPreparacion: 8,
            pesoGramos: 55,
            dimensiones: { largoCm: 7, anchoCm: 6, altoCm: 9 },
            imagenes: [svgCard("Figura Esencial", "Mayor tamaño", "◌", "#c7d8cf")],
            descripcion: "Figura individual en tamaño esencial, sin pintura completa, preparada para representar un recuerdo con base personalizada simple.",
            caracteristicas: ["Incluye: 1 persona", "Acabado: sin pintura completa", "Base personalizada simple", "Tamaño: 8 a 9 cm aprox."],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-figura-color",
            slug: "figura-esencial-detalles-color",
            nombre: "Figura Esencial + Detalles de Color",
            precio: 29990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Decoración", "Todos"],
            insignia: "Color básico",
            destacado: false,
            stock: 40,
            orden: 40,
            marca: "Emmagina",
            sku: "KSD-ESENCIAL-COLOR",
            diasPreparacion: 9,
            pesoGramos: 60,
            dimensiones: { largoCm: 7, anchoCm: 6, altoCm: 9 },
            imagenes: [svgCard("Detalles de Color", "Ropa o accesorio", "✎", "#dfc7be")],
            descripcion: "Figura individual con detalles mínimos pintados a mano: cabello, ropa o accesorio simple.",
            caracteristicas: ["Incluye: 1 persona", "Pintura: detalles básicos", "Base simple", "No incluye pintura completa de rostro/escena"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-figura-con-alma",
            slug: "figura-con-alma",
            nombre: "Figura con Alma",
            precio: 39990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Decoración", "Todos"],
            insignia: "Pintada a mano",
            destacado: true,
            stock: 30,
            orden: 50,
            marca: "Emmagina",
            sku: "KSD-ALMA",
            diasPreparacion: 10,
            pesoGramos: 80,
            dimensiones: { largoCm: 8, anchoCm: 7, altoCm: 10 },
            imagenes: [svgCard("Figura con Alma", "Pintada a mano", "♡", "#d9b7a3")],
            descripcion: "Figura individual personalizada, pintada a mano con una mezcla de estilo realista y tierno. Ideal para bebés, niños y recuerdos familiares.",
            caracteristicas: ["Incluye: 1 persona", "Pintura: a mano", "Estilo: realista y tierno", "Base simple"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-figura-alma-placa",
            slug: "figura-con-alma-placa",
            nombre: "Figura con Alma + Placa",
            precio: 44990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Accesorios", "Todos"],
            insignia: "Más elegido",
            destacado: true,
            stock: 30,
            orden: 60,
            marca: "Emmagina",
            sku: "KSD-ALMA-PLACA",
            diasPreparacion: 10,
            pesoGramos: 90,
            dimensiones: { largoCm: 9, anchoCm: 7, altoCm: 10 },
            imagenes: [svgCard("Alma + Placa", "Frase personalizada", "✧", "#d8c6b6")],
            descripcion: "Figura pintada a mano con placa personalizada. Recomendada para nacimiento, cumpleaños, bautizo, Día de la Madre o regalo familiar.",
            caracteristicas: ["Incluye: 1 persona", "Pintura a mano", "Placa con nombre, fecha o frase", "1 revisión visual simple"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-figura-premium",
            slug: "figura-recuerdo-premium",
            nombre: "Figura Recuerdo Premium",
            precio: 54990,
            categoriaPrincipal: "Linea Alma",
            categorias: ["Linea Alma", "Decoración", "Todos"],
            insignia: "Premium suave",
            destacado: false,
            stock: 20,
            orden: 70,
            marca: "Emmagina",
            sku: "KSD-PREMIUM",
            diasPreparacion: 12,
            pesoGramos: 110,
            dimensiones: { largoCm: 10, anchoCm: 8, altoCm: 12 },
            imagenes: [svgCard("Recuerdo Premium", "Más detalle", "✺", "#c9cfe3")],
            descripcion: "Figura individual con pintura más detallada, base trabajada y placa personalizada. Pensada para regalos de mayor impacto emocional.",
            caracteristicas: ["Incluye: 1 persona", "Pintura detallada", "Base trabajada", "Placa personalizada", "1 revisión visual"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-duo-alma",
            slug: "escena-duo-con-alma",
            nombre: "Escena Dúo con Alma",
            precio: 69990,
            categoriaPrincipal: "Linea Memories",
            categorias: ["Linea Memories", "Coleccionables", "Decoración", "Todos"],
            insignia: "2 personas",
            destacado: true,
            stock: 20,
            orden: 80,
            marca: "Emmagina",
            sku: "KSD-DUO-ALMA",
            diasPreparacion: 12,
            pesoGramos: 140,
            dimensiones: { largoCm: 12, anchoCm: 10, altoCm: 12 },
            imagenes: [svgCard("Escena Dúo", "2 personajes", "2", "#b9d8e6")],
            descripcion: "Escena de 2 personas pintadas a mano, con base y placa personalizada. Ideal para madre e hijo, padre e hijo, pareja o hermanos.",
            caracteristicas: ["Incluye: 2 personas", "Pintura a mano", "Base y placa", "Contexto simple", "Hasta 2 fotos por persona"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2, descripcion: "Agrega las fotos de referencia de las personas y describe el momento." }
        },
        {
            id: "ksd-familiar-alma",
            slug: "escena-familiar-con-alma",
            nombre: "Escena Familiar con Alma",
            precio: 99990,
            categoriaPrincipal: "Linea Memories",
            categorias: ["Linea Memories", "Coleccionables", "Decoración", "Todos"],
            insignia: "Hasta 3 personas",
            destacado: true,
            stock: 15,
            orden: 90,
            marca: "Emmagina",
            sku: "KSD-FAMILIAR-ALMA",
            diasPreparacion: 12,
            pesoGramos: 220,
            dimensiones: { largoCm: 15, anchoCm: 12, altoCm: 14 },
            imagenes: [svgCard("Escena Familiar", "Hasta 3 personas", "3", "#d8c6b6")],
            descripcion: "Escena familiar personalizada de hasta 3 personas, pintada a mano, con contexto simple y placa. Producto principal para recuerdos de bebés y familia.",
            caracteristicas: ["Incluye: hasta 3 personas", "Pintura a mano", "Base con contexto simple", "Placa personalizada", "2 revisiones visuales simples"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2, descripcion: "Para cada persona recomendamos 2 fotos. Describe el lugar, acción o momento a recrear." }
        },
        {
            id: "ksd-familiar-premium",
            slug: "escena-familiar-premium",
            nombre: "Escena Familiar Premium",
            precio: 119990,
            categoriaPrincipal: "Linea Memories",
            categorias: ["Linea Memories", "Coleccionables", "Decoración", "Todos"],
            insignia: "Mayor detalle",
            destacado: false,
            stock: 10,
            orden: 100,
            marca: "Emmagina",
            sku: "KSD-FAMILIAR-PREMIUM",
            diasPreparacion: 14,
            pesoGramos: 260,
            dimensiones: { largoCm: 18, anchoCm: 14, altoCm: 15 },
            imagenes: [svgCard("Familiar Premium", "Contexto elaborado", "✦", "#c9cfe3")],
            descripcion: "Escena de hasta 3 personas con pintura detallada, contexto más elaborado y placa premium. Recomendada para regalos familiares especiales.",
            caracteristicas: ["Incluye: hasta 3 personas", "Pintura detallada", "Contexto más elaborado", "Placa premium", "2 revisiones visuales simples"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-pack-abuelos",
            slug: "pack-abuelos",
            nombre: "Pack Abuelos",
            precio: 69990,
            categoriaPrincipal: "Ofertas",
            categorias: ["Ofertas", "Linea Alma", "Todos"],
            insignia: "Pack regalo",
            destacado: false,
            stock: 15,
            orden: 110,
            marca: "Emmagina",
            sku: "KSD-PACK-ABUELOS",
            diasPreparacion: 12,
            pesoGramos: 120,
            dimensiones: { largoCm: 12, anchoCm: 10, altoCm: 10 },
            imagenes: [svgCard("Pack Abuelos", "2 copias mini", "♡", "#c7d8cf")],
            descripcion: "Pack pensado para regalar a abuelos: dos copias pequeñas de una figura o recuerdo simple.",
            caracteristicas: ["Incluye: 2 copias pequeñas", "Acabado esencial", "Ideal para abuelos", "Puede incluir placa simple"],
            personalizable: true,
            publicarCatalogo: true,
            personalizacionLigera: { habilitada: true, permitirNombre: true, permitirImagen: true, permitirObservacion: true, maxImages: 2 }
        },
        {
            id: "ksd-caja-regalo",
            slug: "caja-regalo-premium",
            nombre: "Caja Regalo Premium",
            precio: 3990,
            categoriaPrincipal: "Accesorios",
            categorias: ["Accesorios", "Ofertas", "Todos"],
            insignia: "Extra",
            destacado: false,
            stock: 100,
            orden: 120,
            marca: "Emmagina",
            sku: "KSD-EXTRA-CAJA",
            diasPreparacion: 1,
            pesoGramos: 0,
            imagenes: [svgCard("Caja Regalo", "Extra de presentación", "□", "#d8c6b6")],
            descripcion: "Presentación especial para regalo: caja, protección interior y tarjeta breve.",
            caracteristicas: ["Extra para sumar al pedido", "Caja + protección", "Tarjeta breve", "No se vende por separado"],
            personalizable: false,
            publicarCatalogo: true
        }
    ];

    const categories = [
        { nombre: "Figuras Esenciales", descripcion: "Opciones de entrada desde $14.990", icono: "fa-solid fa-cloud", color: "#b9d8e6", orden: 10 },
        { nombre: "Figuras Pintadas a Mano", descripcion: "Piezas con acabado artesanal", icono: "fa-solid fa-palette", color: "#d9b7a3", orden: 20 },
        { nombre: "Escenas Familiares", descripcion: "Recuerdos de 2 a 3 personas", icono: "fa-solid fa-heart", color: "#d8c6b6", orden: 30 },
        { nombre: "Packs y Regalos", descripcion: "Opciones para sorprender", icono: "fa-solid fa-gift", color: "#c7d8cf", orden: 40 },
        { nombre: "Placas y Extras", descripcion: "Detalles complementarios", icono: "fa-solid fa-message", color: "#c9cfe3", orden: 50 }
    ].map((category, index) => ({ ...category, id: `ksd-cat-${index+1}`, slug: category.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), activa: true, mostrarMenu: true, mostrarInicio: true, destacada: index < 4 }));

    window.KSD_PRODUCTS = products;
    window.KSD_CATEGORIES = categories;

})();
