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

  function renderPriceList(prices, selector, gender) {
    const tableBody = document.querySelector(selector);
    if (!tableBody) return;

    const filtered = prices.filter((item) => item.gender === gender);

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6">No ${gender} items found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.clothType}</td>
        <td>&#8358; ${item.ironingPrice}</td>
        <td>&#8358; ${item.washingPrice}</td>
        <td>${item.gender}</td>
        <td>
          <button class="delete-price" data-id="${item.id}" data-gender="${item.gender}">
            Delete
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  function renderMessages(messages) {
    const tableBody = document.querySelector(".datam");
    if (!tableBody) return;

    if (!messages.length) {
      tableBody.innerHTML = `<tr><td colspan="5">No messages found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = messages
      .map(
        (msg) => `
      <tr>
        <td>${msg.name}</td>
        <td>${msg.email}</td>
        <td>${msg.message}</td>
        <td>${msg.created_at ? new Date(msg.created_at).toLocaleString() : "-"}</td>
        <td>
          <button class="delete-message" data-id="${msg.id}">
            Delete
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  async function requireAdmin() {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user?.email) {
      window.location.href = "login.html";
      return null;
    }

    const { data: userRow, error } = await client
      .from("users")
      .select("id, username, email, role")
      .eq("email", session.user.email)
      .limit(1)
      .maybeSingle();

    if (error || !userRow || userRow.role !== "admin") {
      await client.auth.signOut();
      window.location.href = "login.html";
      return null;
    }

    return userRow;
  }

  async function fetchPrices() {
    const { data, error } = await client
      .from("prices")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching prices:", error);
      return;
    }

    const normalized = data.map(normalizePrice);
    renderPriceList(normalized, ".dat", "Male");
    renderPriceList(normalized, ".dats", "Female");
  }

  async function fetchMessages() {
    const { data, error } = await client
      .from("messages")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    renderMessages(data);
  }

  async function logoutUser(event) {
    if (event) event.preventDefault();

    const { error } = await client.auth.signOut();
    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    window.location.href = "login.html";
  }

  const adminUser = await requireAdmin();
  if (!adminUser) {
    return;
  }

  const logoutText = document.getElementById("logout");
  const logoutIcon = document.getElementById("log");

  if (logoutText) logoutText.addEventListener("click", logoutUser);
  if (logoutIcon) logoutIcon.addEventListener("click", logoutUser);

  const maleForm = document.getElementById("important-form");
  if (maleForm) {
    maleForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const clothType = document.getElementById("idk").value.trim();
      const ironingPrice = document.getElementById("price-ironing").value.trim();
      const washingPrice = document.getElementById("price-washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      const { error } = await client.from("prices").insert({
        cloth_type: clothType,
        ironing_price: Number(ironingPrice),
        washing_price: Number(washingPrice),
        gender: "Male",
      });

      if (error) {
        console.error("Error adding male price:", error);
        return;
      }

      maleForm.reset();
      fetchPrices();
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

      const { error } = await client.from("prices").insert({
        cloth_type: clothType,
        ironing_price: Number(ironingPrice),
        washing_price: Number(washingPrice),
        gender: "Female",
      });

      if (error) {
        console.error("Error adding female price:", error);
        return;
      }

      femaleForm.reset();
      fetchPrices();
    });
  }

  document.addEventListener("click", async (event) => {
    const priceButton = event.target.closest(".delete-price");
    if (priceButton) {
      const { error } = await client.from("prices").delete().eq("id", Number(priceButton.dataset.id));
      if (error) {
        console.error("Error deleting price:", error);
        return;
      }
      fetchPrices();
      return;
    }

    const messageButton = event.target.closest(".delete-message");
    if (messageButton) {
      const { error } = await client.from("messages").delete().eq("id", Number(messageButton.dataset.id));
      if (error) {
        console.error("Error deleting message:", error);
        return;
      }
      fetchMessages();
    }
  });

  const clearMaleButton = document.getElementById("clear");
  if (clearMaleButton) {
    clearMaleButton.addEventListener("click", async () => {
      const { error } = await client.from("prices").delete().eq("gender", "Male");
      if (error) {
        console.error("Error clearing male prices:", error);
        return;
      }
      fetchPrices();
    });
  }

  const clearFemaleButton = document.getElementById("dear");
  if (clearFemaleButton) {
    clearFemaleButton.addEventListener("click", async () => {
      const { error } = await client.from("prices").delete().eq("gender", "Female");
      if (error) {
        console.error("Error clearing female prices:", error);
        return;
      }
      fetchPrices();
    });
  }

  const clearMessagesButton = document.getElementById("delete");
  if (clearMessagesButton) {
    clearMessagesButton.addEventListener("click", async () => {
      const { error } = await client.from("messages").delete().gt("id", 0);
      if (error) {
        console.error("Error clearing messages:", error);
        return;
      }
      fetchMessages();
    });
  }

  fetchPrices();
  fetchMessages();
});
