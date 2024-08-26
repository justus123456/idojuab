import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from a .env file

const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default to 3000

app.use(cors());
app.use(express.json());

// In-memory storage (temporary, replace with a database in production)
let prices = [];
let messages = [];
let users = [];

// Utility function to hash passwords
const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10; // Use environment variable for salt rounds
    return bcrypt.hash(password, saltRounds);
};

// Utility function to check password
const checkPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await hashPassword(password);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
});

// User login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (user && await checkPassword(password, user.password)) {
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Set user (manually for testing)
app.post('/set-user', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await hashPassword(password);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User set successfully' });
});

// Get prices
app.get('/prices', (req, res) => {
    const { gender } = req.query;
    if (gender) {
        return res.json(prices.filter(price => price.gender === gender));
    }
    res.json(prices);
});

// Add price
app.post('/prices', (req, res) => {
    const price = req.body;
    price.id = prices.length ? prices[prices.length - 1].id + 1 : 1;
    prices.push(price);
    res.json(price);
});

// Delete price by ID or by gender
app.delete('/prices/:id', (req, res) => {
    const id = parseInt(req.params.id);
    prices = prices.filter(price => price.id !== id);
    res.json(prices);
});

// Handle clearing prices by gender
app.delete('/prices', (req, res) => {
    const { gender } = req.query;
    if (gender) {
        prices = prices.filter(price => price.gender !== gender);
        return res.json(prices);
    }
    res.status(400).json({ error: 'Gender parameter is required for clearing prices.' });
});

// Get messages
app.get('/messages', (req, res) => {
    res.json(messages);
});

// Add message
app.post('/messages', (req, res) => {
    const message = req.body;
    message.id = messages.length ? messages[messages.length - 1].id + 1 : 1;
    messages.push(message);
    res.json(message);
});

// Delete message by ID
app.delete('/messages/:id', (req, res) => {
    const id = parseInt(req.params.id);
    messages = messages.filter(message => message.id !== id);
    res.json(messages);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
