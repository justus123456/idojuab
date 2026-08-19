const BUSINESS_PHONE_E164 = "2348063894359";
const BUSINESS_HOURS = [
    { day: 1, open: "08:00", close: "18:00" },
    { day: 2, open: "08:00", close: "18:00" },
    { day: 3, open: "08:00", close: "18:00" },
    { day: 4, open: "08:00", close: "18:00" },
    { day: 5, open: "08:00", close: "18:00" },
    { day: 6, open: "08:00", close: "18:00" },
];

let latestPrices = [];
let estimateItems = [];

window.addEventListener("scroll", function () {
    const header = document.querySelector("header");
    const arrow = document.getElementById("arrow");

    if (header) header.classList.toggle("sticky", window.scrollY > 0);
    if (arrow) arrow.style.display = window.scrollY > 500 ? "block" : "none";
});

function toggleMenu() {
    const menuBar = document.querySelector(".menuToggle");
    const nav = document.querySelector(".nav");

    if (menuBar) menuBar.classList.toggle("active");
    if (nav) nav.classList.toggle("active");
}

function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function parseTime(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "N/A";

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(number);
}

function getOpenStatus(now = new Date()) {
    const today = BUSINESS_HOURS.find((item) => item.day === now.getDay());
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (today) {
        const open = parseTime(today.open);
        const close = parseTime(today.close);
        if (minutes >= open && minutes < close) {
            return { open: true, label: `Open now - closes ${today.close}` };
        }
    }

    const upcoming = [...BUSINESS_HOURS, ...BUSINESS_HOURS]
        .map((item, index) => ({ ...item, offset: index >= BUSINESS_HOURS.length ? 7 : 0 }))
        .find((item) => item.day + item.offset > now.getDay() || (item.day === now.getDay() && parseTime(item.open) > minutes));

    return { open: false, label: upcoming ? `Closed - opens ${upcoming.open}` : "Closed" };
}

function updateStoreStatus() {
    const status = document.getElementById("store-status");
    if (!status) return;

    const current = getOpenStatus();
    status.textContent = current.label;
    status.classList.toggle("is-open", current.open);
    status.classList.toggle("is-closed", !current.open);
}

function renderPriceList(prices, tableBodyClass, gender) {
    const result = document.querySelector(tableBodyClass);
    if (!result) return;

    const filteredPrices = prices.filter((item) => item.gender === gender);
    clearChildren(result);

    if (filteredPrices.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No items found.";
        row.appendChild(cell);
        result.appendChild(row);
        return;
    }

    filteredPrices.forEach((item, index) => {
        const row = document.createElement("tr");
        appendCell(row, String(index + 1));
        appendCell(row, item.clothType || "N/A");
        appendCell(row, formatPrice(item.ironingPrice));
        appendCell(row, formatPrice(item.washingPrice));
        appendCell(row, item.gender || "N/A");
        result.appendChild(row);
    });
}

function updateEstimatorOptions() {
    const select = document.getElementById("estimator-item");
    if (!select) return;

    const selectedValue = select.value;
    clearChildren(select);

    if (latestPrices.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No prices available";
        select.appendChild(option);
        return;
    }

    latestPrices.forEach((price) => {
        const option = document.createElement("option");
        option.value = String(price.id);
        option.textContent = `${price.clothType} (${price.gender})`;
        select.appendChild(option);
    });

    if (selectedValue) select.value = selectedValue;
}

function buildEstimateMessage() {
    if (estimateItems.length === 0) {
        return "Hello Idojuan Laundry, I would like to ask about your laundry services.";
    }

    const lines = estimateItems.map((item, index) => `${index + 1}. ${item.clothType} (${item.gender}) - ${item.service}: ${formatPrice(item.price)}`);
    const total = estimateItems.reduce((sum, item) => sum + item.price, 0);
    return `Hello Idojuan Laundry, I plan to bring these items:\n${lines.join("\n")}\nEstimated total: ${formatPrice(total)}\nPlease confirm final pricing in-store.`;
}

