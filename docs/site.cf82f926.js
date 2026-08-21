/* Колобок. Общий скрипт для всех страниц. */
(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STORE = "kolobok.dovody";

  /* ---------------------------------------------------------------- тема */
  var themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var now = document.documentElement.getAttribute("data-theme");
      if (!now) {
        now = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      var next = now === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("kolobok.theme", next); } catch (e) {}
      themeBtn.setAttribute("aria-label", next === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
    });
  }

  /* ------------------------------------------------------------ доводы */
  function readTaken() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; }
  }
  function writeTaken(list) {
    try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) {}
  }

  var args = [].slice.call(document.querySelectorAll(".arg"));
  var total = 18;
  var taken = readTaken();

  function paintTally() {
    var n = taken.length;
    var pct = Math.round((n / total) * 100);
    document.querySelectorAll("[data-tally-n]").forEach(function (el) { el.textContent = n; });
    document.querySelectorAll("[data-tally-fill]").forEach(function (el) { el.style.width = pct + "%"; });
    document.querySelectorAll("[data-tally-text]").forEach(function (el) {
      el.textContent = n === 0 ? "пока ни одного, начни сверху"
        : n === total ? "все восемнадцать, вопрос закрыт"
        : "из восемнадцати, продолжай";
    });
  }

  args.forEach(function (b) {
    var id = b.getAttribute("data-id");
    if (taken.indexOf(id) !== -1) b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true";
      b.setAttribute("aria-pressed", on ? "false" : "true");
      if (on) { taken = taken.filter(function (x) { return x !== id; }); }
      else if (taken.indexOf(id) === -1) { taken.push(id); }
      writeTaken(taken);
      paintTally();
    });
  });
  paintTally();

  /* ------------------------------------------------------------ сообщения */
  var toast = document.getElementById("toast"), toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("on"); }, 2600);
  }

  var TG_USER = "CriminalGrande";

  function shareText() {
    var n = taken.length;
    if (n === 0) return "Открой и долистай. Там восемнадцать причин не лететь в Турцию.";
    if (n === total) return "Прочитал все восемнадцать доводов и согласен. Турция отменяется, иду на колобка.";
    return "Согласен с " + n + " доводами из восемнадцати. Турция под вопросом. Читай сам.";
  }
  function siteLink() {
    return location.origin + location.pathname.replace(/[^/]*$/, "");
  }

  var tg = document.getElementById("tg");
  if (tg) {
    tg.addEventListener("click", function () {
      // Телеграм не умеет подставлять текст в чат конкретному человеку по ссылке:
      // либо выбор чата с текстом, либо прямой чат без текста. Поэтому кладём
      // текст в буфер и открываем нужный чат, остаётся вставить.
      var msg = shareText() + " " + siteLink();
      var open = function () {
        window.open("https://t.me/" + TG_USER, "_blank", "noopener");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(function () {
          say("Текст скопирован. Вставь его в чат");
          open();
        }, function () {
          say("Скопируй текст со страницы и вставь в чат");
          open();
        });
      } else {
        say("Скопируй текст со страницы и вставь в чат");
        open();
      }
    });
  }

  var copy = document.getElementById("copy");
  if (copy) {
    copy.addEventListener("click", function () {
      var link = siteLink();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(
          function () { say("Ссылка скопирована"); },
          function () { say("Скопируй ссылку из адресной строки"); }
        );
      } else { say("Скопируй ссылку из адресной строки"); }
    });
  }

  /* ------------------------------------------------------------ подсказки на графике */
  var tip = document.getElementById("tip");
  function showTip(el, e) {
    if (!tip) return;
    var label = el.getAttribute("data-tip");
    if (!label) return;
    tip.textContent = label;
    var r = el.getBoundingClientRect();
    tip.style.left = (e && e.clientX ? e.clientX : r.left + r.width / 2) + "px";
    tip.style.top = r.top + "px";
    tip.classList.add("on");
  }
  function hideTip() { if (tip) tip.classList.remove("on"); }
  document.querySelectorAll("[data-tip]").forEach(function (el) {
    el.addEventListener("mousemove", function (e) { showTip(el, e); });
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("focus", function () { showTip(el, null); });
    el.addEventListener("blur", hideTip);
  });

  /* ------------------------------------------------------------ появление и рост столбцов */
  function fillBars(scope) {
    scope.querySelectorAll("[data-w]").forEach(function (el) {
      el.style.width = el.getAttribute("data-w") + "%";
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        fillBars(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    fillBars(document);
  }
  if (reduce) fillBars(document);
})();
