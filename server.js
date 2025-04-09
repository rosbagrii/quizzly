require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const initializeSocket = require('./socketHandler');

// Datenbankverbindung herstellen
connectDB().then(() => {
    console.log('Datenbank verbunden');
}).catch((err) => {
    console.error('Fehler bei der Verbindung zur Datenbank:', err);
    process.exit(1); // Beendet den Server bei Verbindungsfehler
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialisiere die Socket-Verbindung
initializeSocket(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // JSON-Größe auf 10MB beschränken
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Routen

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'startseite.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'aboutUs.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'datenschutz.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'cookies.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'impressum.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'faqs.html'));
  });


app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);



// Fehlerbehandlungs-Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    next(err);
});

// Server starten
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
