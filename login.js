document.addEventListener('DOMContentLoaded', () => {
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

    async function getAdminProfile(identifier) {
        const client = window.supabaseClient;
        const isEmail = identifier.includes('@');
        const field = isEmail ? 'email' : 'username';
        const value = isEmail ? identifier.toLowerCase() : identifier;

        const { data, error } = await client
            .from('users')
            .select('id, username, email, role')
            .eq(field, value)
            .limit(1)
            .maybeSingle();

        return { data, error };
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

            const username = document.getElementById('username').value.trim();
            const passwordValue = password.value;
            const { data: adminProfile, error: profileError } = await getAdminProfile(username);

            if (profileError) {
                errorMessage.textContent = 'Username lookup failed. Check your Supabase users table policy.';
                errorMessage.style.display = 'block';
                return;
            }

            if (!adminProfile?.email) {
                errorMessage.textContent = 'User not found or email is missing for this username.';
                errorMessage.style.display = 'block';
                return;
            }

            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: adminProfile.email,
                password: passwordValue
            });

            if (signInError) {
                errorMessage.textContent = signInError.message || 'Invalid credentials. Please try again.';
                errorMessage.style.display = 'block';
                return;
            }

            if (adminProfile.role !== 'admin') {
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

                const username = document.getElementById('username').value.trim();
                const { data: adminProfile, error: profileError } = await getAdminProfile(username);

                if (profileError || !adminProfile?.email) {
                    errorMessage.textContent = 'Enter a valid registered username or email before resetting password.';
                    errorMessage.style.display = 'block';
                    return;
                }

                const { error } = await window.supabaseClient.auth.resetPasswordForEmail(adminProfile.email, {
                    redirectTo: window.location.origin + '/login.html',
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

            if (newPwd.length < 6) {
                resetMessage.textContent = 'Password must be at least 6 characters.';
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
