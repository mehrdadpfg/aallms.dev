/* aallms — theme boot (plain JS, runs before first paint)
   Each page is a separate HTML document, so the chosen theme is persisted in
   localStorage and re-applied synchronously here — that way navigating between
   the landing and any chapter never flashes a different theme. Default: dark. */
(function () {
  try {
    var t = localStorage.getItem("aallms:theme");
    if (t !== "light" && t !== "dark") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
