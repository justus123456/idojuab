document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const password = document.getElementById('password');

  form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent form submission

      const username = document.getElementById('username').value;
      const passwordValue = document.getElementById('password').value;

      try {
          const response = await fetch('http://localhost:3000/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password: passwordValue }),
          });

          if (response.ok) {
              localStorage.setItem('loggedIn', 'true');
              window.location.href = 'admin.html';
          } else {
              errorMessage.style.display = 'block';
          }
      } catch (error) {
          console.error('Error:', error);
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
