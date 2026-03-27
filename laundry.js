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
};
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
    // Function to render the price list
    function renderPriceList(prices, tableBodyClass, gender) {
        const result = document.querySelector(tableBodyClass);
        if (result) {
            const filteredPrices = prices.filter(item => item.gender === gender);
            result.innerHTML = filteredPrices.length > 0
                ? filteredPrices.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.cloth_type || item.clothType}</td>
                        <td><span id="line">₦</span> ${item.ironing_price || item.ironingPrice || 'N/A'}</td>
                        <td><span id="line">₦</span> ${item.washing_price || item.washingPrice || 'N/A'}</td>
                        <td>${item.gender}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5">No items found.</td></tr>';
        } else {
            console.error('Table body not found for class:', tableBodyClass);
        }
    }

    function poll() {
        if (!window.supabaseClient) {
            console.error('Supabase client not available for polling prices.');
            return;
        }

        window.supabaseClient
            .from('prices')
            .select('*')
            .order('id', { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching prices:', error);
                    return;
                }
                renderPriceList(data || [], '.dat', 'Male');
                renderPriceList(data || [], '.datd', 'Female');
            })
            .catch(error => console.error('Error fetching prices:', error));
    }

    setInterval(poll, 5000);
    poll();

    // Contact form handling
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('mail');
            const messageInput = document.getElementById('info');
            const successMessage = document.getElementById('success-message');
            const close = document.querySelector('.close');
            close.addEventListener('click', () => {
                successMessage.style.display = "none";
            })
            if (nameInput && emailInput && messageInput && successMessage) {
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const message = messageInput.value.trim();

                if (name && email && message) {
                    if (!window.supabaseClient) {
                        console.error('Supabase client not available.');
                        return;
                    }

                    window.supabaseClient
                        .from('messages')
                        .insert({ name, email, message })
                        .then(({ error }) => {
                            if (error) {
                                console.error('Error submitting message:', error);
                                return;
                            }
                            nameInput.value = '';
                            emailInput.value = '';
                            messageInput.value = '';
                            successMessage.style.display = 'block';
                            setTimeout(() => successMessage.style.display = 'none', 3000);
                        })
                        .catch(error => console.error('Error submitting message:', error));
                }
            }
        });
    } else {
        console.error('Contact form not found');
    }

});
