// Mobile hero RDV button — jump straight to the form and focus it for typing
(function () {
  var btn = document.querySelector(".hero-cta--overlay a[href='#rdvForm']");
  if (!btn) return;
  btn.addEventListener("click", function () {
    setTimeout(function () {
      var name = document.getElementById("nom");
      if (name) name.focus({ preventScroll: true });
    }, 650);
  });
})();

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

// Task 5.1: duplicate review cards for seamless infinite rows
// Each track is cloned to 4 identical copies; the CSS animation shifts -50%
// (2 copies), which loops seamlessly and never stops.
(function () {
  document.querySelectorAll("[data-reviews-track]").forEach(function (track) {
    var clone = track.innerHTML;
    track.innerHTML += clone + clone + clone;
    Array.prototype.forEach.call(track.children, function (el, i) {
      if (i >= track.children.length / 2) el.setAttribute("aria-hidden", "true");
    });
  });
})();

// Infinite one-by-one carousel (treatments + before/after).
// 3 copies of the cards; the middle copy is the live zone.
// - Arrows: invisible instant pre-jump when near an edge, then ONE smooth step.
// - Swipe: after the scroll settles, invisible rebase back to the middle copy.
// - Snap is OFF only during the instant jumps, so no glitch and no full rewind.
function makeInfiniteCarousel(scroll, prev, next, itemSelector, markClones) {
  if (!scroll) return;
  var originals = Array.prototype.slice.call(scroll.children);
  [0, 1].forEach(function () {
    originals.forEach(function (c) {
      var cl = c.cloneNode(true);
      if (markClones) markClones(cl);
      scroll.appendChild(cl);
    });
  });
  var third = function () { return scroll.scrollWidth / 3; };
  var step = function () {
    var card = scroll.querySelector(itemSelector);
    if (!card) return 300;
    var cs = window.getComputedStyle(scroll);
    var gap = parseFloat(((cs.columnGap || cs.gap || "0") + "").replace("px", "")) || 0;
    return card.offsetWidth + gap;
  };
  var EPS = 8;
  var snapOff = function () { scroll.style.scrollSnapType = "none"; };
  var snapOn = function () { scroll.style.removeProperty("scroll-snap-type"); };
  // Invisible instant rebase that keeps the same visual card on screen.
  var rebase = function () {
    var w = third();
    if (scroll.scrollLeft >= w * 2 - EPS) {
      snapOff();
      scroll.scrollLeft -= w;
      void scroll.offsetWidth;
      snapOn();
    } else if (scroll.scrollLeft <= EPS) {
      snapOff();
      scroll.scrollLeft += w;
      void scroll.offsetWidth;
      snapOn();
    }
  };
  // Start in the middle copy (after layout so widths are final).
  var placeMiddle = function () {
    snapOff();
    scroll.scrollLeft = third();
    void scroll.offsetWidth;
    snapOn();
  };
  requestAnimationFrame(placeMiddle);
  window.addEventListener("load", placeMiddle);
  var rT = null;
  window.addEventListener("resize", function () {
    if (rT) clearTimeout(rT);
    rT = setTimeout(placeMiddle, 150);
  });
  // Swipe: rebase only AFTER scrolling settles — never mid-gesture.
  var settleT = null;
  var queueRebase = function () {
    if (settleT) clearTimeout(settleT);
    settleT = setTimeout(rebase, 120);
  };
  scroll.addEventListener("scroll", queueRebase, { passive: true });
  if ("onscrollend" in scroll) scroll.addEventListener("scrollend", rebase);
  var busy = false;
  var go = function (dir) {
    if (busy) return;
    busy = true;
    var s = step();
    var w = third();
    var target = scroll.scrollLeft + dir * s;
    // Pre-jump invisibly when the single step would cross the edge.
    if (dir > 0 && target >= w * 2 - EPS) {
      snapOff();
      scroll.scrollLeft -= w;
      void scroll.offsetWidth;
      snapOn();
    } else if (dir < 0 && target <= EPS) {
      snapOff();
      scroll.scrollLeft += w;
      void scroll.offsetWidth;
      snapOn();
    }
    scroll.scrollBy({ left: dir * s, behavior: "smooth" });
    setTimeout(function () { busy = false; rebase(); }, 500);
  };
  if (prev) prev.addEventListener("click", function () { go(-1); });
  if (next) next.addEventListener("click", function () { go(1); });
}

// Task 4.1: treatments carousel
makeInfiniteCarousel(
  document.getElementById("treatScroll"),
  document.getElementById("treatPrev"),
  document.getElementById("treatNext"),
  ".treat-card",
  function (cl) {
    cl.setAttribute("aria-hidden", "true");
    cl.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
  }
);

