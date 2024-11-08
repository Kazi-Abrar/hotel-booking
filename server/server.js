const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const xml2js = require('xml2js'); // Import xml2js

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'application/xml' })); // Middleware to parse XML

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: 'magevini05', // replace with your MySQL password
    database: 'hotel_booking'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Handle reservation requests
app.post('/reserve', (req, res) => {
    const xml = req.body;

    // Parse XML
    xml2js.parseString(xml, (err, result) => {
        if (err) {
            return res.status(400).json({ error: 'Invalid XML' });
        }

        const name = result.ReservationRequest.User[0].Name[0];
        const email = result.ReservationRequest.User[0].Email[0];
        const roomType = result.ReservationRequest.Room[0].Type[0];
        const checkIn = result.ReservationRequest.Room[0].CheckInDate[0];
        const checkOut = result.ReservationRequest.Room[0].CheckOutDate[0];

        // Insert reservation into the database
        db.query('INSERT INTO reservations (guest_name, email, room_type, check_in, check_out) VALUES (?, ?, ?, ?, ?)',
            [name, email, roomType, checkIn, checkOut], (err, results) => {
                if (err) {
                    console.error('Error inserting reservation:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'Reservation successful', reservationId: results.insertId });
            });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:${PORT}');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.end((err) => {
        if (err) {
            console.error('Error closing the database connection:', err);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});