// Sticky header on scroll
window.addEventListener("scroll", function() {
    const header = document.querySelector("header");
    const icon = document.getElementById('log');
    const log = document.getElementById('logout');
    if (header) {
        header.classList.toggle("sticky", window.scrollY > 0);
    }
    if (window.scrollY > 0) {
        if (log) log.style.display = 'none';
        if (icon) icon.style.display = 'block';
    } else {
        if (log) log.style.display = "block";
        if (icon) icon.style.display = 'none';
    }
});
// Admin.js

const apiUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // Function to render the price list for a specific gender
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
                        <td><button class="delete" data-id="${item.id}" data-gender="${gender}">Delete</button></td>
                    </tr>
                `).join('') 
                : '<tr><td colspan="6">No items found.</td></tr>';
        } else {
            console.error('Table body not found for class:', tableBodyClass);
        }
    }

    // Fetch prices and render them
    function fetchPrices() {
        fetch(`${apiUrl}/prices`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Data:', data); // Log fetched data
                renderPriceList(data, '.dat', 'Male');   // Render male prices
                renderPriceList(data, '.dats', 'Female'); // Render female prices
            })
            .catch(error => console.error('Error fetching prices:', error));
    }

    setInterval(fetchPrices, 5000);
    fetchPrices();

    // Form Handling for Adding Prices
    const maleForm = document.getElementById('important-form');
    const femaleForm = document.getElementById('important');

    if (maleForm) {
        maleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clothType = document.getElementById('idk').value.trim();
            const ironingPrice = document.getElementById('price-ironing').value.trim();
            const washingPrice = document.getElementById('price-washing').value.trim();
            const isMale = document.getElementById('male').checked;

            if (clothType && ironingPrice && washingPrice && isMale) {
                fetch(`${apiUrl}/prices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clothType, ironingPrice, washingPrice, gender: 'Male' })
                })
                .then(response => response.json())
                .then(() => {
                    maleForm.reset();
                    fetchPrices(); // Refresh the list
                })
                .catch(error => console.error('Error adding male price:', error));
            }
        });
    } else {
        console.error('Male form not found');
    }

    if (femaleForm) {
        femaleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clothType = document.getElementById('idkk').value.trim();
            const ironingPrice = document.getElementById('ironing').value.trim();
            const washingPrice = document.getElementById('washing').value.trim();
            const isFemale = document.getElementById('females').checked;

            if (clothType && ironingPrice && washingPrice && isFemale) {
                fetch(`${apiUrl}/prices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clothType, ironingPrice, washingPrice, gender: 'Female' })
                })
                .then(response => response.json())
                .then(() => {
                    femaleForm.reset();
                    fetchPrices(); // Refresh the list
                })
                .catch(error => console.error('Error adding female price:', error));
            }
        });
    } else {
        console.error('Female form not found');
    }

    // Clear Buttons Handling
    const clearMaleButton = document.getElementById('clear');
    const clearFemaleButton = document.getElementById('dear');
    const clearMessagesButton = document.getElementById('delete');

    if (clearMaleButton) {
        clearMaleButton.addEventListener('click', () => {
            fetch(`${apiUrl}/prices?gender=Male`, {
                method: 'DELETE'
            })
            .then(() => {
                renderPriceList([], '.dat', 'Male');   // Clear male prices
            })
            .catch(error => console.error('Error clearing male prices:', error));
        });
    } else {
        console.error('Clear male button not found');
    }

    if (clearFemaleButton) {
        clearFemaleButton.addEventListener('click', () => {
            fetch(`${apiUrl}/prices?gender=Female`, {
                method: 'DELETE'
            })
            .then(() => {
                renderPriceList([], '.dats', 'Female'); // Clear female prices
            })
            .catch(error => console.error('Error clearing female prices:', error));
        });
    } else {
        console.error('Clear female button not found');
    }

    if (clearMessagesButton) {
        clearMessagesButton.addEventListener('click', () => {
            fetch(`${apiUrl}/messages`, {
                method: 'DELETE'
            })
            .then(() => {
                renderMessageList([]); // Clear messages
            })
            .catch(error => console.error('Error clearing messages:', error));
        });
    } else {
        console.error('Clear messages button not found');
    }

    // Delete Button Handling for Prices
    function setupDeleteButtons() {
        document.querySelector('.dat').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete') && e.target.dataset.gender === 'Male') {
                const id = e.target.dataset.id;
                fetch(`${apiUrl}/prices/${id}`, {
                    method: 'DELETE'
                })
                .then(() => fetchPrices()) // Refresh the lists
                .catch(error => console.error('Error deleting male price:', error));
            }
        });

        document.querySelector('.dats').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete') && e.target.dataset.gender === 'Female') {
                const id = e.target.dataset.id;
                fetch(`${apiUrl}/prices/${id}`, {
                    method: 'DELETE'
                })
                .then(() => fetchPrices()) // Refresh the lists
                .catch(error => console.error('Error deleting female price:', error));
            }
        });
    }

    setupDeleteButtons();

    // Render Messages
    function renderMessageList(messages) {
        const result = document.querySelector('.datam');
        if (result) {
            result.innerHTML = messages.length > 0 
                ? messages.map((message) => `
                    <tr>
                        <td>${message.name}</td>
                        <td>${message.email}</td>
                        <td>${message.message}</td>
                        <td><button class="delete-message" data-id="${message.id}">Delete</button></td>
                    </tr>
                `).join('') 
                : '<tr><td colspan="4">No messages found.</td></tr>';
        } else {
            console.error('Table body not found for messages');
        }
    }

    function fetchMessages() {
        fetch(`${apiUrl}/messages`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Messages:', data); // Log fetched messages
                renderMessageList(data); // Render messages
            })
            .catch(error => console.error('Error fetching messages:', error));
    }

    fetchMessages(); // Fetch messages on load

    // Delete Message Handling
    document.querySelector('.datam').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-message')) {
            const id = e.target.dataset.id;
            fetch(`${apiUrl}/messages/${id}`, {
                method: 'DELETE'
            })
            .then(() => fetchMessages()) // Refresh the message list
            .catch(error => console.error('Error deleting message:', error));
        }
    });
});
// admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Function to check authentication status
    function checkAuthentication() {
        const loggedIn = localStorage.getItem('loggedIn');
        if (loggedIn !== 'true') {
            // Redirect to login page if not logged in
            window.location.href = '/login.html';
        }
    }

    checkAuthentication();

    // Logout functionality
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('loggedIn');
            window.location.href = 'login.html';
        });
    }
});
