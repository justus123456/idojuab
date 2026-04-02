// Sticky header on scroll
window.addEventListener("scroll", function () {
    const header = document.querySelector("header");
    header.classList.toggle("sticky", window.scrollY > 0);
});

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

    function renderPriceList(prices, tableBodyClass, gender) {
        const result = document.querySelector(tableBodyClass);
        if (!result) {
            console.error('Table body not found for class:', tableBodyClass);
            return;
        }

        const filteredPrices = prices.filter(item => item.gender === gender);
        result.innerHTML = filteredPrices.length > 0
            ? filteredPrices.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.clothType}</td>
                    <td><span id="line">&#8358;</span> ${item.ironingPrice || 'N/A'}</td>
                    <td><span id="line">&#8358;</span> ${item.washingPrice || 'N/A'}</td>
                    <td>${item.gender}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5">No items found.</td></tr>';
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
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            if (name && email && message) {
                const { error } = await client
                    .from('messages')
                    .insert({ name, email, message });

                if (error) {
                    console.error('Error submitting message:', error);
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
