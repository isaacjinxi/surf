(function () {
  const root = document.querySelector("[data-carousel]");
  const lightbox = document.getElementById("carousel-lightbox");
  if (!root) return;

  const track = root.querySelector(".carousel-track");
  const slides = root.querySelectorAll(".carousel-slide");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const zoomBtn = root.querySelector("[data-carousel-zoom]");

  if (!track || !slides.length || !prev || !next) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* smooth deceleration, GPU-friendly when paired with transform */
  const easeSmooth = "cubic-bezier(0.16, 1, 0.3, 1)";
  const openMs = reduceMotion ? 1 : 780;
  const closeMs = reduceMotion ? 1 : 680;
  const controlsDelay = reduceMotion ? 0 : Math.round(openMs * 0.55);

  let index = 0;
  const n = slides.length;

  function thumbImg(i) {
    return slides[((i % n) + n) % n].querySelector(".carousel-slide-inner img");
  }

  function go(i) {
    index = ((i % n) + n) % n;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  prev.addEventListener("click", function () {
    go(index - 1);
  });
  next.addEventListener("click", function () {
    go(index + 1);
  });

  if (!lightbox || !zoomBtn) return;

  const lbImg = lightbox.querySelector(".lightbox-img");
  const lbCloseEls = lightbox.querySelectorAll("[data-lightbox-close]");
  const lbMin = lightbox.querySelector("[data-lightbox-minimize]");
  const lbPrev = lightbox.querySelector("[data-lightbox-prev]");
  const lbNext = lightbox.querySelector("[data-lightbox-next]");

  if (!lbImg || !lbMin || !lbPrev || !lbNext) return;

  let lbOpen = false;
  let controlsTimer = 0;

  function destRect() {
    const tw = Math.min(window.innerWidth * 0.92, 1400);
    const th = Math.min(window.innerHeight * 0.88, 900);
    return {
      left: (window.innerWidth - tw) / 2,
      top: (window.innerHeight - th) / 2,
      width: tw,
      height: th,
    };
  }

  function setLightboxSrc(i) {
    const img = thumbImg(i);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
  }

  function clearControlsTimer() {
    if (controlsTimer) {
      clearTimeout(controlsTimer);
      controlsTimer = 0;
    }
  }

  function openLightbox() {
    if (lbOpen) return;
    lbOpen = true;
    clearControlsTimer();
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightbox.classList.remove("lightbox--ready");
    lightbox.classList.add("lightbox--open");

    const rect = thumbImg(index).getBoundingClientRect();
    setLightboxSrc(index);

    const d = destRect();
    const dw = Math.max(d.width, 1);
    const dh = Math.max(d.height, 1);

    lbImg.style.position = "fixed";
    lbImg.style.margin = "0";
    lbImg.style.zIndex = "10001";
    lbImg.style.left = d.left + "px";
    lbImg.style.top = d.top + "px";
    lbImg.style.width = dw + "px";
    lbImg.style.height = dh + "px";
    lbImg.style.objectFit = "contain";
    lbImg.style.borderRadius = "12px";
    lbImg.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.4)";
    lbImg.style.transformOrigin = "0 0";
    lbImg.style.opacity = "1";

    const dx = rect.left - d.left;
    const dy = rect.top - d.top;
    const sx = Math.max(rect.width, 1) / dw;
    const sy = Math.max(rect.height, 1) / dh;

    lbImg.style.transition = "none";
    lbImg.style.transform = "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        lbImg.style.transition = reduceMotion
          ? "none"
          : "transform " + openMs + "ms " + easeSmooth + ", border-radius " + Math.round(openMs * 0.5) + "ms ease";
        lbImg.style.transform = "translate(0, 0) scale(1, 1)";
      });
    });

    if (reduceMotion) {
      lightbox.classList.add("lightbox--ready");
    } else {
      controlsTimer = setTimeout(function () {
        lightbox.classList.add("lightbox--ready");
      }, controlsDelay);
    }
  }

  function closeLightbox() {
    if (!lbOpen) return;
    clearControlsTimer();
    lightbox.classList.remove("lightbox--ready");
    const rect = thumbImg(index).getBoundingClientRect();
    const d = destRect();
    const dw = Math.max(d.width, 1);
    const dh = Math.max(d.height, 1);
    const dx = rect.left - d.left;
    const dy = rect.top - d.top;
    const sx = Math.max(rect.width, 1) / dw;
    const sy = Math.max(rect.height, 1) / dh;

    lbImg.style.left = d.left + "px";
    lbImg.style.top = d.top + "px";
    lbImg.style.width = dw + "px";
    lbImg.style.height = dh + "px";
    lbImg.style.transformOrigin = "0 0";
    lbImg.style.transition = reduceMotion
      ? "none"
      : "transform " + closeMs + "ms " + easeSmooth + ", opacity 0.3s ease";
    lbImg.style.transform = "translate(" + dx + "px, " + dy + "px) scale(" + sx + ", " + sy + ")";

    lightbox.classList.remove("lightbox--open");

    setTimeout(function () {
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.removeAttribute("style");
      lbOpen = false;
    }, closeMs + 40);
  }

  function lightboxStep(delta) {
    go(index + delta);
    if (!reduceMotion) {
      lbImg.style.transition = "opacity 0.28s " + easeSmooth;
      lbImg.style.opacity = "0.82";
      window.setTimeout(function () {
        setLightboxSrc(index);
        lbImg.style.opacity = "1";
      }, 200);
    } else {
      setLightboxSrc(index);
    }
  }

  zoomBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    openLightbox();
  });

  lbMin.addEventListener("click", function (e) {
    e.stopPropagation();
    closeLightbox();
  });
  lbCloseEls.forEach(function (el) {
    el.addEventListener("click", function () {
      closeLightbox();
    });
  });
  lbPrev.addEventListener("click", function (e) {
    e.stopPropagation();
    lightboxStep(-1);
  });
  lbNext.addEventListener("click", function (e) {
    e.stopPropagation();
    lightboxStep(1);
  });

  document.addEventListener("keydown", function (e) {
    if (!lbOpen) return;
    if (e.key === "Escape") {
      closeLightbox();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      lightboxStep(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      lightboxStep(1);
    }
  });
})();
