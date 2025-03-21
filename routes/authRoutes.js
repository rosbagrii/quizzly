const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const path = require("path");
const router = express.Router(); // Erstelle den Router

//Registrierung & Nickname-Überprüfung
router.get("/check-nickname", async (req, res) => {
  const { nickname } = req.query;
  const existingUser = await User.findOne({ nickname });
  if (existingUser) {
    return res.status(400).json({ message: "Nickname ist bereits vergeben." });
  }
  res.json({ message: "Nickname ist verfügbar." });
});

router.post("/register", async (req, res) => {
  const { nickname, username, password, subject } = req.body;
  const subjectList = ["Informatik", "Biologie", "Physik", "Philosophie"];

  if (!subjectList.includes(subject)) {
    return res.status(400).json({ message: "Ungültiges Fach." });
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Passwort zu schwach." });
  }

  const existingUser = await User.findOne({ $or: [{ nickname }, { username }] });
  if (existingUser) {
    return res.status(400).json({ message: "Nickname oder Benutzername bereits vergeben." });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ nickname, username, password: hashedPassword, subject });
  await user.save();
  
  const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "User registered successfully", token });
});

// Login-Route im Backend
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (!user) {
    return res.status(400).json({ message: "Benutzer existiert nicht!" });
  }
  
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Falsches Passwort!" });
  }
  
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});


// Homepage
router.get("/startseite", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "/html/startseite.html")); // <--- korrekter Pfad
});

// Geschützte Route, um Benutzerdaten abzurufen
router.get("/profile", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("nickname score"); // Nur Name und Score abrufen
    res.json({ nickname: user.nickname, score: user.score });
  } catch (error) {
    console.error("Token ungültig:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Profilbild hochladen
router.post("/upload-profile-picture", async (req, res) => {
  console.log(
    "Request-Body-Größe:",
    JSON.stringify(req.body).length / 1024,
    "KB"
  );
  const authHeader = req.headers["authorization"];

  // Überprüfen, ob ein Token vorhanden ist
  if (!authHeader) {
    return res.status(401).json({ message: "Kein Token, Zugriff verweigert." });
  }

  const token = authHeader.split(" ")[1]; // Token extrahieren
  console.log("Authorization Header:", authHeader);
  console.log("Token:", token);

  try {
    // Token validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId; // Benutzer-ID aus dem Token holen

    const { profilePicture } = req.body; // Base64-Bilddaten

    if (!profilePicture) {
      console.error("Base64-Bild fehlt.");
      return res.status(400).json({ message: "Kein Bild hochgeladen." });
    }

    // Benutzer aus der Datenbank holen
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden." });
    }

    // Profilbild speichern
    user.profilePicture = profilePicture;
    await user.save();

    res.status(200).json({ message: "Profilbild erfolgreich hochgeladen." });
  } catch (error) {
    console.error(
      "Fehler beim Verarbeiten des Tokens oder beim Speichern:",
      error
    );
    res.status(401).json({ message: "Token ungültig oder Serverfehler." });
  }
});

// Profilbild abrufen
router.get("/get-profile-picture", async (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Kein Token, Zugriff verweigert." });
  }

  const token = authHeader.split(" ")[1]; // Token extrahieren

  try {
    // Token validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId; // Benutzer-ID aus dem Token holen

    // Benutzer aus der Datenbank holen
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden." });
    }

    // Profilbild zurückgeben
    res.status(200).json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error(
      "Fehler beim Verarbeiten des Tokens oder beim Abrufen des Profilbildes:",
      error
    );
    res.status(401).json({ message: "Token ungültig oder Serverfehler." });
  }
});

module.exports = router; // Exportiere den Router
