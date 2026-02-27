// Shared Supabase client for browser scripts
window.SUPABASE_URL = 'https://wkknfeknvunhugrabvpl.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra25mZWtudnVuaHVncmFidnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODQwMTcsImV4cCI6MjA4NzM2MDAxN30.Nu4TAuUW_jAGVS3u7ICbrF7e2O8Ba-BMerKbMCNOG7A';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase library failed to load.');
} else {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
