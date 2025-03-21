const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Question = require("../models/Question");
const router = express.Router(); // Erstelle den Router

// Fragen Absenden Route
router.post("/question", async (req, res) => {
  const { question, options, subject } = req.body;

  // Validierung der Eingaben
  if (!question || !subject || !Array.isArray(options) || options.length !== 3) {
    return res.status(400).json({
        error: "Alle Felder müssen ausgefüllt sein und genau 3 Optionen bereitgestellt werden.",
      });
  }

  const validOptions = options.every((opt) => typeof opt.text === "string" && typeof opt.isCorrect === "boolean");
  if (!validOptions) {
    return res.status(400).json({
        error:"Optionen müssen gültige Texte und eine 'isCorrect'-Eigenschaft enthalten.",
      });
  }

  try {
    const newQuestion = new Question({question, options, category: subject,});

    const savedQuestion = await newQuestion.save();
    res.status(201).json({ message: "Frage erfolgreich gespeichert!", data: savedQuestion });
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});


// Route zu Einzelspiel Fragen
router.get("/einzelspiel-questions", async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Nicht autorisiert" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
    const userSubject = user.subject;
    const questions = await Question.find({ category: userSubject }).select("question options category");
    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "Keine Fragen für dieses Fach gefunden" });
    }
    res.json(questions);
  } catch (err) {
    console.error("Fehler beim Abrufen der Fragen:", err);
    res.status(500).json({ message: "Fehler beim Abrufen der Daten", error: err.message });
  }
});


// API-Endpunkt, um alle Fragen abzurufen
router.get('/all', async (req, res) => {
  try {
      const questions = await Question.find();
      res.json(questions);
  } catch (error) {
      res.status(500).json({ message: 'Fehler beim Abrufen der Fragen', error });
  }
});


// Route zum gemeinsamen Spielen



router.get("/multi-questions", async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Nicht autorisiert" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
    const selectedCategory = req.query.category; // Kategorie aus Query-Parameter
    const filter = selectedCategory ? { category: selectedCategory } : {};
    const questions = await Question.find(filter).select("question options category");
    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "Keine Fragen gefunden" });
    }
    res.json(questions);
  } catch (err) {
    console.error("Fehler beim Abrufen der Fragen:", err);
    res.status(500).json({ message: "Fehler beim Abrufen der Daten", error: err.message });
  }
});













module.exports = router; // Exportiere den Router
