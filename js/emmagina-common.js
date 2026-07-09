"use strict";

(function () {
  function initNav() {
    const menuButton = document.querySelector("[data-mobile-menu]");
    const nav = document.querySelector(".main-nav");
    menuButton?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(Boolean(open)));
    });

    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href === current || (current === "" && href === "index.html")) link.classList.add("is-active");
    });
  }

  function initSearch() {
    const panel = document.querySelector("[data-search-panel]");
    const open = document.querySelector("[data-open-search]");
    const close = document.querySelector("[data-close-search]");
    const input = panel?.querySelector("input[name='q']");
    open?.addEventListener("click", () => {
      panel?.classList.add("is-open");
      document.body.classList.add("no-scroll");
      setTimeout(() => input?.focus(), 30);
    });
    close?.addEventListener("click", () => {
      panel?.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    });
    panel?.addEventListener("click", (event) => {
      if (event.target === panel) close?.click();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initSearch();
    window.EmmaginaCart?.updateBadges();
  });
})();
