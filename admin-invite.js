document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient;
  const form = document.getElementById("admin-invite-form");
  const message = document.getElementById("invite-message");

  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#14532d";
    message.style.display = "block";
  }

  if (!client || !form) {
    showMessage("Supabase client not available.", true);
    return;
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const session = sessionData?.session;

  if (sessionError || !session?.user?.email) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error: profileError } = await client
    .from("users")
    .select("id, email, role")
    .eq("email", session.user.email)
    .limit(1)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    await client.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("invite-email").value.trim().toLowerCase();
    if (!email) {
      showMessage("Candidate email is required.", true);
      return;
    }

    const response = await fetch("/api/admin-invite-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      showMessage(body.error || "Invite request failed.", true);
      return;
    }

    form.reset();
    showMessage("Invite sent if the request is eligible.");
  });
});
