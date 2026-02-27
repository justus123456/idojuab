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

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
export default supabase;