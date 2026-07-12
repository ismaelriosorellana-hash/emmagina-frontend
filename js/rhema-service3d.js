"use strict";

(function () {
  const form = document.querySelector("[data-service3d-form]");
  if (!form) return;

  const cards = Array.from(document.querySelectorAll("[data-service-type]"));
  const formatInput = form.querySelector("[data-service3d-format-input]");
  const selection = document.querySelector("[data-service3d-selection]");
  const fileInput = document.getElementById("service3d-files");
  const fileList = document.querySelector("[data-service3d-file-list]");
  const message = document.querySelector("[data-service3d-message]");
  const submitButton = form.querySelector("button[type='submit']");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setType(value) {
    const type = String(value || "Tengo un archivo 3D");
    cards.forEach((card) => card.classList.toggle("is-selected", card.dataset.serviceType === type));
    if (formatInput) formatInput.value = type;
    if (selection) selection.textContent = type;
  }

  function showMessage(type, html) {
    if (!message) return;
    message.innerHTML = `<div class="state-box ${type === "error" ? "state-error" : type === "success" ? "state-success" : ""}">${html}</div>`;
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updateFileList() {
    const files = Array.from(fileInput?.files || []);
    if (!fileList) return;
    if (!files.length) {
      fileList.textContent = "Sin archivos seleccionados.";
      return;
    }
    fileList.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)} · ${(file.size / 1024 / 1024).toFixed(1)} MB</span>`).join("");
  }

  function validateFiles(files) {
    if (files.length > 8) throw new Error("Puedes subir hasta 8 archivos por solicitud.");
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) throw new Error(`El archivo ${file.name} supera el máximo de 20 MB.`);
    });
  }

  cards.forEach((card) => card.addEventListener("click", () => {
    setType(card.dataset.serviceType);
    document.getElementById("service3d-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  fileInput?.addEventListener("change", updateFileList);
  setType(formatInput?.value);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const files = Array.from(fileInput?.files || []);
      validateFiles(files);

      const formData = new FormData(form);
      const description = String(formData.get("descripcion") || "").trim();
      const technicalUse = String(formData.get("usoTecnico") || "").trim();
      const idealDate = String(formData.get("fechaIdeal") || "").trim();
      const type = String(formData.get("formato") || "").trim();

      if (!description) throw new Error("Describe la pieza y el uso que tendrá.");
      if (!files.length && description.length < 30) throw new Error("Sin archivo, necesitamos una descripción más detallada de la idea, medidas y uso.");

      formData.set("descripcion", [
        description,
        type ? `Punto de partida: ${type}` : "",
        technicalUse ? `Uso esperado: ${technicalUse}` : "",
        idealDate ? `Fecha ideal: ${idealDate}` : "",
        files.length ? `Archivos adjuntos: ${files.length}` : "Sin archivo adjunto"
      ].filter(Boolean).join("\n"));
      formData.delete("usoTecnico");
      formData.delete("fechaIdeal");
      formData.set("origenUrl", window.location.href);

      submitButton.disabled = true;
      submitButton.textContent = "Enviando solicitud...";
      showMessage("info", "<p><strong>Estamos enviando tu solicitud técnica.</strong></p><p>Puede tardar algunos segundos si adjuntaste archivos pesados.</p>");

      const result = await window.EmmaginaAPI.createCustomRequest(formData);
      const folio = result?.folio || result?.solicitud?.folio || "";
      showMessage("success", `
        <p><strong>Solicitud recibida correctamente.</strong></p>
        ${folio ? `<p>Tu folio es <strong>${escapeHtml(folio)}</strong>. Guárdalo para seguimiento.</p><p><a class="btn btn-soft btn-small" href="cotizacion.html?folio=${encodeURIComponent(folio)}">Consultar esta solicitud</a></p>` : ""}
        <p>Revisaremos el archivo, medidas y uso antes de confirmar precio y plazo.</p>
      `);
      form.reset();
      setType("Tengo un archivo 3D");
      updateFileList();
    } catch (error) {
      showMessage("error", `<p><strong>No pudimos enviar la solicitud.</strong></p><p>${escapeHtml(error.message || "Revisa los datos e intenta nuevamente.")}</p>`);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar solicitud técnica";
    }
  });
})();
