// Sticky header on scroll
window.addEventListener("scroll", function() {
    const header = document.querySelector("header");
    header.classList.toggle("sticky", window.scrollY > 0);
});
 function toggleMenu(){
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

// Scroll to top button
document.addEventListener('DOMContentLoaded', () => {
    const arrowButton = document.getElementById('arrow');

    // Show or hide the button based on scroll position
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            arrowButton.style.display = "block";
        } else {
            arrowButton.style.display = "none";
        }
    };

    // Scroll to the top of the document on button click
    arrowButton.addEventListener('click', function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const result = document.querySelector('.dat');

    // Function to render the price list
    function renderPriceList() {
        // Retrieve items from local storage
        const items = JSON.parse(localStorage.getItem('priceList')) || [];

        if (items.length > 0) {
            result.innerHTML = items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.clothType}</td>
                    <td>${item.ironingPrice || 'N/A'}</td>
                    <td>${item.washingPrice || 'N/A'}</td>
                    <td>${item.maleChecked || item.femaleChecked ? (item.maleChecked ? 'Male' : 'Female') : 'N/A'}</td>
                </tr>
            `).join('');
        } else {
            result.innerHTML = '<tr><td colspan="5">No items found.</td></tr>';
        }
    }

    // Initial render of the price list
    renderPriceList();
});
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('mail'); // Updated to match your HTML
    const messageInput = document.getElementById('info'); // Updated to match your HTML
    const successMessage = document.getElementById('success-message');

    if (form && nameInput && emailInput && messageInput && successMessage) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            if (name && email && message) {
                let messages = JSON.parse(localStorage.getItem('messages')) || [];
                messages.push({ name, email, message });
                localStorage.setItem('messages', JSON.stringify(messages));

                // Clear form fields
                nameInput.value = '';
                emailInput.value = '';
                messageInput.value = '';

                // Show success message
                successMessage.style.display = 'block';
                setTimeout(() => successMessage.style.display = 'none', 3000); // Hide after 3 seconds
            }
        });
    }
});

