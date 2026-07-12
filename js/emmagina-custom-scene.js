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
      upload: "Para impresión a pedido puedes subir STL, OBJ, 3MF, ZIP o fotos de referencia si aún no tienes archivo.",
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

  typeButtons.forEach((button) => button.addEventListener("click", () => setType(button.dataset.requestType || "figura")));
  quickLinks.forEach((link) => link.addEventListener("click", () => setType(link.dataset.selectService || "figura")));

  const params = new URLSearchParams(window.location.search);
  const initialType = params.get("tipo") === "servicio" ? "servicio" : params.get("tipo") === "idea" ? "idea" : "figura";
  setType(initialType);

  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-scene-message]");
    const formData = new FormData(form);
    const name = String(formData.get("nombre") || "").trim();
    const type = String(formData.get("tipoSolicitud") || "figura").trim();
    const label = type === "servicio" ? "impresión 3D a pedido" : type === "idea" ? "idea personalizada" : "figura o retrato 3D";
    if (message) {
      message.innerHTML = `<div class="state-box"><p><strong>${name ? `${name}, ` : ""}tu solicitud de ${label} quedó preparada.</strong></p><p>En la siguiente etapa conectaremos este formulario al backend para guardar archivos, generar folio y enviar notificación por correo o WhatsApp.</p></div>`;
    }
    form.reset();
    setType("figura");
  });
})();
