window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  const logoutText = document.getElementById("logout");
  const logoutIcon = document.getElementById("log");

  if (header) {
    header.classList.toggle("sticky", window.scrollY > 0);
  }

  if (window.scrollY > 0) {
    if (logoutText) logoutText.style.display = "none";
    if (logoutIcon) logoutIcon.style.display = "block";
  } else {
    if (logoutText) logoutText.style.display = "block";
    if (logoutIcon) logoutIcon.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient;

  if (!client) {
    window.location.href = "login.html";
    return;
  }

  function normalizePrice(item) {
    return {
      id: item.id,
      clothType: item.cloth_type ?? item.clothType ?? "N/A",
      ironingPrice: item.ironing_price ?? item.ironingPrice ?? "N/A",
      washingPrice: item.washing_price ?? item.washingPrice ?? "N/A",
      gender: item.gender ?? "N/A",
    };
  }

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }

  function renderEmptyRow(tableBody, columnCount, message) {
    clearChildren(tableBody);
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = columnCount;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function renderPriceList(prices, selector, gender) {
    const tableBody = document.querySelector(selector);
    if (!tableBody) return;

    const filtered = prices.filter((item) => item.gender === gender);

    if (filtered.length === 0) {
      renderEmptyRow(tableBody, 6, `No ${gender} items found.`);
      return;
    }

    clearChildren(tableBody);

    filtered.forEach((item, index) => {
      const row = document.createElement("tr");
      appendCell(row, String(index + 1));
      appendCell(row, item.clothType);
      appendCell(row, `NGN ${item.ironingPrice}`);
      appendCell(row, `NGN ${item.washingPrice}`);
      appendCell(row, item.gender);

      const actionCell = document.createElement("td");
      const button = document.createElement("button");
      button.className = "delete-price";
      button.dataset.id = String(item.id);
      button.dataset.gender = item.gender;
      button.textContent = "Delete";
      actionCell.appendChild(button);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  }

  function renderMessages(messages) {
    const tableBody = document.querySelector(".datam");
    if (!tableBody) return;

    if (!messages.length) {
      renderEmptyRow(tableBody, 5, "No messages found.");
      return;
    }

    clearChildren(tableBody);

    messages.forEach((msg) => {
      const row = document.createElement("tr");
      appendCell(row, msg.name ?? "");
      appendCell(row, msg.email ?? "");
      appendCell(row, msg.message ?? "");
      appendCell(row, msg.created_at ? new Date(msg.created_at).toLocaleString() : "-");

      const actionCell = document.createElement("td");
      const button = document.createElement("button");
      button.className = "delete-message";
      button.dataset.id = String(msg.id);
      button.textContent = "Delete";
      actionCell.appendChild(button);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  }

  async function requireAdmin() {
    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      const session = sessionData?.session;

      if (sessionError || !session?.user?.email) {
        window.location.href = 'login.html';
        return null;
      }

      const { data: adminProfile, error: profileError } = await client
        .from('users')
        .select('id, username, role, email')
        .eq('email', session.user.email)
        .limit(1)
        .maybeSingle();

      if (profileError || !adminProfile || adminProfile.role !== 'admin') {
        window.location.href = 'login.html';
        return null;
      }

      return adminProfile;
    } catch (error) {
      console.error('Admin auth error:', error);
      window.location.href = 'login.html';
      return null;
    }
  }

  async function fetchPrices() {
    try {
      const { data, error } = await client
        .from('prices')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error("Error fetching prices:", error);
        return;
      }

      const normalized = data.map(normalizePrice);
      renderPriceList(normalized, ".dat", "Male");
      renderPriceList(normalized, ".dats", "Female");
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      renderMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function logoutUser(event) {
    if (event) event.preventDefault();

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        console.error('Logout failed:', error);
        return;
      }

      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async function requestAdminInvite(email, messageBox, form) {
    try {
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        if (messageBox) messageBox.textContent = "Please log in again before sending invites.";
        return;
      }

      const response = await fetch("/api/admin-invite-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (messageBox) messageBox.textContent = result.error || "Invite request failed.";
        return;
      }

      if (form) form.reset();
      if (messageBox) messageBox.textContent = "Invite sent if the request is eligible.";
    } catch (error) {
      console.error("Invite request failed:", error);
      if (messageBox) messageBox.textContent = "Invite request failed.";
    }
  }

  const adminUser = await requireAdmin();
  if (!adminUser) {
    return;
  }

  const logoutText = document.getElementById("logout");
  const logoutIcon = document.getElementById("log");

  if (logoutText) logoutText.addEventListener("click", logoutUser);
  if (logoutIcon) logoutIcon.addEventListener("click", logoutUser);

  const inviteForm = document.getElementById("admin-invite-form");
  if (inviteForm) {
    inviteForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailInput = document.getElementById("invite-email");
      const messageBox = document.getElementById("invite-message");
      const email = emailInput?.value.trim().toLowerCase();

      if (!email) {
        if (messageBox) messageBox.textContent = "Candidate email is required.";
        return;
      }

      await requestAdminInvite(email, messageBox, inviteForm);
    });
  }

  const maleForm = document.getElementById("important-form");
  if (maleForm) {
    maleForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const clothType = document.getElementById("idk").value.trim();
      const ironingPrice = document.getElementById("price-ironing").value.trim();
      const washingPrice = document.getElementById("price-washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      try {
        const { error } = await client
          .from('prices')
          .insert({
            cloth_type: clothType,
            ironing_price: Number(ironingPrice),
            washing_price: Number(washingPrice),
            gender: "Male"
        });

        if (error) {
          console.error("Error adding male price:", error);
          return;
        }

        maleForm.reset();
        fetchPrices();
      } catch (error) {
        console.error("Error adding male price:", error);
      }
    });
  }

  const femaleForm = document.getElementById("important");
  if (femaleForm) {
    femaleForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const clothType = document.getElementById("idkk").value.trim();
      const ironingPrice = document.getElementById("ironing").value.trim();
      const washingPrice = document.getElementById("washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      try {
        const { error } = await client
          .from('prices')
          .insert({
            cloth_type: clothType,
            ironing_price: Number(ironingPrice),
            washing_price: Number(washingPrice),
            gender: "Female"
        });

        if (error) {
          console.error("Error adding female price:", error);
          return;
        }

        femaleForm.reset();
        fetchPrices();
      } catch (error) {
        console.error("Error adding female price:", error);
      }
    });
  }

  document.addEventListener("click", async (event) => {
    const priceButton = event.target.closest(".delete-price");
    if (priceButton) {
      try {
        const { error } = await client
          .from('prices')
          .delete()
          .eq('id', Number(priceButton.dataset.id));

        if (error) {
          console.error("Error deleting price:", error);
          return;
        }

        fetchPrices();
      } catch (error) {
        console.error("Error deleting price:", error);
      }
      return;
    }

    const messageButton = event.target.closest(".delete-message");
    if (messageButton) {
      try {
        const { error } = await client
          .from('messages')
          .delete()
          .eq('id', Number(messageButton.dataset.id));

        if (error) {
          console.error("Error deleting message:", error);
          return;
        }

        fetchMessages();
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  });

  const clearMaleButton = document.getElementById("clear");
  if (clearMaleButton) {
    clearMaleButton.addEventListener("click", async () => {
      if (!window.confirm("Clear all Male prices? This cannot be undone.")) return;

      try {
        const { error } = await client
          .from('prices')
          .delete()
          .eq('gender', 'Male');

        if (error) {
          console.error("Error clearing male prices:", error);
          return;
        }

        fetchPrices();
      } catch (error) {
        console.error("Error clearing male prices:", error);
      }
    });
  }

  const clearFemaleButton = document.getElementById("dear");
  if (clearFemaleButton) {
    clearFemaleButton.addEventListener("click", async () => {
      if (!window.confirm("Clear all Female prices? This cannot be undone.")) return;

      try {
        const { error } = await client
          .from('prices')
          .delete()
          .eq('gender', 'Female');

        if (error) {
          console.error("Error clearing female prices:", error);
          return;
        }

        fetchPrices();
      } catch (error) {
        console.error("Error clearing female prices:", error);
      }
    });
  }

  const clearMessagesButton = document.getElementById("delete");
  if (clearMessagesButton) {
    clearMessagesButton.addEventListener("click", async () => {
      if (!window.confirm("Clear all messages? This cannot be undone.")) return;

      try {
        const { error } = await client
          .from('messages')
          .delete()
          .gte('id', 0);

        if (error) {
          console.error("Error clearing messages:", error);
          return;
        }

        fetchMessages();
      } catch (error) {
        console.error("Error clearing messages:", error);
      }
    });
  }

  fetchPrices();
  fetchMessages();
});
