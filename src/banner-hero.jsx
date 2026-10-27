import React from "react";
import { createRoot } from "react-dom/client";
import ParticleSlider from "@crazygl/hero-particle-slider";
import "@crazygl/hero-particle-slider/style.css";

/**
 * Hero Particle Slider (CrazyGL) como fondo.
 * Lockup oficial: ADUANA NACIONAL / SUMA / SISTEMA ÚNICO…
 * Redes en el pie (aduana.gob.bo), no en el banner.
 */
function BrandLockup() {
  return (
    <div className="suma-banner-inner">
      <div className="suma-banner-brand">
        <span className="suma-banner-eyebrow">Aduana Nacional de Bolivia</span>
        <h1 className="suma-banner-title">SUMA</h1>
        <p className="suma-banner-sub">Sistema Único de Modernización Aduanera</p>
      </div>
    </div>
  );
}

function SumaParticleBanner({ compact = false }) {
  const height = compact ? 210 : 340;
  return (
    <div className={`suma-hps${compact ? " suma-hps--compact" : ""}`} style={{ height }}>
      <ParticleSlider
        slideCount={3}
        autoplaySeconds={5.5}
        particleCount={compact ? 4200 : 6000}
        particleSize={compact ? 2.6 : 3.1}
        pointerMode="repel"
        pointerStrength={1.35}
        pointerRadius={0.9}
        rotationSpeed={0.35}
        baseColor="#f0c14b"
        bgTop="#071a2e"
        bgBottom="#0b2748"
        transparent
        dotStyle="hidden"
        slide1Heading=""
        slide1Subheading=""
        slide1Cta=""
        slide1Viz="neural"
        slide1Layout="text-left"
        slide1Accent="#ffe08a"
        slide1Transition="fade"
        slide2Heading=""
        slide2Subheading=""
        slide2Cta=""
        slide2Viz="sphere"
        slide2Layout="text-left"
        slide2Accent="#6eb6ff"
        slide2Transition="swish"
        slide3Heading=""
        slide3Subheading=""
        slide3Cta=""
        slide3Viz="galaxy"
        slide3Layout="text-left"
        slide3Accent="#5ee0c8"
        slide3Transition="blur"
      />
      <BrandLockup />
    </div>
  );
}

function mountAll() {
  document.querySelectorAll("[data-suma-banner]").forEach((el) => {
    const compact = el.getAttribute("data-suma-banner") === "compact";
    const root = createRoot(el);
    root.render(<SumaParticleBanner compact={compact} />);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAll);
} else {
  mountAll();
}

export { SumaParticleBanner, mountAll };
