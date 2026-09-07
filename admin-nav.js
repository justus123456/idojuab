(function () {
  "use strict";
  function setPage(page, updateHash) {
    document.querySelectorAll(".admin-page").forEach((section) => {
      section.hidden = section.dataset.adminPage !== page;
    });
    document.querySelectorAll(".admin-nav a[data-admin-page]").forEach((link) => {
      const active = link.dataset.adminPage === page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.body.dataset.adminPage = page;
    if (updateHash) history.replaceState(null, "", `#${page === "message" ? "message" : page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function pageFromHash() {
    const value = window.location.hash.replace("#", "");
    return document.querySelector(`.admin-nav a[href="#${value}"]`)?.dataset.adminPage || "dashboard";
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".admin-nav a[data-admin-page]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); setPage(link.dataset.adminPage, true); }));
    setPage(pageFromHash(), false);
    window.addEventListener("hashchange", () => setPage(pageFromHash(), false));
  });
})();