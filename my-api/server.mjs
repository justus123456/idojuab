import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Resolve the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const storageFile = join(__dirname, 'storage.json');

// Initialize data
let data = { prices: [], messages: [], users: [] };
app.post('/set-user', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await hashPassword(password);
    data.users.push({ username, password: hashedPassword });
    saveData();
    res.status(201).json({ message: 'User created successfully' });
});

// Load data from the file
const loadData = () => {
    if (fs.existsSync(storageFile)) {
        try {
            const rawData = fs.readFileSync(storageFile, 'utf8');
            if (rawData.length > 0) {
                data = JSON.parse(rawData);
                console.log("Data loaded from file:", data);
            }
        } catch (err) {
            console.error("Failed to parse JSON data:", err);
        }
    } else {
        console.log("No storage file found, using default empty data.");
    }
};

// Save data to the file
const saveData = () => {
    try {
        fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
        console.log("Data saved to file:", data);
    } catch (err) {
        console.error("Failed to save JSON data:", err);
    }
};

// Handle process termination signals to save data
const handleExit = (signal) => {
    console.log(`Received ${signal}. Saving data...`);
    saveData();
    process.exit(0);
};

// Listen for termination signals
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Load data when the server starts
loadData();

// Middleware
app.use(cors());
app.use(express.json());

// Example API endpoints
app.get('/prices', (req, res) => {
    const { gender } = req.query;
    if (gender) {
        return res.json(data.prices.filter(price => price.gender === gender));
    }
    res.json(data.prices);
});

app.post('/prices', (req, res) => {
    const price = req.body;
    price.id = data.prices.length ? data.prices[data.prices.length - 1].id + 1 : 1;
    data.prices.push(price);
    saveData();
    res.json(price);
});

app.delete('/prices/:id', (req, res) => {
    const id = parseInt(req.params.id);
    data.prices = data.prices.filter(price => price.id !== id);
    saveData();
    res.json(data.prices);
});

app.delete('/prices', (req, res) => {
    const { gender } = req.query;
    if (gender) {
        data.prices = data.prices.filter(price => price.gender !== gender);
        saveData();
        return res.json(data.prices);
    }
    res.status(400).json({ error: 'Gender parameter is required for clearing prices.' });
});

app.get('/messages', (req, res) => {
    res.json(data.messages);
});

app.post('/messages', (req, res) => {
    const message = req.body;
    message.id = data.messages.length ? data.messages[data.messages.length - 1].id + 1 : 1;
    data.messages.push(message);
    saveData();
    res.json(message);
});

app.delete('/messages/:id', (req, res) => {
    const id = parseInt(req.params.id);
    data.messages = data.messages.filter(message => message.id !== id);
    saveData();
    res.json(data.messages);
});

// User registration and login
const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    return bcrypt.hash(password, saltRounds);
};

const checkPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await hashPassword(password);
    data.users.push({ username, password: hashedPassword });
    saveData();
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = data.users.find(u => u.username === username);
    if (user && await checkPassword(password, user.password)) {
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
