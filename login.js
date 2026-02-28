document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const password = document.getElementById('password');

    if (!form || !errorMessage || !password) {
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.supabaseClient) {
            errorMessage.textContent = 'Supabase client not available.';
            errorMessage.style.display = 'block';
            return;
        }

        const username = document.getElementById('username').value.trim();
        const passwordValue = password.value;
        const email = username.includes('@') ? username : `${username}@idojuan.local`;

        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password: passwordValue,
        });

        if (error) {
            errorMessage.textContent = error.message || 'Invalid credentials. Please try again.';
            errorMessage.style.display = 'block';
            return;
        }

        window.location.href = 'admin.html';
    });

    const showBtn = document.getElementById('show');
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            showBtn.classList.toggle('fa-eye');
            showBtn.classList.toggle('fa-eye-slash');
            password.type = password.type === 'password' ? 'text' : 'password';
        });
    }
});
