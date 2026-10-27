/**
 * Banner SUMA tipográfico + redes sociales.
 * Fondo: tsParticles (data-particles), sin imágenes.
 */
(function () {
  const REDES = [
    { id: "facebook", label: "Facebook", href: "https://www.facebook.com/AduanaBolivia", icon: "f" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/aduanabolivia/", icon: "ig" },
    { id: "x", label: "X", href: "https://twitter.com/aduanabolivia", icon: "𝕏" },
    { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@aduanainforma-bolivia", icon: "▶" },
    { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@aduana.bolivia", icon: "♪" },
    { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/59171551800", icon: "wa" },
  ];

  function socialHtml() {
    return REDES.map(
      (r) =>
        `<a class="suma-social" href="${r.href}" target="_blank" rel="noopener noreferrer" aria-label="${r.label}" title="${r.label}" data-net="${r.id}"><span aria-hidden="true">${r.icon}</span></a>`
    ).join("");
  }

  function bannerHtml(mode) {
    const compact = mode === "compact";
    return `
      <section class="suma-banner${compact ? " suma-banner--compact" : ""}" aria-label="Banner SUMA"
        data-particles
        data-density="${compact ? "0.9" : "1.2"}"
        data-speed="1.1"
        data-color="#c9a227"
        data-link="#d4af37">
        <div class="suma-banner-inner">
          <div class="suma-banner-brand">
            <span class="suma-banner-eyebrow">Aduana Nacional de Bolivia</span>
            <h1 class="suma-banner-title">SUMA</h1>
            <p class="suma-banner-sub">Sistema Único de Modernización Aduanera</p>
          </div>
          <div class="suma-banner-redes">
            <span class="suma-banner-redes-label">Síguenos</span>
            <div class="suma-socials" role="list">${socialHtml()}</div>
          </div>
        </div>
      </section>`;
  }

  document.querySelectorAll("[data-suma-banner]").forEach((el) => {
    const mode = el.getAttribute("data-suma-banner") || "full";
    el.outerHTML = bannerHtml(mode);
  });

  if (window.ParticlesBg && typeof window.ParticlesBg.autoMount === "function") {
    window.ParticlesBg.autoMount();
  }
})();
