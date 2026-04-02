import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from api folder first, then fall back to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiEnv = join(__dirname, '.env');
const rootEnv = join(__dirname, '..', '.env');

// Try API folder .env then root .env
if (!process.env.SUPABASE_URL) {
	dotenv.config({ path: apiEnv });
}
if (!process.env.SUPABASE_URL) {
	dotenv.config({ path: rootEnv });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side

// Validate Supabase configuration
if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_')) {
	const errorMsg = `
❌ SUPABASE CONFIGURATION ERROR ❌

Your Supabase service role key is missing or still a placeholder!

📝 TO FIX THIS:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the SERVICE_ROLE SECRET key (not the anon key)
5. Update your .env file:
   
   SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>

6. Restart the server

Current values in .env:
- SUPABASE_URL: ${supabaseUrl || 'NOT FOUND'}
- SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey || 'NOT FOUND'}
	`;
	console.error(errorMsg);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
export default supabase;