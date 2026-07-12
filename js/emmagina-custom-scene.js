"use strict";

(function () {
  const form = document.querySelector("[data-scene-form]");
  const typeButtons = Array.from(document.querySelectorAll("[data-request-type]"));
  const quickLinks = Array.from(document.querySelectorAll("[data-select-service]"));
  const typeInput = document.querySelector("[data-request-input]");
  const help = document.querySelector("[data-request-help]");
  const uploadGuide = document.querySelector("[data-upload-guide]");
  const figureFields = Array.from(document.querySelectorAll("[data-figura-field]"));
  const serviceFields = Array.from(document.querySelectorAll("[data-service-field]"));
  const submitButton = form?.querySelector("button[type='submit']");

  const config = {
    figura: {
      help: "Envíanos fotos claras y una descripción del recuerdo que quieres convertir en figura.",
      upload: "Para figuras o retratos, sube fotos claras de frente y referencias del estilo que buscas.",
      placeholder: "Ej: Quiero una figura de mi familia con nuestra mascota, estilo tierno, para regalar en un cumpleaños.",
      showFigure: true,
      showService: false
    },
    servicio: {
      help: "Sube tu archivo 3D o una foto de la pieza. Revisaremos tamaño, material, tiempo y viabilidad.",
      upload: "Para impresión a pedido puedes subir STL, OBJ, 3MF, STEP, ZIP, PDF o fotos de referencia si aún no tienes archivo.",
      placeholder: "Ej: Necesito imprimir un soporte para escritorio. Tengo archivo STL y quiero 3 unidades en color negro.",
      showFigure: false,
      showService: true
    },
    idea: {
      help: "No necesitas tener archivo. Puedes enviar una foto, dibujo o referencia y vemos si se puede transformar en pieza 3D.",
      upload: "Sube imágenes, bocetos o referencias. Mientras más claro sea el ejemplo, más fácil será cotizar.",
      placeholder: "Ej: Tengo una idea para un organizador de cables, pero no tengo modelo. Quiero saber si se puede fabricar.",
      showFigure: false,
      showService: true
    }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setType(type) {
    const data = config[type] || config.figura;
    typeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.requestType === type));
    if (typeInput) typeInput.value = type;
    if (help) help.textContent = data.help;
    if (uploadGuide) uploadGuide.textContent = data.upload;
    figureFields.forEach((field) => { field.hidden = !data.showFigure; });
    serviceFields.forEach((field) => { field.hidden = !data.showService; });
    const textarea = document.getElementById("scene-moment");
    if (textarea) textarea.placeholder = data.placeholder;
  }

  function setLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Enviando solicitud..." : "Enviar solicitud";
  }

  function showMessage(type, html) {
    const message = document.querySelector("[data-scene-message]");
    if (!message) return;
    message.innerHTML = `<div class="state-box ${type === "error" ? "state-error" : "state-success"}">${html}</div>`;
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function validateFileSize(files) {
    const maxSize = 20 * 1024 * 1024;
    const maxFiles = 8;
    if (files.length > maxFiles) {
      throw new Error(`Puedes subir hasta ${maxFiles} archivos por solicitud.`);
    }
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        throw new Error(`El archivo ${file.name} supera el máximo de 20 MB.`);
      }
    });
  }

  typeButtons.forEach((button) => button.addEventListener("click", () => setType(button.dataset.requestType || "figura")));
  quickLinks.forEach((link) => link.addEventListener("click", () => setType(link.dataset.selectService || "figura")));

  const params = new URLSearchParams(window.location.search);
  const initialType = params.get("tipo") === "servicio" ? "servicio" : params.get("tipo") === "idea" ? "idea" : "figura";
  setType(initialType);

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(form);
      const files = document.getElementById("scene-files")?.files || [];
      validateFileSize(files);

      if (!String(formData.get("nombre") || "").trim()) {
        throw new Error("Ingresa tu nombre para poder contactarte.");
      }
      if (!String(formData.get("whatsapp") || "").trim()) {
        throw new Error("Ingresa un WhatsApp de contacto.");
      }
      if (!String(formData.get("descripcion") || "").trim()) {
        throw new Error("Describe brevemente qué quieres crear o imprimir.");
      }

      formData.set("origenUrl", window.location.href);
      setLoading(true);
      showMessage("info", "<p><strong>Estamos enviando tu solicitud.</strong></p><p>Si subiste archivos pesados, esto puede tardar unos segundos.</p>");

      const result = await window.EmmaginaAPI.createCustomRequest(formData);
      const folio = result?.folio || result?.solicitud?.folio || "";
      const label = String(formData.get("tipoSolicitud") || "figura") === "servicio"
        ? "impresión 3D a pedido"
        : String(formData.get("tipoSolicitud") || "figura") === "idea"
          ? "idea personalizada"
          : "figura o retrato 3D";

      showMessage("success", `
        <p><strong>Solicitud recibida correctamente.</strong></p>
        ${folio ? `<p>Tu folio es <strong>${escapeHtml(folio)}</strong>. Guárdalo para seguimiento.</p><p><a class="btn btn-soft btn-small" href="cotizacion.html?folio=${encodeURIComponent(folio)}">Consultar esta solicitud</a></p>` : ""}
        <p>Revisaremos tu solicitud de ${escapeHtml(label)} y te responderemos con precio, tiempo estimado y recomendaciones.</p>
      `);

      form.reset();
      setType("figura");
    } catch (error) {
      showMessage("error", `
        <p><strong>No pudimos enviar la solicitud.</strong></p>
        <p>${escapeHtml(error.message || "Revisa los datos e intenta nuevamente.")}</p>
      `);
    } finally {
      setLoading(false);
    }
  });
})();
