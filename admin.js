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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('important-form');
    const clothTypeInput = document.getElementById('idk');
    const ironingPriceInput = document.getElementById('price-ironing');
    const washingPriceInput = document.getElementById('price-washing');
    const maleCheckbox = document.getElementById('male');
    const femaleCheckbox = document.getElementById('female');
    const priceTable = document.querySelector('.dat');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const clothType = clothTypeInput.value.trim();
        const ironingPrice = ironingPriceInput.value.trim();
        const washingPrice = washingPriceInput.value.trim();
        const maleChecked = maleCheckbox.checked;
        const femaleChecked = femaleCheckbox.checked;

        if (clothType && (ironingPrice || washingPrice)) {
            const priceList = JSON.parse(localStorage.getItem('priceList')) || [];
            priceList.push({ clothType, ironingPrice, washingPrice, maleChecked, femaleChecked });
            localStorage.setItem('priceList', JSON.stringify(priceList));

            // Clear form inputs
            clothTypeInput.value = '';
            ironingPriceInput.value = '';
            washingPriceInput.value = '';
            maleCheckbox.checked = false;
            femaleCheckbox.checked = false;

            renderPriceList();
        }
    });

    // Function to render the price list
    function renderPriceList() {
        const priceList = JSON.parse(localStorage.getItem('priceList')) || [];
        priceTable.innerHTML = priceList.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.clothType}</td>
                <td>${item.ironingPrice || 'N/A'}</td>
                <td>${item.washingPrice || 'N/A'}</td>
                <td>${item.maleChecked || item.femaleChecked ? (item.maleChecked ? 'Male' : 'Female') : 'N/A'}</td>
                <td><button class="delete" data-index="${index}">Delete</button></td>
            </tr>
        `).join('');
    }

    // Handle deletion of items
    priceTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete')) {
            const index = e.target.dataset.index;
            const priceList = JSON.parse(localStorage.getItem('priceList')) || [];
            priceList.splice(index, 1);
            localStorage.setItem('priceList', JSON.stringify(priceList));
            renderPriceList();
        }
    });

    // Clear the price list
    document.getElementById('clear').addEventListener('click', () => {
        localStorage.removeItem('priceList');
        renderPriceList();
    });

    // Initial render of the price list
    renderPriceList();
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('#logout, #log');

    // Check if the user is logged in
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html'; // Redirect to login page if not logged in
    }

    // Function to handle logout
    function handleLogout() {
        localStorage.removeItem('loggedIn');
        window.location.href = 'login.html'; // Redirect to login page
    }

    // Add event listener to both logout buttons
    logoutButtons.forEach(button => {
        button.addEventListener('click', handleLogout);
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const dataTable = document.querySelector('.datam');
    const clearButton = document.getElementById('delete');

    // Function to render messages from local storage
    function renderMessages() {
        let messages = JSON.parse(localStorage.getItem('messages')) || [];
        dataTable.innerHTML = messages.map((msg, index) => `
            <tr>
                <td>${msg.name}</td>
                <td>${msg.email}</td>
                <td>${msg.message}</td>
                <td><button class="del" data-index="${index}">Delete</button></td>
            </tr>
        `).join('');
    }

    // Function to delete message from local storage
    function deleteMessage(index) {
        let messages = JSON.parse(localStorage.getItem('messages')) || [];
        messages.splice(index, 1);
        localStorage.setItem('messages', JSON.stringify(messages));
        renderMessages();
    }

    // Event listener for delete buttons
    dataTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('del')) {
            const index = e.target.getAttribute('data-index');
            deleteMessage(index);
        }
    });

    // Event listener for clear button
    clearButton.addEventListener('click', () => {
        localStorage.removeItem('messages');
        renderMessages();
    });

    // Initial rendering of messages
    renderMessages();
});
