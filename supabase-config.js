// Shared Supabase client for browser scripts
window.SUPABASE_URL = 'https://wkknfeknvunhugrabvpl.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_KthcrJ7DN8r8dLIMugqE7w_m6W-H6G2';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase library failed to load.');
} else {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
