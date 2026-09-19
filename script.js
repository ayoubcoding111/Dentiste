// Pacific Dental Clinic Dr Bedjaoui — base script (Task 1.1)
// Mobile hamburger menu
(function () {
  var toggle = document.getElementById("navToggle");
  var header = document.querySelector(".site-header");
  if (!toggle || !header) return;
  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  header.querySelectorAll(".nav-links a").forEach(function (link) {
    link.addEventListener("click", function () {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
    });
  });
})();

// Task 3.2: duplicate trust items for a seamless infinite loop
// Content is repeated to 4 identical copies so the track stays wider than
// the viewport on large screens; the CSS animation shifts -50% (2 copies),
// which loops seamlessly and never stops (no pause on hover/click).
(function () {
  var track = document.getElementById("trustTrack");
  if (!track) return;
  var clone = track.innerHTML;
  track.innerHTML += clone + clone + clone;
  Array.prototype.forEach.call(track.children, function (el, i) {
    if (i >= track.children.length / 2) el.setAttribute("aria-hidden", "true");
  });
})();

// Task 4.1: treatments horizontal scroll buttons
(function () {
  var scroll = document.getElementById("treatScroll");
  var prev = document.getElementById("treatPrev");
  var next = document.getElementById("treatNext");
  if (!scroll || !prev || !next) return;
  var step = function () {
    var card = scroll.querySelector(".treat-card");
    return card ? card.offsetWidth + 20 : 300;
  };
  prev.addEventListener("click", function () { scroll.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function () { scroll.scrollBy({ left: step(), behavior: "smooth" }); });
})();

// Task 4.2: Before / After sliders
(function () {
  document.querySelectorAll("[data-ba]").forEach(function (slider) {
    var range = slider.querySelector("[data-ba-range]");
    if (!range) return;
    var set = function (v) {
      v = Math.max(0, Math.min(100, Number(v)));
      slider.style.setProperty("--pos", v + "%");
    };
    set(range.value);
    range.addEventListener("input", function () { set(range.value); });
    // pointer drag anywhere on slider
    var dragging = false;
    var move = function (clientX) {
      var r = slider.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
      range.value = parseFloat(slider.style.getPropertyValue("--pos")) || 50;
    };
    slider.addEventListener("pointerdown", function (e) {
      if (e.target === range) return;
      dragging = true;
      slider.setPointerCapture && slider.setPointerCapture(e.pointerId);
      move(e.clientX);
    });
    slider.addEventListener("pointermove", function (e) {
      if (dragging) move(e.clientX);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      slider.addEventListener(ev, function () { dragging = false; });
    });
  });
})();

// Task 5.2: Clinic gallery
(function () {
  var mainImg = document.getElementById("galleryMainImg");
  var mainBox = document.getElementById("galleryMain");
  var title = document.getElementById("galleryCaptionTitle");
  var sub = document.getElementById("galleryCaptionSub");
  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".gallery-thumb"));
  if (!mainImg || !thumbs.length) return;
  var idx = 0;
  var show = function (i) {
    idx = (i + thumbs.length) % thumbs.length;
    var t = thumbs[idx];
    mainImg.style.opacity = "0";
    setTimeout(function () {
      mainImg.src = t.getAttribute("data-src");
      mainImg.alt = t.querySelector("img").alt;
      mainImg.style.opacity = "1";
    }, 150);
    if (title) title.textContent = t.getAttribute("data-title");
    if (sub) sub.textContent = t.getAttribute("data-sub");
    thumbs.forEach(function (x) { x.classList.remove("is-active"); });
    t.classList.add("is-active");
  };
  thumbs.forEach(function (t, i) {
    t.addEventListener("mouseenter", function () { show(i); });
    t.addEventListener("click", function () { show(i); });
    t.addEventListener("focus", function () { show(i); });
  });
  // Hover on main cycles through images one by one
  var timer = null;
  if (mainBox) {
    mainBox.addEventListener("mouseenter", function () {
      timer = setInterval(function () { show(idx + 1); }, 1200);
    });
    mainBox.addEventListener("mouseleave", function () {
      if (timer) clearInterval(timer);
    });
  }
})();

// Task 6.1: RDV form (front-end only)
(function () {
  var form = document.getElementById("rdvForm");
  var note = document.getElementById("formNote");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = form.nom.value.trim();
    var tel = form.tel.value.trim();
    var date = form.date.value;
    if (!nom || !tel || !date) {
      note.textContent = "Veuillez remplir le nom, le téléphone et la date.";
      note.classList.add("error");
      return;
    }
    note.classList.remove("error");
    note.textContent = "Merci " + nom + " ! Votre demande pour le " + date + " a bien été reçue. Nous vous appellerons au " + tel + " pour confirmer.";
    form.reset();
  });
})();

// FR / AR language toggle (lightweight, data-fr / data-ar attributes)
(function () {
  var btn = document.getElementById("langSwitch");
  if (!btn) return;
  var current = "fr";
  btn.addEventListener("click", function () {
    current = current === "fr" ? "ar" : "fr";
    document.documentElement.lang = current === "ar" ? "ar" : "fr";
    document.documentElement.dir = current === "ar" ? "rtl" : "ltr";
    btn.textContent = current === "ar" ? "AR" : "FR";
    document.querySelectorAll("[data-fr]").forEach(function (el) {
      el.innerHTML = current === "ar" ? el.getAttribute("data-ar") : el.getAttribute("data-fr");
    });
  });
})();

// Reveal on scroll
(function () {
  var els = document.querySelectorAll(".section .container, .trust .about");
  els.forEach(function (el) { el.classList.add("reveal"); });
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();