function renderEstimate() {
    const list = document.getElementById("estimate-list");
    const totalEl = document.getElementById("estimate-total");
    const whatsappLink = document.getElementById("whatsapp-estimate");
    if (!list || !totalEl || !whatsappLink) return;

    clearChildren(list);

    estimateItems.forEach((item, index) => {
        const row = document.createElement("li");
        const label = document.createElement("span");
        const remove = document.createElement("button");

        label.textContent = `${item.clothType} (${item.gender}) - ${item.service}: ${formatPrice(item.price)}`;
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            estimateItems = estimateItems.filter((_, itemIndex) => itemIndex !== index);
            renderEstimate();
        });

        row.appendChild(label);
        row.appendChild(remove);
        list.appendChild(row);
    });

    const total = estimateItems.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `Total: ${formatPrice(total)}`;
    whatsappLink.href = `https://wa.me/${BUSINESS_PHONE_E164}?text=${encodeURIComponent(buildEstimateMessage())}`;
}

function setupEstimator() {
    const addButton = document.getElementById("add-estimate-item");
    const itemSelect = document.getElementById("estimator-item");
    const serviceSelect = document.getElementById("estimator-service");
    const copyButton = document.getElementById("copy-estimate");

    if (addButton && itemSelect && serviceSelect) {
        addButton.addEventListener("click", () => {
            const selected = latestPrices.find((item) => String(item.id) === itemSelect.value);
            if (!selected) return;

            const service = serviceSelect.value;
            const price = Number(service === "ironing" ? selected.ironingPrice : selected.washingPrice);
            if (!Number.isFinite(price)) return;

            estimateItems.push({ clothType: selected.clothType, gender: selected.gender, service, price });
            renderEstimate();
        });
    }

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(buildEstimateMessage());
                copyButton.textContent = "Copied";
                setTimeout(() => {
                    copyButton.textContent = "Copy list";
                }, 1800);
            } catch (error) {
                console.error("Could not copy estimate:", error);
            }
        });
    }

    renderEstimate();
}

function setupFaq() {
    document.querySelectorAll(".faq-question").forEach((button) => {
        button.addEventListener("click", () => {
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!expanded));
            button.closest(".faq-item")?.classList.toggle("active", !expanded);
        });
    });
}

function setupContactHelpers() {
    const copyAddress = document.getElementById("copy-address");
    const address = document.getElementById("business-address");

    if (copyAddress && address) {
        copyAddress.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(address.textContent.trim());
                copyAddress.textContent = "copied";
                setTimeout(() => {
                    copyAddress.textContent = "copy address";
                }, 1800);
            } catch (error) {
                console.error("Could not copy address:", error);
            }
        });
    }

    const arrow = document.getElementById("arrow");
    if (arrow) {
        arrow.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

window.addEventListener("load", () => {
    const preLoad = document.querySelector(".preloader");
    const body = document.querySelector("body");

    setTimeout(() => {
        if (body) body.style.overflowY = "scroll";
        if (preLoad) preLoad.classList.add("fadeOut");
    }, 1200);
});

document.addEventListener("DOMContentLoaded", () => {
    const client = window.supabaseClient;

    updateStoreStatus();
    setInterval(updateStoreStatus, 60 * 1000);
    setupFaq();
    setupEstimator();
    setupContactHelpers();

    if (!client) {
        console.error("Supabase client not available.");
        return;
    }

    async function poll() {
        const { data, error } = await client
            .from("prices")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("Error fetching prices:", error);
            return;
        }

        latestPrices = data.map((item) => ({
            id: item.id,
            gender: item.gender,
            clothType: item.cloth_type || item.clothType,
            ironingPrice: item.ironing_price ?? item.ironingPrice,
            washingPrice: item.washing_price ?? item.washingPrice,
        }));

        renderPriceList(latestPrices, ".dat", "Male");
        renderPriceList(latestPrices, ".datd", "Female");
        updateEstimatorOptions();
        renderEstimate();
    }

    setInterval(poll, 5000);
    poll();

    const form = document.getElementById("contact-form");
    if (!form) return;

    const close = document.querySelector(".close");
    const successMessage = document.getElementById("success-message");
    if (close && successMessage) {
        close.addEventListener("click", () => {
            successMessage.style.display = "none";
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("mail");
        const messageInput = document.getElementById("info");

        if (!nameInput || !emailInput || !messageInput || !successMessage) return;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const message = messageInput.value.trim();

        if (!name || !email || !message) return;

        const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message }),
        });

        if (!response.ok) {
            console.error("Error submitting message");
            return;
        }

        nameInput.value = "";
        emailInput.value = "";
        messageInput.value = "";
        successMessage.style.display = "block";
        setTimeout(() => {
            successMessage.style.display = "none";
        }, 5000);
    });
});
