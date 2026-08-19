document.addEventListener('DOMContentLoaded', () => {
    const PRODUCTION_SITE_URL = 'https://idojuan-laundry.netlify.app';
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const password = document.getElementById('password');
    const loginSection = document.getElementById('login-section');
    const resetSection = document.getElementById('reset-section');
    const resetForm = document.getElementById('reset-form');
    const resetMessage = document.getElementById('reset-message');

    if (!window.supabaseClient) {
        errorMessage.textContent = 'Supabase client not available.';
        errorMessage.style.display = 'block';
        return;
    }

    function validatePasswordStrength(value) {
        if (value.length < 8) {
            return 'Password must be at least 8 characters.';
        }

        if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
            return 'Password must include uppercase, lowercase, number, and special character.';
        }

        return '';
    }

    // Check if this is a password reset callback
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const isReset = params.get('type') === 'recovery';

    if (isReset) {
        loginSection.style.display = 'none';
        resetSection.style.display = 'block';
        setupResetForm();
    } else {
        setupLoginForm();
    }

    function setupLoginForm() {
        if (!form || !errorMessage || !password) {
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim().toLowerCase();
            const passwordValue = password.value;
            if (!email) {
                errorMessage.textContent = 'Email is required.';
                errorMessage.style.display = 'block';
                return;
            }

            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password: passwordValue
            });

            if (signInError) {
                errorMessage.textContent = signInError.message || 'Invalid credentials. Please try again.';
                errorMessage.style.display = 'block';
                return;
            }

            const { data: profileData, error: profileError } = await window.supabaseClient
                .from('users')
                .select('id, username, email, role')
                .eq('email', email)
                .limit(1)
                .maybeSingle();

            if (profileError || profileData?.role !== 'admin') {
                await window.supabaseClient.auth.signOut();
                errorMessage.textContent = 'Admin access required.';
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

        const forgotPasswordBtn = document.getElementById('forgot-password');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', async (event) => {
                event.preventDefault();

                const email = document.getElementById('email').value.trim().toLowerCase();

                if (!email) {
                    errorMessage.textContent = 'Enter the admin email before requesting a password reset.';
                    errorMessage.style.display = 'block';
                    return;
                }

                const redirectBase = window.location.hostname === 'localhost'
                    ? PRODUCTION_SITE_URL
                    : window.location.origin;

                const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: `${redirectBase}/login.html`,
                });

                if (error) {
                    errorMessage.textContent = error.message || 'Reset request failed. Please try again.';
                    errorMessage.style.display = 'block';
                    return;
                }

                errorMessage.textContent = 'Password reset email sent. Check your inbox.';
                errorMessage.style.color = '#14532d';
                errorMessage.style.display = 'block';
            });
        }
    }

    function setupResetForm() {
        if (!resetForm || !resetMessage) return;

        const newPassword = document.getElementById('new-password');
        const confirmPassword = document.getElementById('confirm-password');
        const showResetBtn = document.getElementById('show-reset');

        if (showResetBtn && newPassword) {
            showResetBtn.addEventListener('click', () => {
                showResetBtn.classList.toggle('fa-eye');
                showResetBtn.classList.toggle('fa-eye-slash');
                newPassword.type = newPassword.type === 'password' ? 'text' : 'password';
            });
        }

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPwd = newPassword.value;
            const confirmPwd = confirmPassword.value;

            if (newPwd !== confirmPwd) {
                resetMessage.textContent = 'Passwords do not match.';
                resetMessage.style.color = '#b42318';
                resetMessage.style.display = 'block';
                return;
            }

            const passwordStrengthError = validatePasswordStrength(newPwd);
            if (passwordStrengthError) {
                resetMessage.textContent = passwordStrengthError;
                resetMessage.style.color = '#b42318';
                resetMessage.style.display = 'block';
                return;
            }

            const { error } = await window.supabaseClient.auth.updateUser({
                password: newPwd
            });

            if (error) {
                resetMessage.textContent = error.message || 'Failed to update password.';
                resetMessage.style.color = '#b42318';
                resetMessage.style.display = 'block';
                return;
            }

            resetMessage.textContent = 'Password updated successfully! Redirecting to login...';
            resetMessage.style.color = '#14532d';
            resetMessage.style.display = 'block';

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }
});

