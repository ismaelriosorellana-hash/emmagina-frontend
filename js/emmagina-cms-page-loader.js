"use strict";

(async function () {
  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  const main = document.querySelector("#main[data-cms-page], #main");
  if (!main || !window.EmmaginaRenderEngine) return;

  const isHome = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === "/" || window.location.pathname.endsWith("/");
  const key = main.dataset.cmsPage || queryParam("slug") || queryParam("page") || (isHome ? "home" : "");
  if (!key) return;

  await window.EmmaginaRenderEngine.renderPageFromCms({
    mount: main,
    key,
    keepFallback: true
  });
})();
