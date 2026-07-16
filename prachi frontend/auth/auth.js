/* =====================================================
   AI HELPDESK AGENT — AUTHENTICATION LOGIC
   Shared by login.html and signup.html
====================================================== */

/*==========================
    TOAST (same pattern as
    the landing page)
==========================*/

function showToast(message, type = "success") {

  let toast = document.querySelector(".toast");

  if (!toast) {

    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);

  }

  const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

  toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${message}</span>`;
  toast.className = `toast show ${type}`;

  clearTimeout(toast._hideTimer);

  toast._hideTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 3500);

}


/*==========================
    FIELD HELPERS
==========================*/

function setFieldState(input, errorEl, valid, message = "") {

  input.classList.toggle("valid", valid === true);
  input.classList.toggle("invalid", valid === false);

  if (errorEl) {

    errorEl.textContent = message;
    errorEl.classList.toggle("show", valid === false);

  }

}

function isValidEmail(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

}


/*==========================
    PASSWORD VISIBILITY TOGGLE
==========================*/

document.querySelectorAll(".password-toggle").forEach((btn) => {

  btn.addEventListener("click", () => {

    const input = btn.parentElement.querySelector("input");

    if (!input) return;

    const showing = input.type === "text";

    input.type = showing ? "password" : "text";

    btn.innerHTML = showing
      ? '<i class="fa-solid fa-eye" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>';

    btn.setAttribute(
      "aria-label",
      showing ? "Show password" : "Hide password"
    );

  });

});


/*==========================
    PASSWORD STRENGTH METER
    (only present on signup)
==========================*/

const strengthBars = document.querySelectorAll(".strength-meter span");
const strengthLabel = document.querySelector(".strength-label");
const passwordSignupInput = document.getElementById("signup-password");

function scorePassword(value) {

  let score = 0;

  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  return score; // 0–4

}

if (passwordSignupInput && strengthBars.length) {

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["#FF6B6B", "#FF6B6B", "#FFC15E", "#4ADE9C", "#4ADE9C"];

  passwordSignupInput.addEventListener("input", () => {

    const score = scorePassword(passwordSignupInput.value);

    strengthBars.forEach((bar, i) => {

      bar.style.background = i < score ? colors[score] : "rgba(255,255,255,.1)";

    });

    strengthLabel.textContent = passwordSignupInput.value
      ? `Password strength: ${labels[score]}`
      : "";

  });

}


/*==========================
    CONFIRM PASSWORD MATCH
    (only present on signup)
==========================*/

const confirmInput = document.getElementById("signup-confirm");
const confirmError = document.getElementById("signup-confirm-error");

if (confirmInput && passwordSignupInput) {

  const checkMatch = () => {

    if (!confirmInput.value) {

      setFieldState(confirmInput, confirmError, null);
      return;

    }

    const match = confirmInput.value === passwordSignupInput.value;

    setFieldState(
      confirmInput,
      confirmError,
      match,
      match ? "" : "Passwords don't match"
    );

  };

  confirmInput.addEventListener("input", checkMatch);
  passwordSignupInput.addEventListener("input", checkMatch);

}


/*==========================
    LIVE EMAIL VALIDATION
==========================*/

document.querySelectorAll('input[type="email"]').forEach((input) => {

  const errorEl = input.closest(".field")?.querySelector(".field-error");

  input.addEventListener("blur", () => {

    if (!input.value) {

      setFieldState(input, errorEl, null);
      return;

    }

    const valid = isValidEmail(input.value);

    setFieldState(
      input,
      errorEl,
      valid,
      valid ? "" : "Enter a valid email address"
    );

  });

});


/*==========================
    LOGIN FORM SUBMISSION
==========================*/

const loginForm = document.getElementById("login-form");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("login-email");
    const password = document.getElementById("login-password");
    const emailError = email.closest(".field")?.querySelector(".field-error");
    const passwordError = password.closest(".field")?.querySelector(".field-error");

    let valid = true;

    if (!isValidEmail(email.value)) {

      setFieldState(email, emailError, false, "Enter a valid email address");
      valid = false;

    } else {

      setFieldState(email, emailError, true);

    }

    if (!password.value) {

      setFieldState(password, passwordError, false, "Password is required");
      valid = false;

    } else {

      setFieldState(password, passwordError, true);

    }

    if (!valid) return;

    await submitAuthForm(loginForm, "/api/auth/login", {

      email: email.value.trim(),
      password: password.value,
      remember: document.getElementById("remember-me")?.checked ?? false,

    }, "Welcome back! Redirecting...", "../dashboard/dashboard.html");

  });

}


/*==========================
    SIGNUP FORM SUBMISSION
==========================*/

const signupForm = document.getElementById("signup-form");

if (signupForm) {

  signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("signup-name");
    const email = document.getElementById("signup-email");
    const password = document.getElementById("signup-password");
    const confirm = document.getElementById("signup-confirm");
    const terms = document.getElementById("signup-terms");

    const nameError = name.closest(".field")?.querySelector(".field-error");
    const emailError = email.closest(".field")?.querySelector(".field-error");
    const passwordError = password.closest(".field")?.querySelector(".field-error");

    let valid = true;

    if (name.value.trim().length < 2) {

      setFieldState(name, nameError, false, "Enter your full name");
      valid = false;

    } else {

      setFieldState(name, nameError, true);

    }

    if (!isValidEmail(email.value)) {

      setFieldState(email, emailError, false, "Enter a valid email address");
      valid = false;

    } else {

      setFieldState(email, emailError, true);

    }

    if (scorePassword(password.value) < 2) {

      setFieldState(password, passwordError, false, "Choose a stronger password");
      valid = false;

    } else {

      setFieldState(password, passwordError, true);

    }

    if (confirm.value !== password.value) {

      setFieldState(confirm, confirmError, false, "Passwords don't match");
      valid = false;

    }

    if (terms && !terms.checked) {

      showToast("Please accept the Terms to continue", "error");
      valid = false;

    }

    if (!valid) return;

    await submitAuthForm(signupForm, "/api/auth/signup", {

      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,

    }, "Account created! Redirecting...", "../dashboard/dashboard.html");

  });

}


/*==========================
    SHARED SUBMIT HANDLER

    NOTE for backend integration:
    Points at /api/auth/login and /api/auth/signup.
    Update these endpoint paths (and the response
    shape below) to match your actual API contract.
==========================*/

async function submitAuthForm(form, endpoint, payload, successMessage, redirectTo) {

  const button = form.querySelector(".auth-submit");

  button.classList.add("loading");
  button.disabled = true;

  try {

    const response = await fetch(endpoint, {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),

    });

    if (!response.ok) {

      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Something went wrong. Please try again.");

    }

    // Persist a lightweight session record so the dashboard can greet the
    // user by name. This is a frontend-only convenience — swap it out for
    // whatever your real auth/session response returns once wired up.
    try {

      const existing = JSON.parse(localStorage.getItem("ai_helpdesk_user") || "null") || {};

      localStorage.setItem("ai_helpdesk_user", JSON.stringify({

        name: payload.name || existing.name || payload.email.split("@")[0],
        email: payload.email,

      }));

    } catch (storageErr) {

      // Private browsing / storage disabled — not fatal, just skip personalization.

    }

    showToast(successMessage, "success");

    setTimeout(() => {

      window.location.href = redirectTo;

    }, 900);

  } catch (err) {

    // Backend not reachable yet (e.g. during frontend-only development):
    // fail gracefully instead of leaving the user stuck.
    showToast(
      err.message === "Failed to fetch"
        ? "Can't reach the server right now. Please try again."
        : err.message,
      "error"
    );

  } finally {

    button.classList.remove("loading");
    button.disabled = false;

  }

}
