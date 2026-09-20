(function () {
  "use strict";

  var CATEGORIES = (window.CATEGORIES && window.CATEGORIES.categories) || [];
  var COLORS = [
    "#e63946", "#457b9d", "#2a9d8f", "#e76f51", "#8e44ad", "#3d8b37",
    "#d4a017", "#c2185b", "#00838f", "#6d4c41", "#5c6bc0", "#ef6c00"
  ];
  var STORE_KEY = "wah-v1";
  var MIN_PLAYERS = 2;

  var state = {
    screen: "menu",
    players: [],
    selected: [],   // selected category ids
    queue: [],
    current: null,
    nextId: 1
  };

  var deferredInstall = null;

  function $(id) { return document.getElementById(id); }

  // ---------- Persistence (optional; never required) ----------
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        names: state.players.map(function (p) { return p.name; }),
        categories: state.selected
      }));
    } catch (e) { /* storage unavailable: ignore */ }
  }

  // ---------- Screens ----------
  var SCREENS = ["menu", "setup", "categories", "play", "summary"];
  function showScreen(name) {
    state.screen = name;
    SCREENS.forEach(function (s) { $("screen-" + s).hidden = s !== name; });
    var first = $("screen-" + name);
    if (first) first.scrollTop = 0;
  }

  // ---------- Players ----------
  function nextColor() {
    var used = state.players.map(function (p) { return p.color; });
    for (var i = 0; i < COLORS.length; i++) {
      if (used.indexOf(COLORS[i]) === -1) return COLORS[i];
    }
    return COLORS[state.players.length % COLORS.length];
  }

  function addPlayer(name) {
    name = name.replace(/\s+/g, " ").trim();
    if (!name) return "Enter a name.";
    var lower = name.toLowerCase();
    var dupe = state.players.some(function (p) { return p.name.toLowerCase() === lower; });
    if (dupe) return "That name is already taken.";
    state.players.push({ id: "p" + state.nextId++, name: name, color: nextColor(), score: 0 });
    return null;
  }

  function removePlayer(id) {
    state.players = state.players.filter(function (p) { return p.id !== id; });
  }

  function renderPlayers() {
    var list = $("player-list");
    list.textContent = "";
    state.players.forEach(function (p) {
      var li = document.createElement("li");
      var sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = p.color;
      var nm = document.createElement("span");
      nm.className = "player-name";
      nm.textContent = p.name;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove-btn";
      rm.setAttribute("aria-label", "Remove " + p.name);
      rm.textContent = "×";
      rm.addEventListener("click", function () {
        removePlayer(p.id);
        renderPlayers();
      });
      li.appendChild(sw); li.appendChild(nm); li.appendChild(rm);
      list.appendChild(li);
    });
    var ok = state.players.length >= MIN_PLAYERS;
    $("btn-setup-continue").disabled = !ok;
    $("player-hint").hidden = ok;
  }

  function showError(msg) {
    var el = $("player-error");
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  // ---------- Categories ----------
  function allSelected() {
    return CATEGORIES.length > 0 && state.selected.length === CATEGORIES.length;
  }

  function toggleCategory(id) {
    var i = state.selected.indexOf(id);
    if (i === -1) state.selected.push(id); else state.selected.splice(i, 1);
    renderCategories();
  }

  function toggleMixed() {
    state.selected = allSelected() ? [] : CATEGORIES.map(function (c) { return c.id; });
    renderCategories();
  }

  function makeCard(icon, label, pressed, onTap, extraClass) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cat-card" + (extraClass ? " " + extraClass : "");
    b.setAttribute("aria-pressed", pressed ? "true" : "false");
    var i = document.createElement("span");
    i.className = "cat-icon";
    i.textContent = icon;
    var t = document.createElement("span");
    t.textContent = label;
    b.appendChild(i); b.appendChild(t);
    b.addEventListener("click", onTap);
    return b;
  }

  function renderCategories() {
    var grid = $("category-grid");
    grid.textContent = "";
    grid.appendChild(makeCard("🎰", "All / Mixed", allSelected(), toggleMixed, "mixed"));
    CATEGORIES.forEach(function (c) {
      grid.appendChild(makeCard(c.icon, c.name, state.selected.indexOf(c.id) !== -1,
        function () { toggleCategory(c.id); }));
    });
    $("btn-start").disabled = state.selected.length === 0;
  }

  // ---------- Item queue ----------
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function pool() {
    var seen = {};
    var out = [];
    CATEGORIES.forEach(function (c) {
      if (state.selected.indexOf(c.id) === -1) return;
      c.items.forEach(function (item) {
        var key = item.name.toLowerCase();
        if (!seen[key]) { seen[key] = true; out.push(item); }
      });
    });
    return out;
  }

  function buildQueue() {
    var q = shuffle(pool());
    // Guard: don't start a fresh cycle with the item just shown.
    if (q.length > 1 && q[q.length - 1] === state.current) {
      var j = Math.floor(Math.random() * (q.length - 1));
      var t = q[q.length - 1]; q[q.length - 1] = q[j]; q[j] = t;
    }
    state.queue = q;
  }

  function nextItem() {
    if (state.queue.length === 0) buildQueue();
    state.current = state.queue.pop() || { emoji: "", name: "" };
    $("reveal-emoji").textContent = state.current.emoji;
    $("reveal-word").textContent = state.current.name; // screen readers only
  }

  // ---------- Play ----------
  function pulse(el) {
    el.classList.remove("pulse");
    void el.offsetWidth; // restart animation
    el.classList.add("pulse");
  }

  function categoryLabel() {
    if (allSelected()) return "Mixed";
    return CATEGORIES.filter(function (c) { return state.selected.indexOf(c.id) !== -1; })
      .map(function (c) { return c.icon + " " + c.name; }).join(" · ");
  }

  function renderScoreBar() {
    var bar = $("score-bar");
    bar.textContent = "";
    state.players.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.style.background = p.color;
      b.setAttribute("aria-label", "Point for " + p.name);
      var n = document.createElement("span");
      n.className = "chip-name";
      n.textContent = p.name;
      var s = document.createElement("span");
      s.className = "chip-score";
      s.textContent = p.score;
      b.appendChild(n); b.appendChild(s);
      b.addEventListener("click", function () {
        p.score += 1;
        s.textContent = p.score;
        pulse(b);
        nextItem();
      });
      bar.appendChild(b);
    });
  }

  function startRound() {
    state.players.forEach(function (p) { p.score = 0; });
    state.current = null;
    buildQueue();
    $("play-category").textContent = categoryLabel();
    renderScoreBar();
    nextItem();
    showScreen("play");
    save();
  }

  // ---------- Summary ----------
  function renderSummary() {
    var list = $("summary-list");
    list.textContent = "";
    var ranked = state.players.slice().sort(function (a, b) { return b.score - a.score; });
    var top = ranked.length ? ranked[0].score : 0;
    var rank = 0, prev = null;
    ranked.forEach(function (p, idx) {
      if (p.score !== prev) { rank = idx + 1; prev = p.score; }
      var li = document.createElement("li");
      li.style.borderLeftColor = p.color;
      if (p.score === top && top > 0) li.classList.add("winner");
      var r = document.createElement("span");
      r.className = "summary-rank";
      r.textContent = "#" + rank;
      var n = document.createElement("span");
      n.className = "summary-name";
      n.textContent = (p.score === top && top > 0 ? "🏆 " : "") + p.name;
      var s = document.createElement("span");
      s.className = "summary-score";
      s.textContent = p.score;
      li.appendChild(r); li.appendChild(n); li.appendChild(s);
      list.appendChild(li);
    });
    showScreen("summary");
  }

  function backToMenu() {
    state.players = [];
    state.queue = [];
    state.current = null;
    showScreen("menu");
  }

  // ---------- Modal ----------
  function toggleHowTo(open) {
    $("howto").hidden = !open;
    if (open) $("btn-howto-close").focus();
  }

  // ---------- Init ----------
  function init() {
    var saved = loadSaved();
    var savedNames = (saved && saved.names) || [];
    var savedCats = ((saved && saved.categories) || []).filter(function (id) {
      return CATEGORIES.some(function (c) { return c.id === id; });
    });
    state.selected = savedCats;

    $("btn-play").addEventListener("click", function () {
      if (state.players.length === 0) {
        savedNames.forEach(function (n) { addPlayer(n); });
      }
      showError("");
      renderPlayers();
      showScreen("setup");
      $("player-name").focus();
    });
    $("btn-howto").addEventListener("click", function () { toggleHowTo(true); });
    $("btn-howto-close").addEventListener("click", function () { toggleHowTo(false); });
    $("howto").addEventListener("click", function (e) {
      if (e.target === $("howto")) toggleHowTo(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("howto").hidden) toggleHowTo(false);
    });

    document.querySelectorAll("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var target = b.getAttribute("data-goto");
        if (target === "menu") backToMenu(); else showScreen(target);
      });
    });

    $("player-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("player-name");
      var err = addPlayer(input.value);
      showError(err);
      if (!err) { input.value = ""; renderPlayers(); }
      input.focus();
    });

    $("btn-setup-continue").addEventListener("click", function () {
      if (state.players.length < MIN_PLAYERS) return;
      save();
      renderCategories();
      showScreen("categories");
    });

    $("btn-start").addEventListener("click", function () {
      if (state.selected.length) startRound();
    });

    $("reveal").addEventListener("click", function () {
      pulse($("reveal"));
      nextItem();
    });

    $("btn-end").addEventListener("click", renderSummary);
    $("btn-again").addEventListener("click", startRound);
    $("btn-menu").addEventListener("click", backToMenu);

    // PWA install hint
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredInstall = e;
      $("install-hint").hidden = false;
    });
    $("btn-install").addEventListener("click", function () {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall = null;
      $("install-hint").hidden = true;
    });
    window.addEventListener("appinstalled", function () { $("install-hint").hidden = true; });

    showScreen("menu");
  }

  init();
})();
