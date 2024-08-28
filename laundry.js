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

const apiUrl = 'http://localhost:3000';

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
                        <td>${item.clothType}</td>
                        <td><span id="line">₦</span> ${item.ironingPrice || 'N/A'}</td>
                        <td><span id="line">₦</span> ${item.washingPrice || 'N/A'}</td>
                        <td>${item.gender}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5">No items found.</td></tr>';
        } else {
            console.error('Table body not found for class:', tableBodyClass);
        }
    }

    function poll() {
        fetch(`${apiUrl}/prices`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Data:', data); // Log fetched data
                renderPriceList(data, '.dat', 'Male');   // Render male prices
                renderPriceList(data, '.datd', 'Female'); // Render female prices
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
                    fetch(`${apiUrl}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, message })
                    })
                        .then(response => response.json())
                        .then(() => {
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
