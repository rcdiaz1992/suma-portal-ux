/**
 * Fondo Digital Network Lines con tsParticles
 * https://github.com/tsparticles/tsparticles
 *
 * HTML: <div data-particles data-density="1"></div>  (en un contenedor position:relative)
 * o atributo en el propio contenedor: data-particles
 */
(function (global) {
  let ready = null;
  let seq = 0;

  function ensureEngine() {
    if (ready) return ready;
    ready = (async function () {
      if (!global.tsParticles) {
        throw new Error("tsParticles no cargado. Incluya assets/vendor/tsparticles.bundle.min.js");
      }
      if (typeof global.loadFull === "function") {
        await global.loadFull(global.tsParticles);
      }
      return global.tsParticles;
    })();
    return ready;
  }

  function optionsFromEl(el) {
    const density = parseFloat(el.getAttribute("data-density") || "1");
    const speed = parseFloat(el.getAttribute("data-speed") || "1");
    const color = el.getAttribute("data-color") || "#c9a227";
    const link = el.getAttribute("data-link") || color;
    const count = Math.round(45 * density);

    return {
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: {
          value: count,
          density: { enable: true, width: 900, height: 700 },
        },
        color: { value: color },
        links: {
          enable: true,
          color: link,
          distance: 130,
          opacity: 0.38,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.7 * speed,
          direction: "none",
          outModes: { default: "bounce" },
          random: true,
          straight: false,
        },
        opacity: {
          value: { min: 0.25, max: 0.7 },
          animation: { enable: true, speed: 0.6, sync: false },
        },
        size: {
          value: { min: 1, max: 2.6 },
        },
        shape: { type: "circle" },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: { enable: true, mode: "grab" },
          onClick: { enable: false, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          grab: {
            distance: 150,
            links: { opacity: 0.65 },
          },
          push: { quantity: 2 },
        },
      },
    };
  }

  async function mount(target, extraOptions) {
    if (!target) return null;
    const engine = await ensureEngine();

    if (getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }

    let host = target.querySelector(":scope > .tsparticles-bg");
    if (!host) {
      host = document.createElement("div");
      host.className = "tsparticles-bg";
      host.setAttribute("aria-hidden", "true");
      target.prepend(host);
    }

    const id = host.id || "tsp-" + ++seq;
    host.id = id;

    const opts = Object.assign({}, optionsFromEl(target), extraOptions || {});
    // v3: el elemento debe existir en el DOM con ese id
    const instance = await engine.load({ id: id, options: opts });
    target.__particles = instance;
    return instance;
  }

  async function autoMount() {
    await ensureEngine();
    const nodes = document.querySelectorAll("[data-particles]");
    for (const el of nodes) {
      if (el.__particles) continue;
      try {
        await mount(el);
      } catch (err) {
        console.error("[particles-bg]", err);
      }
    }
  }

  global.ParticlesBg = { mount: mount, autoMount: autoMount };

  function boot() {
    autoMount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
