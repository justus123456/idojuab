document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient;
  const form = document.getElementById("signup-form");
  const messageBox = document.getElementById("signup-message");

  if (!client || !form || !messageBox) {
    return;
  }

  function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.display = "block";
    messageBox.style.color = isError ? "#b42318" : "#14532d";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;
    const adminCode = document.getElementById("signup-admin-code").value.trim();

    if (!username || !email || !password || !confirmPassword || !adminCode) {
      showMessage("All fields are required.", true);
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", true);
      return;
    }

    // Call server-side admin signup endpoint
    try {
      const response = await fetch('/admin-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          adminCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error || 'Signup failed.', true);
        return;
      }

      form.reset();
      showMessage(result.message || 'Admin account created successfully.');
    } catch (error) {
      showMessage('Network error. Please try again.', true);
    }
  });
});
