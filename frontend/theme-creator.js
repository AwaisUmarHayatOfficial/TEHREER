/* Custom colour theme: picks a brand, accent and background colour and previews them live. */
(function () {
  var KEY = "site_custom_theme";
  var DEFAULTS = { brand: "#1f3a5f", accent: "#b8862b", bg: "#f5f7fa" };
  var HEX = /^#[0-9a-f]{6}$/i;

  function rgb(h) {
    h = h.replace("#", "");
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
  }
  function hex(c) {
    return "#" + c.map(function (v) {
      return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
    }).join("");
  }
  function mix(a, b, t) {
    var A = rgb(a), B = rgb(b);
    return hex(A.map(function (v, i) { return v + (B[i] - v) * t; }));
  }
  function luminance(h) {
    var c = rgb(h).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function readableInk(h) {
    return luminance(h) > 0.179 ? "#111827" : "#ffffff";
  }

  function derive(s) {
    var b = s.brand, a = s.accent, g = s.bg;
    var dark = luminance(g) < 0.18;
    var text = dark ? "#f1f5fb" : "#111827";
    var surface = dark ? mix(g, "#ffffff", 0.06) : "#ffffff";
    return {
      "--primary": b,
      "--primary-deep": mix(b, "#000000", 0.25),
      "--primary-ink": readableInk(b),
      "--accent": a,
      "--accent-soft": mix(a, g, 0.85),
      "--accent-ink": mix(a, text, 0.3),
      "--cta": a,
      "--cta-ink": readableInk(a),
      "--bg": g,
      "--surface": surface,
      "--surface-2": mix(g, text, 0.05),
      "--ink": text,
      "--ink-2": mix(text, g, 0.25),
      "--ink-3": mix(text, g, 0.42),
      "--line": mix(text, g, 0.82),
      "--line-2": mix(text, g, 0.9),
      "--hero-bg": b,
      "--hero-ink": readableInk(b),
      "--hero-ink-2": mix(readableInk(b), b, 0.25)
    };
  }

  function applyColors(s) {
    var vars = derive(s);
    Object.keys(vars).forEach(function (k) {
      document.documentElement.style.setProperty(k, vars[k]);
    });
  }

  function clearColors() {
    Object.keys(derive(DEFAULTS)).forEach(function (k) {
      document.documentElement.style.removeProperty(k);
    });
  }

  function loadSaved() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && HEX.test(s.brand) && HEX.test(s.accent) && HEX.test(s.bg)) return s;
    } catch (e) {}
    return null;
  }

  function store(s) {
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  var saved = loadSaved();
  if (saved) applyColors(saved);

  document.addEventListener("sitethemechange", function () {
    saved = null;
    store(null);
    clearColors();
  });

  var panel = null;

  function readInputs() {
    var s = {};
    panel.querySelectorAll("input[data-k]").forEach(function (el) { s[el.getAttribute("data-k")] = el.value; });
    return s;
  }

  function setInputs(s) {
    panel.querySelectorAll("input[data-k]").forEach(function (el) { el.value = s[el.getAttribute("data-k")]; });
  }

  function close() {
    panel.hidden = true;
    if (saved) applyColors(saved); else clearColors();
  }

  function build() {
    panel = document.createElement("div");
    panel.className = "tc-backdrop";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="tc-dialog" role="dialog" aria-modal="true" aria-labelledby="tcTitle">' +
      '<h2 id="tcTitle">Customize colors</h2>' +
      '<p class="fine">Pick colors and the page updates as you go. Save to keep them in this browser.</p>' +
      '<label class="tc-row"><span>Brand color<small>Header, hero and main buttons</small></span><input type="color" data-k="brand"></label>' +
      '<label class="tc-row"><span>Accent color<small>Highlights, links and call-to-action buttons</small></span><input type="color" data-k="accent"></label>' +
      '<label class="tc-row"><span>Page background<small>Background behind the content</small></span><input type="color" data-k="bg"></label>' +
      '<div class="tc-actions">' +
      '<button type="button" class="btn ghost sm" data-act="reset">Reset to design</button>' +
      '<button type="button" class="btn ghost sm" data-act="cancel">Cancel</button>' +
      '<button type="button" class="btn primary sm" data-act="save">Save colors</button>' +
      "</div></div>";
    document.body.appendChild(panel);

    panel.addEventListener("input", function () { applyColors(readInputs()); });
    panel.addEventListener("click", function (e) {
      if (e.target === panel) { close(); return; }
      var act = e.target.getAttribute("data-act");
      if (act === "cancel") close();
      if (act === "save") {
        saved = readInputs();
        store(saved);
        panel.hidden = true;
      }
      if (act === "reset") {
        saved = null;
        store(null);
        clearColors();
        setInputs(DEFAULTS);
        panel.hidden = true;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  }

  function open() {
    if (!panel) build();
    setInputs(saved || DEFAULTS);
    panel.hidden = false;
    panel.querySelector("input[data-k]").focus();
  }

  window.ThemeCreator = { open: open };
})();
