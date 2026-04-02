import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputFile = join(rootDir, 'signup-config.js');

const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || '';

const fileContents = `// Generated at build time for static hosting.
// Warning: this value is public in the browser bundle.
window.ADMIN_SIGNUP_CODE = ${JSON.stringify(adminSignupCode)};
`;

writeFileSync(outputFile, fileContents, 'utf8');
console.log(`Generated ${outputFile}`);
