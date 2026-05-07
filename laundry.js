// Sticky header on scroll
window.addEventListener("scroll", function () {
    const header = document.querySelector("header");
    header.classList.toggle("sticky", window.scrollY > 0);

    const arrow = document.getElementById("arrow");
    if (arrow) {
        if (window.scrollY > 500) {
            arrow.style.display = "flex";
        } else {
            arrow.style.display = "none";
        }
    }
});

const arrow = document.getElementById("arrow");
if (arrow) {
    arrow.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

function toggleMenu() {
    const menuBar = document.querySelector('.menuToggle');
    const nav = document.querySelector('.nav');

    menuBar.classList.toggle('active');
    nav.classList.toggle('active');
}

// Preloader functionality
const preLoad = document.querySelector('.preloader');
const body = document.querySelector('body');

window.addEventListener('load', () => {
    setTimeout(() => {
        body.style.overflowY = 'scroll';
        preLoad.classList.add('fadeOut');
    }, 3000);
});

document.addEventListener('DOMContentLoaded', () => {
    const client = window.supabaseClient;

    if (!client) {
        console.error('Supabase client not available.');
        return;
    }

    function clearChildren(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function appendCell(row, value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
    }

    function renderPriceList(prices, tableBodyClass, gender) {
        const result = document.querySelector(tableBodyClass);
        if (!result) {
            console.error('Table body not found for class:', tableBodyClass);
            return;
        }

        const filteredPrices = prices.filter(item => item.gender === gender);
        clearChildren(result);

        if (filteredPrices.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No items found.';
            row.appendChild(cell);
            result.appendChild(row);
            return;
        }

        filteredPrices.forEach((item, index) => {
            const row = document.createElement('tr');
            appendCell(row, String(index + 1));
            appendCell(row, item.clothType || 'N/A');
            appendCell(row, `NGN ${item.ironingPrice || 'N/A'}`);
            appendCell(row, `NGN ${item.washingPrice || 'N/A'}`);
            result.appendChild(row);
        });
    }

    async function poll() {
        const { data, error } = await client
            .from('prices')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching prices:', error);
            return;
        }

        const normalized = data.map(item => ({
            id: item.id,
            gender: item.gender,
            clothType: item.cloth_type || item.clothType,
            ironingPrice: item.ironing_price || item.ironingPrice,
            washingPrice: item.washing_price || item.washingPrice,
        }));

        renderPriceList(normalized, '.dat', 'Male');
        renderPriceList(normalized, '.datd', 'Female');
    }

    setInterval(poll, 5000);
    poll();

    const form = document.getElementById('contact-form');
    if (!form) {
        console.error('Contact form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('mail');
        const messageInput = document.getElementById('info');
        const successMessage = document.getElementById('success-message');
        const close = document.querySelector('.close');

        if (close) {
            close.addEventListener('click', () => {
                successMessage.style.display = 'none';
            });
        }

        if (nameInput && emailInput && messageInput && successMessage) {
            const name = nameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const message = messageInput.value.trim();

            if (name && email && message) {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, message })
                });

                if (!response.ok) {
                    console.error('Error submitting message');
                    return;
                }

                nameInput.value = '';
                emailInput.value = '';
                messageInput.value = '';
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
        }
    });
});
