// migrate-to-supabase.js
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load .env from api folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');
dotenv.config({ path: envPath });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(url, key);

const data = JSON.parse(fs.readFileSync('./api/storage.json', 'utf8'));

async function migrate() {
  // migrate users
  for (const u of data.users || []) {
    await supabase.from('users').upsert({
      username: u.username,
      password_hash: u.password,
      role: 'admin',
      created_at: new Date()
    }, { onConflict: 'username' });
  }

  // fetch users map
  const { data: users } = await supabase.from('users').select('id,username');
  const userMap = {};
  users.forEach(row => userMap[row.username] = row.id);

  // migrate prices
  for (const p of data.prices || []) {
    await supabase.from('prices').insert({
      cloth_type: p.clothType,
      ironing_price: p.ironingPrice || 0,
      washing_price: p.washingPrice || 0,
      gender: p.gender,
      created_by: userMap['admin'] || null,
      created_at: new Date()
    });
  }

  // migrate messages
  for (const m of data.messages || []) {
    await supabase.from('messages').insert({
      name: m.name,
      email: m.email,
      message: m.message,
      status: m.status || 'new',
      created_at: new Date()
    });
  }

  console.log('Migration completed');
}
migrate().catch(console.error);