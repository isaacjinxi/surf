(function () {
  var footer = document.querySelector(".site-footer-reveal");
  if (!footer) return;

  var threshold = 64;

  function update() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var doc = document.documentElement;
    var maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
    var shortPage = maxScroll <= 8;
    var show = y > threshold || shortPage;
    footer.classList.toggle("is-visible", show);
    document.body.classList.toggle("has-footer-reveal", show);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
