// ========================================
// STICKY HEADER + LOGOUT ICON TOGGLE
// ========================================
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


// ========================================
// MAIN APP
// ========================================
document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // AUTH CHECK (Supabase)
  // ========================================
  async function checkAuthentication() {
    if (!window.supabaseClient) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();

      if (!session) {
        window.location.href = "/login.html";
      }
    } catch (error) {
      window.location.href = "/login.html";
    }
  }

  checkAuthentication();


  // ========================================
  // LOGOUT FUNCTION (Supabase)
  // ========================================
  async function logoutUser(e) {
    if (e) e.preventDefault();

    try {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
      window.location.href = "/login.html";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login.html";
    }
  }

  const logoutText = document.getElementById("logout");
  const logoutIcon = document.getElementById("log");

  if (logoutText) logoutText.addEventListener("click", logoutUser);
  if (logoutIcon) logoutIcon.addEventListener("click", logoutUser);


  // ========================================
  // PRICE RENDERING
  // ========================================
  function renderPriceList(prices, selector, gender) {
    const tableBody = document.querySelector(selector);
    if (!tableBody) return;

    const filtered = prices.filter(item => item.gender === gender);

    if (filtered.length === 0) {
      tableBody.innerHTML =
        `<tr><td colspan="6">No ${gender} items found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.cloth_type ?? "N/A"}</td>
        <td>₦ ${item.ironing_price ?? "N/A"}</td>
        <td>₦ ${item.washing_price ?? "N/A"}</td>
        <td>${item.gender}</td>
        <td>
          <button class="delete-price"
                  data-id="${item.id}"
                  data-gender="${item.gender}">
            Delete
          </button>
        </td>
      </tr>
    `).join("");
  }


  // ========================================
  // FETCH PRICES (Supabase)
  // ========================================
  async function fetchPrices() {
    if (!window.supabaseClient) return;

    try {
      const { data, error } = await window.supabaseClient
        .from("prices")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching prices:", error);
        return;
      }

      renderPriceList(data || [], ".dat", "Male");
      renderPriceList(data || [], ".dats", "Female");

    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  fetchPrices();


  // ========================================
  // ADD PRICE (MALE) - Supabase
  // ========================================
  const maleForm = document.getElementById("important-form");

  if (maleForm) {
    maleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clothType = document.getElementById("idk").value.trim();
      const ironingPrice = document.getElementById("price-ironing").value.trim();
      const washingPrice = document.getElementById("price-washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;
      if (!window.supabaseClient) return;

      try {
        const { error } = await window.supabaseClient
          .from("prices")
          .insert({
            cloth_type: clothType,
            ironing_price: ironingPrice,
            washing_price: washingPrice,
            gender: "Male",
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


  // ========================================
  // ADD PRICE (FEMALE) - Supabase
  // ========================================
  const femaleForm = document.getElementById("important");

  if (femaleForm) {
    femaleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clothType = document.getElementById("idkk").value.trim();
      const ironingPrice = document.getElementById("ironing").value.trim();
      const washingPrice = document.getElementById("washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;
      if (!window.supabaseClient) return;

      try {
        const { error } = await window.supabaseClient
          .from("prices")
          .insert({
            cloth_type: clothType,
            ironing_price: ironingPrice,
            washing_price: washingPrice,
            gender: "Female",
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


  // ========================================
  // DELETE PRICE (Supabase)
  // ========================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete-price")) return;
    if (!window.supabaseClient) return;

    const id = e.target.dataset.id;

    try {
      const { error } = await window.supabaseClient
        .from("prices")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting price:", error);
        return;
      }

      fetchPrices();

    } catch (error) {
      console.error("Error deleting price:", error);
    }
  });


  // ========================================
  // MESSAGES (Supabase)
  // ========================================
  function renderMessages(messages) {
    const tableBody = document.querySelector(".datam");
    if (!tableBody) return;

    if (messages.length === 0) {
      tableBody.innerHTML =
        `<tr><td colspan="5">No messages found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = messages.map(msg => `
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
    `).join("");
  }

  async function fetchMessages() {
    if (!window.supabaseClient) return;

    try {
      const { data, error } = await window.supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      renderMessages(data || []);

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  fetchMessages();


  // ========================================
  // DELETE MESSAGE (Supabase)
  // ========================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete-message")) return;
    if (!window.supabaseClient) return;

    const id = e.target.dataset.id;

    try {
      const { error } = await window.supabaseClient
        .from("messages")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting message:", error);
        return;
      }

      fetchMessages();

    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

});