// Task 4.2: BA carousel — same engine.
// Must run BEFORE the [data-ba] init below so clones get compare handlers.
makeInfiniteCarousel(
  document.getElementById("baScroll"),
  document.getElementById("baPrev"),
  document.getElementById("baNext"),
  ".ba-slider",
  null
);

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
  var isAr = function () { return document.documentElement.lang === "ar"; };
  var caption = function () {
    var t = thumbs[idx];
    if (title) title.textContent = isAr() && t.getAttribute("data-title-ar") ? t.getAttribute("data-title-ar") : t.getAttribute("data-title");
    if (sub) sub.textContent = isAr() && t.getAttribute("data-sub-ar") ? t.getAttribute("data-sub-ar") : t.getAttribute("data-sub");
  };
  var show = function (i) {
    idx = (i + thumbs.length) % thumbs.length;
    var t = thumbs[idx];
    mainImg.style.opacity = "0";
    setTimeout(function () {
      mainImg.src = t.getAttribute("data-src");
      mainImg.alt = t.querySelector("img").alt;
      mainImg.style.opacity = "1";
    }, 150);
    caption();
    thumbs.forEach(function (x) { x.classList.remove("is-active"); });
    t.classList.add("is-active");
  };
  document.addEventListener("site-lang", caption);
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

// Task 6.1: country select updates the phone prefix
// Options carry full "+213 Algérie" labels; the closed select shows only
// the short code (DZ) via data-short so the unit stays compact.
(function () {
  var cc = document.getElementById("cc");
  var prefix = document.getElementById("phonePrefix");
  if (!cc || !prefix) return;
  var sync = function () {
    Array.prototype.forEach.call(cc.options, function (opt) {
      if (!opt.getAttribute("data-full")) opt.setAttribute("data-full", opt.textContent);
      opt.textContent = opt.selected ? opt.getAttribute("data-short") : opt.getAttribute("data-full");
    });
    prefix.textContent = cc.value;
  };
  cc.addEventListener("change", sync);
  sync();
})();

// Task 6.1: clicking the date field opens the calendar popup
(function () {
  var date = document.getElementById("date");
  if (!date || typeof date.showPicker !== "function") return;
  date.addEventListener("click", function () {
    try { date.showPicker(); } catch (e) {}
  });
})();

// Task 6.1: phone field accepts digits only
(function () {
  var tel = document.getElementById("tel");
  if (!tel) return;
  tel.addEventListener("input", function () {
    tel.value = tel.value.replace(/[^0-9]/g, "");
  });
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
    var isAr = document.documentElement.lang === "ar";
    if (!nom || !tel || !date) {
      note.textContent = isAr ? "يرجى ملء الاسم والهاتف والتاريخ." : "Veuillez remplir le nom, le téléphone et la date.";
      note.classList.add("error");
      return;
    }
    note.classList.remove("error");
    note.textContent = isAr
      ? "شكرًا " + nom + " ! تم استلام طلبك ليوم " + date + ". سنتصل بك على " + tel + " للتأكيد."
      : "Merci " + nom + " ! Votre demande pour le " + date + " a bien été reçue. Nous vous appellerons au " + tel + " pour confirmer.";
    form.reset();
  });
})();

// FR / AR language dropdown (globe + menu)
// Swaps innerHTML ([data-fr]/[data-ar]), placeholders ([data-ph-fr]/[data-ph-ar]),
// aria-labels ([data-aria-fr]/[data-aria-ar]) and the page title.
var SITE_TITLES = {
  fr: "Pacific Dental Clinic Dr Bedjaoui | Dentiste à Saïd Hamdine, Alger",
  ar: "عيادة Pacific Dental للدكتور بجاوي | طبيب أسنان في سعيد حمدين، الجزائر"
};
(function () {
  var dropdown = document.getElementById("langDropdown");
  var btn = document.getElementById("langSwitch");
  var menu = document.getElementById("langMenu");
  var current = document.getElementById("langCurrent");
  if (!dropdown || !btn || !menu) return;
  var lang = "fr";
  var setLang = function (next) {
    lang = next;
    var isAr = lang === "ar";
    document.documentElement.lang = isAr ? "ar" : "fr";
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    if (current) current.textContent = isAr ? "AR" : "FR";
    document.title = isAr ? SITE_TITLES.ar : SITE_TITLES.fr;
    menu.querySelectorAll("[data-lang]").forEach(function (opt) {
      opt.classList.toggle("is-active", opt.getAttribute("data-lang") === lang);
    });
    document.querySelectorAll("[data-fr]").forEach(function (el) {
      el.innerHTML = isAr ? el.getAttribute("data-ar") : el.getAttribute("data-fr");
    });
    document.querySelectorAll("[data-ph-fr]").forEach(function (el) {
      el.setAttribute("placeholder", isAr ? el.getAttribute("data-ph-ar") : el.getAttribute("data-ph-fr"));
    });
    document.querySelectorAll("[data-aria-fr]").forEach(function (el) {
      el.setAttribute("aria-label", isAr ? el.getAttribute("data-aria-ar") : el.getAttribute("data-aria-fr"));
    });
    document.dispatchEvent(new CustomEvent("site-lang", { detail: { lang: lang } }));
  };
  var close = function () {
    dropdown.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  };
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = dropdown.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  menu.addEventListener("click", function (e) {
    var opt = e.target.closest("[data-lang]");
    if (!opt) return;
    setLang(opt.getAttribute("data-lang"));
    close();
  });
  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();

// Reveal on scroll
(function () {
  var els = document.querySelectorAll(".section .container, .booking-grid, .trust .about");
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
