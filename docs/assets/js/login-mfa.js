/**
 * Login SUMA (prototipo):
 * - flow=keycloak → solo usuario/clave (registro, externo, interno)
 * - flow=mfa → credenciales + 2FA (no habituales)
 * - ctx=interno → captcha matemático
 *
 * Demo: Tecnopor/password (externo), jyampassi/password (interno), OTP 123456
 */
(function () {
  const DEMO_OTP = "123456";
  const OTP_TTL_SEC = 60;
  const USERS = {
    externo: { user: "Tecnopor", pass: "password" },
    interno: { user: "jyampassi", pass: "password" },
    registro: { user: "Tecnopor", pass: "password" },
  };

  // serve (cleanUrls) redirige login.html?x=y → /login sin query; preferir /login?x=y
  const params = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(
    String(location.hash || "").replace(/^#/, "").replace(/^\//, "")
  );
  function param(name) {
    return params.get(name) || hashParams.get(name) || "";
  }
  const flowRaw = (param("flow") || "").toLowerCase();
  const ctxRaw = (param("ctx") || "").toLowerCase();
  const flow = flowRaw === "mfa" || ctxRaw === "nohabitual" ? "mfa" : "keycloak";
  let ctx = ctxRaw || (flow === "mfa" ? "nohabitual" : "externo");
  if (!["externo", "interno", "registro", "nohabitual"].includes(ctx)) {
    ctx = flow === "mfa" ? "nohabitual" : "externo";
  }

  const state = {
    flow,
    ctx,
    role: ctx === "interno" ? "interno" : "externo",
    step: "credentials",
    user: "",
    method: null,
    otpTimer: null,
    otpLeft: OTP_TTL_SEC,
    qrTimer: null,
    qrLeft: 90,
    captchaA: 0,
    captchaB: 0,
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
    credError: document.querySelector("[data-cred-error]"),
    otpTimer: document.querySelector("[data-otp-timer]"),
    qrTimer: document.querySelector("[data-qr-timer]"),
    qrCanvas: document.querySelector("[data-qr-box]"),
    btnResend: document.querySelector("[data-otp-resend]"),
    btnBack: [...document.querySelectorAll("[data-auth-back]")],
    btnQrSim: document.querySelector("[data-qr-simulate]"),
    kcBadge: document.querySelector("[data-kc-session]"),
    flowLogin: document.querySelector("[data-flow-login]"),
    roleSeg: document.querySelector("[data-role-seg]"),
    captchaWrap: document.querySelector("[data-captcha-wrap]"),
    captchaBox: document.querySelector("[data-captcha-box]"),
    captchaInput: document.querySelector("#captcha"),
    captchaRefresh: document.querySelector("[data-captcha-refresh]"),
    demoHint: document.querySelector("[data-demo-hint]"),
    successMsg: document.querySelector("[data-success-msg]"),
    asideTitle: document.querySelector("[data-login-aside-title]"),
    asideText: document.querySelector("[data-login-aside-text]"),
    asideSub: document.querySelector("[data-login-aside-sub]"),
    asideSteps: document.querySelector("[data-login-aside-steps]"),
    cardTitle: document.querySelector("[data-login-card-title]"),
    cardSub: document.querySelector("[data-login-card-sub]"),
    mfaBanner: document.querySelector("[data-mfa-banner]"),
    formGaOtp: document.querySelector("[data-form-ga-otp]"),
    gaOtpError: document.querySelector("[data-ga-otp-error]"),
    formCodeGate: document.querySelector("[data-form-code-gate]"),
    gateError: document.querySelector("[data-gate-error]"),
  };

  const METHOD_META = {
    email: {
      label: "Correo electrónico",
      dest: (u) => maskEmail(u + "@aduana.gob.bo"),
    },
    whatsapp: {
      label: "WhatsApp",
      dest: () => "+591 *** *** 84",
    },
    qr: {
      label: "Google Authenticator",
      dest: () => "Google Authenticator (TOTP)",
    },
  };

  function maskEmail(email) {
    const [name, domain] = email.split("@");
    if (!name || !domain) return "u***@aduana.gob.bo";
    return name.slice(0, 2) + "***@" + domain;
  }

  function applyChrome() {
    const isMfa = state.flow === "mfa";
    document.title = isMfa
      ? "SUMA · Login MFA — No habituales"
      : "SUMA · Login Keycloak — Propuesta UX";

    if (els.asideSub) {
      els.asideSub.textContent = isMfa
        ? "No habituales · código de acceso"
        : "SSO · Keycloak (emulado)";
    }
    if (els.asideTitle) {
      els.asideTitle.textContent = isMfa
        ? "Ingreso por código"
        : state.ctx === "interno"
          ? "Ingreso usuario interno"
          : state.ctx === "registro"
            ? "Registro / acceso Keycloak"
            : "Ingreso operador habitual";
    }
    if (els.asideText) {
      els.asideText.textContent = isMfa
        ? "Sin usuario ni contraseña: ingresa el código (Google Authenticator, correo o WhatsApp) y abre las opciones de importación/exportación."
        : "Solo usuario y contraseña Keycloak. Internos incluyen captcha de verificación.";
    }
    if (els.asideSteps) {
      els.asideSteps.innerHTML = isMfa
        ? "<li>Ingresar código de verificación</li><li>Abrir opciones import/export</li>"
        : state.role === "interno" || state.ctx === "interno"
          ? "<li>Usuario y contraseña</li><li>Resolver captcha</li><li>Entrar al portal</li>"
          : "<li>Usuario y contraseña</li><li>Entrar al portal / registro</li>";
    }
    if (els.cardTitle) {
      els.cardTitle.textContent = isMfa ? "No habituales · código" : "Iniciar sesión";
    }
    if (els.cardSub) {
      els.cardSub.innerHTML = isMfa
        ? "Flujo <strong>código → opciones</strong> (sin Keycloak user/pass)"
        : "Realm <strong>suma</strong> · flujo <strong>Keycloak</strong>";
    }
    if (els.mfaBanner) {
      els.mfaBanner.classList.add("hidden");
    }

    if (els.roleSeg) {
      const showRole = state.ctx === "registro" && !isMfa;
      els.roleSeg.hidden = !showRole;
      els.roleSeg.classList.toggle("hidden", !showRole);
      if (showRole) syncRoleButtons();
    }

    const needCaptcha = state.ctx === "interno" || state.role === "interno";
    if (els.captchaWrap) {
      els.captchaWrap.classList.toggle("hidden", !needCaptcha);
      if (needCaptcha) refreshCaptcha();
    }

    if (els.demoHint) {
      if (isMfa) {
        els.demoHint.innerHTML =
          "Demo MFA: cualquier usuario + OTP <code>123456</code>";
      } else if (needCaptcha) {
        els.demoHint.innerHTML =
          "Demo interno: <code>jyampassi</code> / <code>password</code> + captcha";
      } else {
        els.demoHint.innerHTML =
          "Demo externo: <code>Tecnopor</code> / <code>password</code>";
      }
    }

    // Prefill demo user
    const userInput = document.querySelector("#user");
    const passInput = document.querySelector("#pass");
    if (userInput && passInput && !userInput.value) {
      if (needCaptcha) {
        userInput.value = USERS.interno.user;
        passInput.placeholder = "password";
      } else if (!isMfa) {
        userInput.value = USERS.externo.user;
        passInput.placeholder = "password";
      }
    }
  }

  function syncRoleButtons() {
    document.querySelectorAll("[data-role-btn]").forEach((btn) => {
      const on = btn.getAttribute("data-role-btn") === state.role;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function refreshCaptcha() {
    state.captchaA = 2 + Math.floor(Math.random() * 8);
    state.captchaB = 2 + Math.floor(Math.random() * 8);
    if (els.captchaBox) {
      els.captchaBox.textContent = state.captchaA + " + " + state.captchaB + " = ?";
    }
    if (els.captchaInput) els.captchaInput.value = "";
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
        step === "code-gate"
          ? "Código"
          : step === "credentials"
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
    if (els.btnResend) els.btnResend.disabled = state.otpLeft > 0;
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
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const on = x === 0 || y === 0 || x === 6 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5);
        if (on) {
          rects.push(
            `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${expired ? "#9aa8b8" : "#0b2748"}"/>`
          );
        }
      }
    }
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
    els.qrCanvas.innerHTML =
      '<svg viewBox="0 0 ' +
      size +
      " " +
      size +
      '" width="' +
      size +
      '" height="' +
      size +
      '" role="img" aria-label="Código QR"><rect width="' +
      size +
      '" height="' +
      size +
      '" fill="#fff"/>' +
      rects.join("") +
      "</svg>";
    els.qrCanvas.classList.toggle("is-expired", !!expired);
  }

  function destination() {
    if (state.flow === "mfa" || state.ctx === "nohabitual") return "nohabitual";
    if (state.ctx === "registro") return "portal#registro";
    return "portal";
  }

  function goNext() {
    stopTimers();
    setStep("success");
    const dest = destination();
    if (els.successMsg) {
      els.successMsg.textContent =
        dest.indexOf("nohabitual") !== -1
          ? "Redirigiendo a operaciones no habituales…"
          : "Redirigiendo al portal SUMA…";
    }
    try {
      sessionStorage.setItem(
        "suma.auth",
        JSON.stringify({
          user: state.user,
          ctx: state.ctx,
          role: state.role,
          flow: state.flow,
        })
      );
    } catch (_) {}
    setTimeout(() => {
      window.location.href = dest;
    }, 850);
  }

  function showCredError(msg) {
    if (!els.credError) return;
    if (!msg) {
      els.credError.textContent = "";
      els.credError.classList.add("hidden");
      return;
    }
    els.credError.textContent = msg;
    els.credError.classList.remove("hidden");
  }

  function validateCredentials(user, pass) {
    if (state.flow === "mfa") return true;
    const needCaptcha = state.ctx === "interno" || state.role === "interno";
    const expected = needCaptcha ? USERS.interno : USERS.externo;
    if (
      user.toLowerCase() !== expected.user.toLowerCase() ||
      pass !== expected.pass
    ) {
      showCredError(
        "Credenciales incorrectas. Demo: " +
          expected.user +
          " / " +
          expected.pass
      );
      return false;
    }
    if (needCaptcha) {
      const ans = Number((els.captchaInput && els.captchaInput.value) || "");
      if (ans !== state.captchaA + state.captchaB) {
        showCredError("Captcha incorrecto. Resuelva la suma.");
        refreshCaptcha();
        return false;
      }
    }
    return true;
  }

  // —— Events ——
  document.querySelectorAll("[data-role-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.role = btn.getAttribute("data-role-btn") === "interno" ? "interno" : "externo";
      syncRoleButtons();
      applyChrome();
    });
  });

  if (els.captchaRefresh) {
    els.captchaRefresh.addEventListener("click", refreshCaptcha);
  }

  document.querySelectorAll("[data-gate-method]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-gate-method]").forEach((b) => {
        b.classList.toggle("is-picked", b === btn);
      });
      state.method = btn.getAttribute("data-gate-method");
    });
  });

  if (els.formCodeGate) {
    els.formCodeGate.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = els.formCodeGate.querySelector("#access-code");
      const code = String((input && input.value) || "").replace(/\D/g, "");
      if (els.gateError) {
        els.gateError.textContent = "";
        els.gateError.classList.add("hidden");
      }
      if (code.length !== 6) {
        if (els.gateError) {
          els.gateError.textContent = "Ingrese el código de 6 dígitos.";
          els.gateError.classList.remove("hidden");
        }
        return;
      }
      if (code !== DEMO_OTP) {
        if (els.gateError) {
          els.gateError.textContent = "Código incorrecto. Demo: 123456";
          els.gateError.classList.remove("hidden");
        }
        return;
      }
      state.user = "no-habitual";
      state.method = state.method || "qr";
      goNext();
    });
  }

  if (els.formCred) {
    els.formCred.addEventListener("submit", (e) => {
      e.preventDefault();
      showCredError("");
      const user = els.formCred.querySelector("#user");
      const pass = els.formCred.querySelector("#pass");
      if (!user.value.trim() || !pass.value) return;
      if (!validateCredentials(user.value.trim(), pass.value)) return;
      state.user = user.value.trim();
      syncUserLabels();
      goNext();
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
      if (input.value && els.otpInputs[idx + 1]) els.otpInputs[idx + 1].focus();
      if (readOtp().length === 6 && els.formOtp) els.formOtp.requestSubmit();
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
      goNext();
    });
  }

  function showOtpError(msg) {
    if (!els.otpError) return;
    els.otpError.textContent = msg;
    els.otpError.classList.toggle("hidden", !msg);
  }

  if (els.btnResend) {
    els.btnResend.addEventListener("click", () => {
      clearOtp();
      startOtpTimer();
      showOtpError("");
      els.otpInputs[0] && els.otpInputs[0].focus();
    });
  }

  if (els.btnQrSim) {
    els.btnQrSim.addEventListener("click", () => {
      if (state.qrLeft <= 0) {
        startQrChallenge();
        return;
      }
      goNext();
    });
  }

  if (els.formGaOtp) {
    els.formGaOtp.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = els.formGaOtp.querySelector("#ga-otp");
      const code = String((input && input.value) || "").replace(/\D/g, "");
      if (els.gaOtpError) {
        els.gaOtpError.classList.add("hidden");
        els.gaOtpError.textContent = "";
      }
      if (code !== DEMO_OTP) {
        if (els.gaOtpError) {
          els.gaOtpError.textContent = "Código incorrecto. Demo Google Authenticator: 123456";
          els.gaOtpError.classList.remove("hidden");
        }
        return;
      }
      goNext();
    });
  }

  const refreshQr = document.querySelector("[data-qr-refresh]");
  if (refreshQr) refreshQr.addEventListener("click", () => startQrChallenge());

  els.btnBack.forEach((btn) => {
    btn.addEventListener("click", () => {
      const to = btn.getAttribute("data-auth-back");
      stopTimers();
      if (to === "code-gate") setStep("code-gate");
      else if (to === "credentials") setStep("credentials");
      else if (to === "method") setStep("method");
    });
  });

  applyChrome();
  // No habituales: código primero (sin user/pass). Keycloak: credenciales.
  setStep(state.flow === "mfa" ? "code-gate" : "credentials");
  if (state.flow === "mfa") state.method = "qr";
})();
