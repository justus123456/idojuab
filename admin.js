// ========================================
// API URL SETUP
// ========================================
const apiUrl =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : window.location.origin;


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
  // AUTH CHECK
  // ========================================
  async function checkAuthentication() {
    try {
      const response = await fetch(`${apiUrl}/auth/check`, {
        credentials: "include",
      });

      if (!response.ok) {
        window.location.href = "/login.html";
      }
    } catch (error) {
      window.location.href = "/login.html";
    }
  }

  checkAuthentication();


  // ========================================
  // LOGOUT FUNCTION
  // ========================================
  async function logoutUser(e) {
    if (e) e.preventDefault();

    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/login.html";
    } catch (error) {
      console.error("Logout failed:", error);
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
        <td>${item.cloth_type ?? item.clothType ?? "N/A"}</td>
        <td>₦ ${item.ironing_price ?? item.ironingPrice ?? "N/A"}</td>
        <td>₦ ${item.washing_price ?? item.washingPrice ?? "N/A"}</td>
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
  // FETCH PRICES
  // ========================================
  async function fetchPrices() {
    try {
      const response = await fetch(`${apiUrl}/prices`, {
        credentials: "include"
      });

      const data = await response.json();

      renderPriceList(data, ".dat", "Male");
      renderPriceList(data, ".dats", "Female");

    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  fetchPrices();


  // ========================================
  // ADD PRICE (MALE)
  // ========================================
  const maleForm = document.getElementById("important-form");

  if (maleForm) {
    maleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clothType = document.getElementById("idk").value.trim();
      const ironingPrice = document.getElementById("price-ironing").value.trim();
      const washingPrice = document.getElementById("price-washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      try {
        await fetch(`${apiUrl}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clothType,
            ironingPrice,
            washingPrice,
            gender: "Male",
          }),
        });

        maleForm.reset();
        fetchPrices();

      } catch (error) {
        console.error("Error adding male price:", error);
      }
    });
  }


  // ========================================
  // ADD PRICE (FEMALE)
  // ========================================
  const femaleForm = document.getElementById("important");

  if (femaleForm) {
    femaleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clothType = document.getElementById("idkk").value.trim();
      const ironingPrice = document.getElementById("ironing").value.trim();
      const washingPrice = document.getElementById("washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      try {
        await fetch(`${apiUrl}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clothType,
            ironingPrice,
            washingPrice,
            gender: "Female",
          }),
        });

        femaleForm.reset();
        fetchPrices();

      } catch (error) {
        console.error("Error adding female price:", error);
      }
    });
  }


  // ========================================
  // DELETE PRICE (EVENT DELEGATION)
  // ========================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete-price")) return;

    const id = e.target.dataset.id;

    try {
      await fetch(`${apiUrl}/prices/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      fetchPrices();

    } catch (error) {
      console.error("Error deleting price:", error);
    }
  });


  // ========================================
  // MESSAGES
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
    try {
      const response = await fetch(`${apiUrl}/messages`, {
        credentials: "include"
      });

      const data = await response.json();
      renderMessages(data);

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  fetchMessages();


  // ========================================
  // DELETE MESSAGE
  // ========================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete-message")) return;

    const id = e.target.dataset.id;

    try {
      await fetch(`${apiUrl}/messages/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      fetchMessages();

    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

});