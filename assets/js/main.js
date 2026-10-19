/* Barber Shop Adelsdorf – kleine Interaktionen, keine externen Abhängigkeiten,
   keine Cookies, kein Tracking. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header & Menü ---------- */
  var header = document.querySelector(".site-header");
  var nav = document.getElementById("nav");
  var menuBtn = document.querySelector(".menu-btn");
  var hero = document.querySelector(".hero");
  var quickbar = document.querySelector(".quickbar");

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
  }

  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  document.addEventListener("click", function (e) {
    if (nav && nav.classList.contains("is-open") && !e.target.closest(".site-header")) setMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) setMenu(false);
  });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header && !header.classList.contains("site-header--static")) {
      header.classList.toggle("is-solid", y > 40);
    }
    if (quickbar) {
      var limit = hero ? hero.offsetHeight * 0.6 : 200;
      quickbar.classList.toggle("is-visible", y > limit);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Aktiver Menüpunkt ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Einblend-Animationen ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Öffnungszeiten: heutigen Tag markieren ---------- */
  // 0 = Sonntag … 6 = Samstag; Zeiten in Minuten (Europe/Berlin)
  var HOURS = {
    1: [600, 1140], 2: [600, 1140], 3: [600, 1140], 4: [600, 1140], 5: [600, 1140],
    6: [540, 960],
    0: null
  };
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function berlinNow() {
    try {
      var parts = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].indexOf(o.weekday.replace(".", ""));
      if (wd < 0) throw new Error("weekday");
      return { day: wd, min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  var now = berlinNow();
  var row = document.querySelector('.hours tr[data-days~="' + now.day + '"]');
  if (row) row.classList.add("is-today");

  var status = document.querySelector(".status");
  if (status) {
    var today = HOURS[now.day];
    var text;
    if (today && now.min >= today[0] && now.min < today[1]) {
      status.classList.add("is-open");
      text = "<strong>Jetzt geöffnet</strong> · heute bis " + fmt(today[1]) + " Uhr";
    } else if (today && now.min < today[0]) {
      text = "<strong>Heute geöffnet</strong> · ab " + fmt(today[0]) + " Uhr";
    } else {
      var n = (now.day + 1) % 7, guard = 0;
      while (!HOURS[n] && guard < 7) { n = (n + 1) % 7; guard++; }
      var label = n === (now.day + 1) % 7 ? "morgen" : DAYS[n];
      text = "<strong>Gerade geschlossen</strong> · wieder " + label + " ab " + fmt(HOURS[n][0]) + " Uhr";
    }
    status.querySelector(".status__text").innerHTML = text;
    status.hidden = false;
  }

  /* ---------- Jahr im Footer ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
