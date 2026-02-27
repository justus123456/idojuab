document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const password = document.getElementById('password');
    
    // Determine API URL based on environment
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin; // Use same origin for production

    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent form submission

        const username = document.getElementById('username').value;
        const passwordValue = password.value;

        try {
            const response = await fetch(apiUrl + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password: passwordValue }),
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = 'admin.html';
            } else {
                errorMessage.textContent = 'Invalid username or password'; // Display error message
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'An error occurred, please try again later'; // Display generic error message
            errorMessage.style.display = 'block';
        }
    });

    const showBtn = document.getElementById('show');
    showBtn.addEventListener('click', () => {
        showBtn.classList.toggle('fa-eye');
        showBtn.classList.toggle('fa-eye-slash');
        password.type = password.type === 'password' ? 'text' : 'password';
    });
    
});
