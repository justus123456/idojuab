// login.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Simulated admin credentials
    const adminCredentials = {
        username: 'admin',
        password: 'pa'
    };

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent form submission

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === adminCredentials.username && password === adminCredentials.password) {
            // Successful login, redirect to admin.html
            window.location.href = 'admin.html';
            localStorage.setItem('loggedIn', 'true');
        } else {
            // Show error message
            errorMessage.style.display = 'block';
            
        }
    });
    const showBtn = document.getElementById('show')
    showBtn.addEventListener('click',()=>{
        showBtn.classList.toggle('fa-eye')
        showBtn.classList.toggle('fa-eye-slash')
      if (password.type === 'password') {
        password.type = 'text';
      }else{
        password.type = 'password';
      }
    })
    
});
