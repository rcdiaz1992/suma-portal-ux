/**
 * Banner SUMA: redes/contacto oficiales (pie).
 * El hero visual usa @crazygl/hero-particle-slider (banner-hero.js).
 */
(function () {
  const REDES = [
    { id: "facebook", label: "Facebook", href: "https://www.facebook.com/AduanaBolivia", icon: "f" },
    { id: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCc9n7j3xby8c_j2O42YQSjQ", icon: "▶" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/aduanabolivia/", icon: "ig" },
    { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/59171551800", icon: "wa" },
    { id: "x", label: "X", href: "https://x.com/aduanabolivia", icon: "𝕏" },
    { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@aduanabolivia", icon: "♪" },
  ];

  const CONTACTO = {
    org: "Aduana Nacional",
    direccionesHref: "https://www.aduana.gob.bo/pagina-de-direcciones",
    telefono: "(591) - 2 -2128008",
    telefonoHref: "tel:+59122128008",
    linea: "800-10-5001",
    lineaHref: "tel:800105001",
    correo: "infocc@aduana.gob.bo",
    correoHref: "mailto:infocc@aduana.gob.bo",
    sitio: "https://www.aduana.gob.bo/",
  };

  function socialHtml() {
    return REDES.map(
      (r) =>
        `<a class="suma-social" href="${r.href}" target="_blank" rel="noopener noreferrer" aria-label="${r.label}" title="${r.label}" data-net="${r.id}"><span aria-hidden="true">${r.icon}</span></a>`
    ).join("");
  }

  function contactHtml() {
    return `
      <div class="an-contact" data-an-contact>
        <div class="an-contact-title">— Contacto —</div>
        <div class="an-contact-grid">
          <div class="an-contact-info">
            <strong>${CONTACTO.org}.</strong>
            <a href="${CONTACTO.direccionesHref}" target="_blank" rel="noopener noreferrer">Direcciones: Ver todas las direcciones →</a>
            <a href="${CONTACTO.telefonoHref}">Teléfono: ${CONTACTO.telefono}</a>
            <a href="${CONTACTO.lineaHref}">Línea gratuita: ${CONTACTO.linea}</a>
            <a href="${CONTACTO.correoHref}">Correo electrónico: ${CONTACTO.correo}</a>
          </div>
          <div class="an-contact-social">
            <strong>Encuéntranos en nuestras redes sociales</strong>
            <div class="suma-socials suma-socials--brand" role="list">${socialHtml()}</div>
          </div>
        </div>
      </div>`;
  }

  document.querySelectorAll("[data-an-contact-mount]").forEach((el) => {
    el.innerHTML = contactHtml();
  });

  window.SUMA_REDES = REDES;
  window.SUMA_CONTACTO = CONTACTO;
})();
