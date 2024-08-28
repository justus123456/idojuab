const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const storageFile = path.join(__dirname, 'storage.json');

let data = { prices: [], messages: [], users: [] };

const loadData = () => {
    if (fs.existsSync(storageFile)) {
        try {
            const rawData = fs.readFileSync(storageFile, 'utf8');
            if (rawData.length > 0) {
                data = JSON.parse(rawData);
            }
        } catch (err) {
            console.error("Failed to parse JSON data:", err);
        }
    }
};

const saveData = () => {
    try {
        fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Failed to save JSON data:", err);
    }
};

const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    return bcrypt.hash(password, saltRounds);
};

const checkPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
