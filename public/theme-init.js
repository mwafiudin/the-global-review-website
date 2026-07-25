(function () {
  try {
    var t = localStorage.getItem("tgr-theme");
    if (
      t === "dark" ||
      (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  } catch {}
})();
