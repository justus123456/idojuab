document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-onboarding-form");
  const message = document.getElementById("onboarding-message");
  const invitedEmail = new URLSearchParams(window.location.search).get("email");

  if (invitedEmail) {
    const emailInput = document.getElementById("onboarding-email");
    if (emailInput) emailInput.value = invitedEmail;
  }

  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#14532d";
    message.style.display = "block";
  }

  function validatePasswordStrength(value) {
    if (value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
      return "Password must include uppercase, lowercase, number, and special character.";
    }
    return "";
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("onboarding-email").value.trim().toLowerCase();
    const otp = document.getElementById("otp").value.trim();
    const password = document.getElementById("new-password").value;

    if (!/^[0-9]{6}$/.test(otp)) {
      showMessage("Enter the 6-digit code from your invite email.", true);
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      showMessage(passwordError, true);
      return;
    }

    const response = await fetch("/api/admin-invite-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, password }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      showMessage(body.error || "Invalid or expired code.", true);
      return;
    }

    form.reset();
    showMessage("Admin account created. Redirecting to login...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1800);
  });
});
