// Shared Supabase client for browser scripts
// (In browser, process.env is not available, so we hardcode client-safe values here.)

const SUPABASE_URL = 'https://wkknfeknvunhugrabvpl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KthcrJ7DN8r8dLIMugqE7w_m6W-H6G2';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase library failed to load. Please ensure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script> is present.');
    if (typeof window.document !== 'undefined') {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = 'Supabase library failed to load.';
            errorEl.style.display = 'block';
        }
    }
} else {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

