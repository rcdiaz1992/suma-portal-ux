/**
 * Emulación Keycloak + MFA (prototipo).
 * No envía correo/WhatsApp reales. OTP demo: 123456
 */
(function () {
  const DEMO_OTP = "123456";
  const OTP_TTL_SEC = 60;

  const state = {
    step: "credentials", // credentials | method | otp | qr | success
    user: "",
    method: null, // email | whatsapp | qr
    otpTimer: null,
    otpLeft: OTP_TTL_SEC,
    qrTimer: null,
    qrLeft: 90,
  };

  const els = {
    steps: [...document.querySelectorAll("[data-auth-step]")],
    formCred: document.querySelector("[data-form-credentials]"),
    formOtp: document.querySelector("[data-form-otp]"),
    methods: [...document.querySelectorAll("[data-mfa-method]")],
    userLabel: document.querySelectorAll("[data-user-label]"),
    methodLabel: document.querySelectorAll("[data-method-label]"),
    destLabel: document.querySelectorAll("[data-dest-label]"),
    otpInputs: [...document.querySelectorAll("[data-otp-digit]")],
    otpError: document.querySelector("[data-otp-error]"),
    otpTimer: document.querySelector("[data-otp-timer]"),
    qrTimer: document.querySelector("[data-qr-timer]"),
    qrCanvas: document.querySelector("[data-qr-box]"),
    btnResend: document.querySelector("[data-otp-resend]"),
    btnBack: [...document.querySelectorAll("[data-auth-back]")],
    btnQrSim: document.querySelector("[data-qr-simulate]"),
    kcBadge: document.querySelector("[data-kc-session]"),
    flowLogin: document.querySelector("[data-flow-login]"),
  };

  const METHOD_META = {
    email: {
      label: "Correo electrónico",
      dest: (u) => maskEmail(u + "@aduana.gob.bo"),
      hint: "Revisa tu bandeja e ingresa el código de 6 dígitos.",
    },
    whatsapp: {
      label: "WhatsApp",
      dest: () => "+591 *** *** 84",
      hint: "Te enviamos un mensaje con el código de verificación.",
    },
    qr: {
      label: "Código QR",
      dest: () => "App autenticadora / escáner SUMA",
      hint: "Escanea el QR con tu app o confirma en el dispositivo vinculado.",
    },
  };

  function maskEmail(email) {
    const [name, domain] = email.split("@");
    if (!name || !domain) return "u***@aduana.gob.bo";
    const visible = name.slice(0, 2);
    return visible + "***@" + domain;
  }

  function setStep(step) {
    state.step = step;
    els.steps.forEach((panel) => {
      const match = panel.getAttribute("data-auth-step") === step;
      panel.classList.toggle("hidden", !match);
      if (match) {
        panel.classList.remove("auth-step-enter");
        void panel.offsetWidth;
        panel.classList.add("auth-step-enter");
      }
    });
    if (els.flowLogin) {
      els.flowLogin.textContent =
        step === "credentials"
          ? "Credenciales"
          : step === "method"
            ? "Elegir 2FA"
            : step === "otp" || step === "qr"
              ? "Verificar 2FA"
              : "Listo";
    }
    if (els.kcBadge) {
      els.kcBadge.textContent =
        "Keycloak · sesión " +
        (step === "credentials" ? "login" : "mfa-challenge");
    }
  }

  function syncUserLabels() {
    els.userLabel.forEach((n) => {
      n.textContent = state.user || "usuario";
    });
  }

  function syncMethodLabels() {
    const meta = METHOD_META[state.method];
    if (!meta) return;
    els.methodLabel.forEach((n) => {
      n.textContent = meta.label;
    });
    els.destLabel.forEach((n) => {
      n.textContent = meta.dest(state.user);
    });
  }

  function clearOtp() {
    els.otpInputs.forEach((i) => {
      i.value = "";
    });
    if (els.otpError) {
      els.otpError.textContent = "";
      els.otpError.classList.add("hidden");
    }
  }

  function readOtp() {
    return els.otpInputs.map((i) => i.value).join("");
  }

  function stopTimers() {
    if (state.otpTimer) clearInterval(state.otpTimer);
    if (state.qrTimer) clearInterval(state.qrTimer);
    state.otpTimer = null;
    state.qrTimer = null;
  }

  function startOtpTimer() {
    stopTimers();
    state.otpLeft = OTP_TTL_SEC;
    tickOtp();
    state.otpTimer = setInterval(() => {
      state.otpLeft -= 1;
      tickOtp();
      if (state.otpLeft <= 0) {
        clearInterval(state.otpTimer);
        state.otpTimer = null;
      }
    }, 1000);
  }

  function tickOtp() {
    if (els.otpTimer) {
      els.otpTimer.textContent =
        state.otpLeft > 0
          ? "Expira en " + formatTime(state.otpLeft)
          : "Código expirado — reenvía uno nuevo";
    }
    if (els.btnResend) {
      els.btnResend.disabled = state.otpLeft > 0;
    }
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return m + ":" + s;
  }

  function startQrChallenge() {
    stopTimers();
    state.qrLeft = 90;
    renderQr();
    tickQr();
    state.qrTimer = setInterval(() => {
      state.qrLeft -= 1;
      tickQr();
      if (state.qrLeft <= 0) {
        clearInterval(state.qrTimer);
        state.qrTimer = null;
        renderQr(true);
      }
    }, 1000);
  }

  function tickQr() {
    if (els.qrTimer) {
      els.qrTimer.textContent =
        state.qrLeft > 0
          ? "QR válido " + formatTime(state.qrLeft)
          : "QR expirado — genera uno nuevo";
    }
  }

  /** QR decorativo determinístico (no criptográfico; solo UI). */
  function renderQr(expired) {
    if (!els.qrCanvas) return;
    const seed = (state.user || "suma") + ":" + Math.floor(Date.now() / 30000);
    const cells = 21;
    const size = 168;
    const cell = size / cells;
    let bits = 0;
    for (let i = 0; i < seed.length; i++) bits = (bits * 31 + seed.charCodeAt(i)) >>> 0;

    const rects = [];
    function bit() {
      bits = (bits * 1664525 + 1013904223) >>> 0;
      return bits & 1;
    }
    function finder(ox, oy) {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const edge = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          if (edge || core) {
            rects.push(
              `<rect x="${(ox + x) * cell}" y="${(oy + y) * cell}" width="${cell}" height="${cell}" fill="${expired ? "#9aa8b8" : "#0b2748"}"/>`
            );
          }
        }
      }
    }
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);

    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder =
          (x < 8 && y < 8) ||
          (x >= cells - 8 && y < 8) ||
          (x < 8 && y >= cells - 8);
        if (inFinder) continue;
        if (bit()) {
          rects.push(
            `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${expired ? "#9aa8b8" : "#0b2748"}"/>`
          );
        }
      }
    }

    els.qrCanvas.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Código QR de autenticación">
        <rect width="${size}" height="${size}" fill="#fff"/>
        ${rects.join("")}
      </svg>`;
    els.qrCanvas.classList.toggle("is-expired", !!expired);
  }

  function goToPortal() {
    stopTimers();
    setStep("success");
    setTimeout(() => {
      window.location.href = "portal.html";
    }, 900);
  }

  // —— Events ——
  if (els.formCred) {
    els.formCred.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = els.formCred.querySelector("#user");
      const pass = els.formCred.querySelector("#pass");
      if (!user.value.trim() || !pass.value) return;
      state.user = user.value.trim();
      syncUserLabels();
      setStep("method");
    });
  }

  els.methods.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.method = btn.getAttribute("data-mfa-method");
      syncMethodLabels();
      clearOtp();
      if (state.method === "qr") {
        setStep("qr");
        startQrChallenge();
      } else {
        setStep("otp");
        startOtpTimer();
        setTimeout(() => els.otpInputs[0] && els.otpInputs[0].focus(), 80);
      }
    });
  });

  els.otpInputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && els.otpInputs[idx + 1]) {
        els.otpInputs[idx + 1].focus();
      }
      if (readOtp().length === 6 && els.formOtp) {
        els.formOtp.requestSubmit();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && els.otpInputs[idx - 1]) {
        els.otpInputs[idx - 1].focus();
      }
    });
    input.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      if (!text) return;
      e.preventDefault();
      els.otpInputs.forEach((el, i) => {
        el.value = text[i] || "";
      });
      if (text.length === 6 && els.formOtp) els.formOtp.requestSubmit();
    });
  });

  if (els.formOtp) {
    els.formOtp.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = readOtp();
      if (state.otpLeft <= 0) {
        showOtpError("El código expiró. Reenvía uno nuevo.");
        return;
      }
      if (code.length !== 6) {
        showOtpError("Ingresa los 6 dígitos.");
        return;
      }
      if (code !== DEMO_OTP) {
        showOtpError("Código incorrecto. Demo: 123456");
        els.otpInputs.forEach((i) => {
          i.value = "";
        });
        els.otpInputs[0].focus();
        return;
      }
      goToPortal();
    });
  }

  function showOtpError(msg) {
    if (!els.otpError) return;
    els.otpError.textContent = msg;
    els.otpError.classList.remove("hidden");
  }

  if (els.btnResend) {
    els.btnResend.addEventListener("click", () => {
      clearOtp();
      startOtpTimer();
      showOtpError("");
      els.otpError.classList.add("hidden");
      els.otpInputs[0] && els.otpInputs[0].focus();
    });
  }

  if (els.btnQrSim) {
    els.btnQrSim.addEventListener("click", () => {
      if (state.qrLeft <= 0) {
        startQrChallenge();
        return;
      }
      goToPortal();
    });
  }

  const refreshQr = document.querySelector("[data-qr-refresh]");
  if (refreshQr) {
    refreshQr.addEventListener("click", () => startQrChallenge());
  }

  els.btnBack.forEach((btn) => {
    btn.addEventListener("click", () => {
      const to = btn.getAttribute("data-auth-back");
      stopTimers();
      if (to === "credentials") setStep("credentials");
      else if (to === "method") setStep("method");
    });
  });

  setStep("credentials");
})();
