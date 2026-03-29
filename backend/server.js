const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to accept JSON data
app.use('/uploads', express.static('uploads')); // Makes the image folder public
const boardingRoutes = require('./routes/boardingRoutes');
app.use('/api/boardings', boardingRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.log('Database Connection Failed:', err));

// Basic test route
app.get('/', (req, res) => {
    res.send('Boarding Module API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));