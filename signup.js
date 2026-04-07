document.addEventListener("DOMContentLoaded", () => {
  const messageBox = document.getElementById("signup-message");

  if (!messageBox) {
    return;
  }

  messageBox.textContent = "Public admin signup is disabled. Create admin users in Supabase or via a verified server-side flow.";
  messageBox.style.display = "block";
  messageBox.style.color = "#b42318";
});
