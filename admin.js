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
    try {
      const response = await fetch('/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        window.location.href = 'login.html';
        return null;
      }

      const body = await response.json();
      if (!body.user || body.user.role !== 'admin') {
        window.location.href = 'login.html';
        return null;
      }

      return body.user;
    } catch (error) {
      console.error('Admin auth error:', error);
      window.location.href = 'login.html';
      return null;
    }
  }

  async function fetchPrices() {
    try {
      const response = await fetch('/prices', { credentials: 'include' });
      if (!response.ok) {
        console.error("Error fetching prices:", response.statusText);
        return;
      }

      const data = await response.json();
      const normalized = data.map(normalizePrice);
      renderPriceList(normalized, ".dat", "Male");
      renderPriceList(normalized, ".dats", "Female");
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  async function fetchMessages() {
    try {
      const response = await fetch('/messages', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error("Error fetching messages:", response.statusText);
        return;
      }

      const data = await response.json();
      renderMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function logoutUser(event) {
    if (event) event.preventDefault();

    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Logout failed:', err);
        return;
      }

      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout failed:', error);
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

  const maleForm = document.getElementById("important-form");
  if (maleForm) {
    maleForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const clothType = document.getElementById("idk").value.trim();
      const ironingPrice = document.getElementById("price-ironing").value.trim();
      const washingPrice = document.getElementById("price-washing").value.trim();

      if (!clothType || !ironingPrice || !washingPrice) return;

      try {
        const response = await fetch('/prices', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clothType,
            ironingPrice: Number(ironingPrice),
            washingPrice: Number(washingPrice),
            gender: "Male"
          })
        });

        if (!response.ok) {
          const error = await response.json();
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
        const response = await fetch('/prices', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clothType,
            ironingPrice: Number(ironingPrice),
            washingPrice: Number(washingPrice),
            gender: "Female"
          })
        });

        if (!response.ok) {
          const error = await response.json();
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
        const response = await fetch(`/prices/${priceButton.dataset.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
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
        const response = await fetch(`/messages/${messageButton.dataset.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
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
      try {
        const response = await fetch('/prices?gender=Male', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
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
      try {
        const response = await fetch('/prices?gender=Female', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
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
      try {
        const response = await fetch('/messages', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
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
