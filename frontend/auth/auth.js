/* =====================================================
   AI HELPDESK AGENT — AUTHENTICATION LOGIC
   Shared by login.html and signup.html
====================================================== */

/*==========================
    TOAST (same pattern as
    the landing page)
==========================*/
const API_BASE = "http://127.0.0.1:8000";
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

        await submitAuthForm(
            loginForm,
            "/auth/login",
            {
                email: email.value.trim(),
                password: password.value
            },
            "Welcome back!",
            "../dashboard/dashboard.html"
        );

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

        await submitAuthForm(
            signupForm,
            "/auth/signup",
            {
                name: name.value.trim(),
                email: email.value.trim(),
                password: password.value
            },
            "Account created successfully! Please login.",
            "login.html"
        );

    });

}


/*==========================
    SHARED SUBMIT HANDLER
==========================*/

async function submitAuthForm(
    form,
    endpoint,
    payload,
    successMessage,
    redirectTo
) {

    const button = form.querySelector(".auth-submit");

    button.classList.add("loading");
    button.disabled = true;

    const API_BASE = "http://127.0.0.1:8000";

    try {

        let options = {
            method: "POST",
            headers: {},
            body: null
        };

        // LOGIN
        if (endpoint === "/auth/login") {

            const formData = new URLSearchParams();

            formData.append("username", payload.email);
            formData.append("password", payload.password);

            options.headers["Content-Type"] =
                "application/x-www-form-urlencoded";

            options.body = formData;

        }

        // SIGNUP
        else {

            options.headers["Content-Type"] =
                "application/json";

            options.body = JSON.stringify(payload);

        }

        const response = await fetch(
            API_BASE + endpoint,
            options
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Something went wrong"
            );

        }

        // Save token after login
        if (data.access_token) {

            localStorage.setItem(
                "access_token",
                data.access_token
            );

        }

        // Save user info
        localStorage.setItem(
            "ai_helpdesk_user",
            JSON.stringify({
                name: payload.name || payload.email.split("@")[0],
                email: payload.email
            })
        );

        showToast(successMessage, "success");

        setTimeout(() => {

            window.location.href = redirectTo;

        }, 800);

    } catch (err) {

        showToast(err.message, "error");

    } finally {

        button.classList.remove("loading");
        button.disabled = false;

    }

}