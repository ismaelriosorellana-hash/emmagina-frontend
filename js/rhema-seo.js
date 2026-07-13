"use strict";

(function () {
  const PRIVATE_PATHS = new Set([
    "/acceso.html",
    "/cuenta.html",
    "/carrito.html",
    "/finalizar-compra.html",
    "/pago.html",
    "/pedido.html",
    "/cotizacion.html",
    "/seguimiento-pedido.html",
    "/comparacion.html"
  ]);

  const PAGE_META = {
    "/": {
      title: "Rhema Diseños | Impresión 3D, regalos y soluciones en Santiago",
      description: "Productos impresos en 3D, regalos personalizados, línea Memories, línea Alma y fabricación a pedido en Santiago."
    },
    "/index.html": {
      title: "Rhema Diseños | Impresión 3D, regalos y soluciones en Santiago",
      description: "Productos impresos en 3D, regalos personalizados, línea Memories, línea Alma y fabricación a pedido en Santiago."
    },
    "/catalogo.html": {
      title: "Tienda de impresión 3D | Rhema Diseños",
      description: "Explora productos de escritorio, decoración, figuras, Memories, Alma y servicios de impresión 3D en Santiago."
    },
    "/memories.html": {
      title: "Memories: recuerdos desde fotografías | Rhema Diseños",
      description: "Convierte fotografías familiares o de mascotas en litofanías, cuadros en relieve y recuerdos impresos en 3D."
    },
    "/alma.html": {
      title: "Alma: figuras y escenas personalizadas | Rhema Diseños",
      description: "Solicita figuras individuales, dúos y escenas familiares personalizadas a partir de fotografías y referencias."
    },
    "/servicio-3d.html": {
      title: "Servicio de impresión 3D a pedido en Santiago | Rhema Diseños",
      description: "Cotiza impresión de archivos STL, OBJ, 3MF, prototipos simples, organizadores y repuestos no críticos en PLA."
    },
    "/pedido-personalizado.html": {
      title: "Crea tu figura o proyecto personalizado | Rhema Diseños",
      description: "Envía tu idea, fotografía o archivo 3D y solicita una evaluación personalizada de fabricación."
    },
    "/quienes-somos.html": {
      title: "Sobre Rhema Diseños | Taller creativo de impresión 3D",
      description: "Conoce Rhema Diseños, un taller de impresión 3D enfocado en productos, recuerdos y soluciones personalizadas en Santiago."
    },
    "/contacto.html": {
      title: "Contacto | Rhema Diseños",
      description: "Contacta a Rhema Diseños para resolver dudas sobre productos, cotizaciones, pedidos y fabricación personalizada."
    },
    "/ayuda.html": {
      title: "Centro de ayuda | Rhema Diseños",
      description: "Encuentra información sobre compras, cotizaciones, seguimiento, retiros, despachos, cambios y seguridad."
    }
  };

  function upsertMeta(selector, attributes) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      document.head.appendChild(element);
    }
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function setCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }

  function addJsonLd(id, value) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(value);
  }

  const path = location.pathname || "/";
  const isAdmin = path.startsWith("/admin/");
  const isPrivate = isAdmin || PRIVATE_PATHS.has(path);
  const cleanPath = path === "/index.html" ? "/" : path;
  const canonical = `${location.origin}${cleanPath}`;
  const configured = PAGE_META[path] || PAGE_META[cleanPath] || {};
  const title = configured.title || document.title || "Rhema Diseños";
  const description = configured.description || document.querySelector('meta[name="description"]')?.content || "Rhema Diseños: productos y soluciones impresas en 3D.";

  if (configured.title) document.title = configured.title;
  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: isPrivate ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large"
  });

  if (!isPrivate) setCanonical(canonical);

  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Rhema Diseños" });
  upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "es_CL" });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: path.includes("producto") ? "product" : "website" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

  if (!isPrivate) {
    addJsonLd("rhema-local-business-schema", {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "Store"],
      name: "Rhema Diseños",
      description: "Taller de impresión 3D, regalos personalizados y fabricación a pedido.",
      url: location.origin,
      areaServed: {
        "@type": "City",
        name: "Santiago de Chile"
      },
      currenciesAccepted: "CLP",
      paymentAccepted: "Mercado Pago",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Productos y servicios de impresión 3D"
      }
    });
  }

  if (cleanPath === "/") {
    addJsonLd("rhema-website-schema", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Rhema Diseños",
      url: `${location.origin}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${location.origin}/catalogo.html?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });
  }
})();
