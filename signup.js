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

    if (!window.ADMIN_SIGNUP_CODE || window.ADMIN_SIGNUP_CODE === "CHANGE_THIS_ADMIN_CODE") {
      showMessage("Admin signup code is not configured yet.", true);
      return;
    }

    if (adminCode !== window.ADMIN_SIGNUP_CODE) {
      showMessage("Invalid admin code.", true);
      return;
    }

    const { data: existingUser, error: lookupError } = await client
      .from("users")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      showMessage(lookupError.message, true);
      return;
    }

    if (existingUser) {
      showMessage("That username or email already exists.", true);
      return;
    }

    const isolatedClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: `signup-${Date.now()}`,
      },
    });

    const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      showMessage(signUpError.message || "Unable to create the new admin account.", true);
      return;
    }

    const { error: profileError } = await client.from("users").insert({
      username,
      email,
      password_hash: "",
      role: "admin",
    });

    if (profileError) {
      showMessage(profileError.message || "Auth user created, but profile insert failed.", true);
      return;
    }

    form.reset();
    showMessage(
      signUpData.user?.identities?.length
        ? "Admin account created successfully. You can now log in."
        : "Account created. Check the email inbox if Supabase asks for confirmation."
    );
  });
});
