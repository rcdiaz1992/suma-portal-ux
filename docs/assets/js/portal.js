/**
 * Portal SUMA — estándar App Shell:
 * - Lateral: menú parametrizado (SUMA_MENU)
 * - Home: búsqueda + favoritos + lanzador por ciclo operativo
 */
(function () {
  const STORAGE_FAV = "suma.portal.favs";

  const GROUP_ORDER = window.SUMA_GROUP_ORDER || [];
  const menuRoot = document.querySelector("[data-menu]");
  const moduleRoot = document.querySelector("[data-modules]");
  const favRoot = document.querySelector("[data-favs]");
  const favSideRoot = document.querySelector("[data-favs-side]");
  const menuFilter = document.querySelector("[data-menu-filter]");
  const moduleFilter = document.querySelector("[data-module-filter]");
  const chips = document.querySelectorAll(".seg-btn[data-group]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const shell = document.querySelector(".shell");
  const countEl = document.querySelector("[data-module-count]");
  const perfilEl = document.querySelector("[data-perfil]");

  if (perfilEl && window.SUMA_IA) {
    perfilEl.textContent = window.SUMA_IA.perfilDemo;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }

  function defaultFavs() {
    return (window.SUMA_MODULES || [])
      .filter((m) => m.favDefault)
      .map((m) => m.id);
  }

  let favs = loadJson(STORAGE_FAV, null);
  if (!Array.isArray(favs)) favs = defaultFavs();
  let activeGroup = "all";

  function moduleById(id) {
    return (window.SUMA_MODULES || []).find((m) => m.id === id);
  }

  function isFav(id) {
    return favs.indexOf(id) !== -1;
  }

  function toggleFav(id) {
    if (!id || !moduleById(id)) return;
    if (isFav(id)) favs = favs.filter((x) => x !== id);
    else favs = favs.concat(id);
    saveJson(STORAGE_FAV, favs);
    refreshHome();
    renderMenu(menuFilter ? menuFilter.value : "");
  }

  function favToggleBtn(id) {
    const on = isFav(id);
    return (
      '<button type="button" class="fav-btn' +
      (on ? " on" : "") +
      '" data-fav="' +
      id +
      '" aria-label="' +
      (on ? "Quitar de favoritos" : "Agregar a favoritos") +
      '" title="' +
      (on ? "Quitar de favoritos" : "Agregar a favoritos") +
      '">★</button>'
    );
  }

  function openModule(m) {
    alert(
      "Prototipo SUMA\nMódulo: " +
        m.titulo +
        "\nRuta: " +
        (m.ruta || "/" + m.id) +
        "\n\nEn Angular abriría el microfrontend correspondiente."
    );
  }

  function abbrOf(text, fallback) {
    if (fallback) return String(fallback).slice(0, 3).toUpperCase();
    const clean = String(text || "")
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, " ")
      .trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0] + (parts[2] ? parts[2][0] : "")).toUpperCase();
    }
    return clean.slice(0, 3).toUpperCase() || "•";
  }

  function menuIcon(key, label, code) {
    const ico = typeof window.SUMA_ICON === "function" ? window.SUMA_ICON(key) : "";
    const abbr = abbrOf(label, code);
    return (
      '<span class="icon-dot" data-abbr="' +
      abbr +
      '">' +
      ico +
      "</span>"
    );
  }

  function renderMenu(term = "") {
    if (!menuRoot || !window.SUMA_MENU) return;
    const q = term.trim().toLowerCase();
    menuRoot.innerHTML = "";

    window.SUMA_MENU.forEach((item) => {
      const childHit = (item.opciones || []).filter((o) =>
        o.descripcion.toLowerCase().includes(q)
      );
      const selfHit = item.titulo.toLowerCase().includes(q);
      if (q && !selfHit && !childHit.length) return;

      if (!item.opciones || !item.opciones.length) {
        const a = document.createElement("a");
        a.className =
          "nav-link" + (String(item.url).indexOf("portal") !== -1 ? " active" : "");
        a.href = item.url;
        a.title = item.titulo;
        const mod = item.moduleId ? moduleById(item.moduleId) : null;
        a.innerHTML =
          menuIcon(item.icon, item.titulo, mod && mod.code) +
          '<span class="nav-label">' +
          item.titulo +
          "</span>";
        menuRoot.appendChild(a);
        return;
      }

      const details = document.createElement("details");
      details.className = "nav-group";
      details.open = !q || selfHit || childHit.length > 0;
      details.innerHTML =
        "<summary title=\"" +
        item.titulo +
        "\">" +
        menuIcon(item.icon, item.titulo) +
        '<span class="nav-label">' +
        item.titulo +
        "</span></summary>";
      const wrap = document.createElement("div");
      wrap.className = "nav-children";
      (q ? childHit : item.opciones).forEach((o) => {
        const row = document.createElement("div");
        row.className = "nav-link-row";

        const a = document.createElement("a");
        a.className = "nav-link";
        a.href = o.url;
        a.title = o.descripcion;
        if (o.moduleId) {
          a.setAttribute("data-open", o.moduleId);
        }
        const mod = o.moduleId ? moduleById(o.moduleId) : null;
        a.innerHTML =
          menuIcon(o.icon || "dot", o.descripcion, mod && mod.code) +
          '<span class="nav-label">' +
          o.descripcion +
          "</span>";
        row.appendChild(a);

        if (o.moduleId) {
          const favWrap = document.createElement("span");
          favWrap.className = "nav-fav-wrap";
          favWrap.innerHTML = favToggleBtn(o.moduleId);
          row.appendChild(favWrap);
        }

        wrap.appendChild(row);
      });
      details.appendChild(wrap);
      menuRoot.appendChild(details);
    });
  }

  function chipRow(list, emptyMsg, withStar) {
    if (!list.length) {
      return '<p class="launch-empty">' + emptyMsg + "</p>";
    }
    return (
      '<div class="launch-chips">' +
      list
        .map((m) => {
          return (
            '<div class="launch-chip-row">' +
            '<button type="button" class="launch-chip' +
            (withStar ? " launch-chip--fav" : "") +
            '" data-open="' +
            m.id +
            '">' +
            '<span class="launch-chip-code">' +
            m.code +
            "</span>" +
            "<span>" +
            m.titulo +
            "</span>" +
            "</button>" +
            (withStar ? favToggleBtn(m.id) : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function sideShortcutRow(list, emptyMsg, withStar) {
    if (!list.length) {
      return '<p class="side-shortcuts-empty">' + emptyMsg + "</p>";
    }
    return list
      .map((m) => {
        return (
          '<div class="side-shortcut-row">' +
          '<button type="button" class="side-shortcut' +
          (withStar ? " side-shortcut--fav" : "") +
          '" data-open="' +
          m.id +
          '" title="' +
          m.titulo +
          '">' +
          (withStar
            ? '<span class="fav-star side-shortcut-ico" aria-hidden="true">★</span>'
            : "") +
          '<span class="side-shortcut-code">' +
          m.code +
          "</span>" +
          '<span class="nav-label">' +
          m.titulo +
          "</span>" +
          "</button>" +
          (withStar ? favToggleBtn(m.id) : "") +
          "</div>"
        );
      })
      .join("");
  }

  function renderShortcuts() {
    const favList = favs.map(moduleById).filter(Boolean);

    if (favRoot) {
      favRoot.innerHTML = chipRow(
        favList,
        "Marque módulos con ★ para tenerlos aquí (atajos operativos).",
        true
      );
    }

    if (favSideRoot) {
      favSideRoot.innerHTML = sideShortcutRow(
        favList,
        "Sin favoritos aún.",
        true
      );
    }
  }

  function moduleCard(m, delayIdx) {
    const btn = document.createElement("article");
    btn.className = "module is-enter";
    btn.style.animationDelay = Math.min(delayIdx * 0.04, 0.28) + "s";
    btn.dataset.grupo = m.grupo;
    btn.innerHTML =
      '<div class="mod-top">' +
      '<div class="module-icon">' +
      m.code.slice(0, 2) +
      "</div>" +
      favToggleBtn(m.id) +
      "</div>" +
      "<h3>" +
      m.titulo +
      "</h3>" +
      "<p>" +
      m.desc +
      "</p>" +
      '<div class="meta">' +
      "<span>" +
      m.code +
      "</span>" +
      '<span class="badge">' +
      m.badge +
      "</span>" +
      "</div>" +
      '<button type="button" class="module-open" data-open="' +
      m.id +
      '">Abrir módulo →</button>';
    return btn;
  }

  function renderModules(term = "", group = "all") {
    if (!moduleRoot || !window.SUMA_MODULES) return;
    const q = term.trim().toLowerCase();

    const filtered = window.SUMA_MODULES.filter((m) => {
      const gOk = group === "all" || m.grupo === group;
      const tOk =
        !q ||
        m.titulo.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.ruta || "").toLowerCase().includes(q);
      return gOk && tOk;
    });

    if (countEl) {
      countEl.textContent =
        filtered.length + (filtered.length === 1 ? " módulo" : " módulos");
    }

    moduleRoot.innerHTML = "";

    if (!filtered.length) {
      moduleRoot.innerHTML =
        '<div class="empty-state">No hay módulos con ese criterio. Pruebe otro filtro o búsqueda.</div>';
      return;
    }

    const stack = document.createElement("div");
    stack.className = "module-stack";
    const groupsToShow =
      group === "all" ? GROUP_ORDER : GROUP_ORDER.filter((g) => g.id === group);

    let delay = 0;
    groupsToShow.forEach((g) => {
      const items = filtered
        .filter((m) => m.grupo === g.id)
        .slice()
        .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "module-section";
      section.setAttribute("aria-labelledby", "sec-" + g.id);
      section.innerHTML =
        '<div class="module-section-head">' +
        "<div>" +
        '<h2 id="sec-' +
        g.id +
        '"><span class="n">' +
        g.orden +
        "</span> " +
        g.label +
        "</h2>" +
        (g.hint ? '<p class="section-hint">' + g.hint + "</p>" : "") +
        "</div>" +
        "<span>" +
        items.length +
        "</span>" +
        "</div>";

      const grid = document.createElement("div");
      grid.className = "module-grid";
      items.forEach((m) => grid.appendChild(moduleCard(m, delay++)));
      section.appendChild(grid);
      stack.appendChild(section);
    });

    moduleRoot.appendChild(stack);
  }

  function refreshHome(fullModules) {
    renderShortcuts();
    if (fullModules !== false) {
      renderModules(moduleFilter ? moduleFilter.value : "", activeGroup);
    }
  }

  document.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(fav.getAttribute("data-fav"));
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault();
      const m = moduleById(open.getAttribute("data-open"));
      if (m) openModule(m);
    }
  });

  if (menuFilter) {
    menuFilter.addEventListener("input", (e) => renderMenu(e.target.value));
  }
  if (moduleFilter) {
    moduleFilter.addEventListener("input", (e) =>
      renderModules(e.target.value, activeGroup)
    );
  }
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("active");
      chip.setAttribute("aria-selected", "true");
      activeGroup = chip.dataset.group;
      renderModules(moduleFilter ? moduleFilter.value : "", activeGroup);
    });
  });
  if (toggle && shell) {
    toggle.addEventListener("click", () => shell.classList.toggle("nav-open"));
    shell.addEventListener("click", (e) => {
      if (e.target === shell && shell.classList.contains("nav-open")) {
        shell.classList.remove("nav-open");
      }
    });
  }

  renderMenu();
  refreshHome();

  const profileFilter = document.querySelector("[data-profile-filter]");
  const profiles = document.querySelectorAll("[data-profile]");
  if (profileFilter && profiles.length) {
    profileFilter.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      profiles.forEach((p) => {
        const text = p.textContent.toLowerCase();
        p.classList.toggle("hidden", q && !text.includes(q));
      });
    });
  }
})();
