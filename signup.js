document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient;
  const form = document.getElementById("signup-form");
  const messageBox = document.getElementById("signup-message");
  const expectedAdminCode = window.ADMIN_SIGNUP_CODE;

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

    try {
      if (!expectedAdminCode) {
        showMessage("Admin signup is not configured for static hosting. Add window.ADMIN_SIGNUP_CODE in signup-config.js or create the user in Supabase.", true);
        return;
      }

      if (adminCode !== expectedAdminCode) {
        showMessage("Invalid admin code.", true);
        return;
      }

      const normalizedEmail = email.toLowerCase();
      const { data: existingUser, error: lookupError } = await client
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${normalizedEmail}`)
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        showMessage(lookupError.message || "Failed to validate account details.", true);
        return;
      }

      if (existingUser) {
        showMessage("Username or email already exists.", true);
        return;
      }

      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username,
            role: 'admin'
          }
        }
      });

      if (signUpError) {
        showMessage(signUpError.message || "Signup failed.", true);
        return;
      }

      const { error: profileError } = await client
        .from('users')
        .insert({
          username,
          email: normalizedEmail,
          role: 'admin'
        });

      if (profileError) {
        showMessage(profileError.message || "Account created in Auth, but profile creation failed.", true);
        return;
      }

      form.reset();
      showMessage(
        signUpData.user?.identities?.length
          ? "Admin account created successfully. You can now log in."
          : "Account created. Check your email if confirmation is required."
      );
    } catch (error) {
      showMessage('Network error. Please try again.', true);
    }
  });
});
