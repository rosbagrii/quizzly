document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  // Funktion zur Prüfung, ob Token abgelaufen ist
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));
      const expirationTime = decodedPayload.exp * 1000; // Sekunden in Millisekunden umwandeln
      const currentTime = Date.now();
      return expirationTime < currentTime;
    } catch (error) {
      console.error("Fehler beim Dekodieren des Tokens:", error);
      return true;
    }
  };

  // Token prüfen und ggf. zurück zur Startseite
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token"); // Sicherheitshalber Token löschen
    alert("Sie sind nicht eingeloggt oder Ihre Sitzung ist abgelaufen.");
    window.location.href = "/html/startseite.html"; // Weiterleitung zur Login-Seite
    return;
  }

  let currentIndex = 0;
  let questions = [];

  // Zufällige Auswahl von 5 Fragen
  function getRandomQuestions(data, count = 5) {
    return data.sort(() => Math.random() - 0.5).slice(0, count);
  }

  // Fragen abrufen und 5 zufällige Fragen anzeigen
  async function startQuiz() {
    try {
      const token = localStorage.getItem("token"); // Token aus LocalStorage holen
      const response = await fetch("/api/quiz/einzelspiel-questions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Token im Authorization Header
        }
      });
      if (!response.ok) throw new Error(`Fehler: ${response.statusText}`);

      const data = await response.json();
      questions = getRandomQuestions(data, 5); // Zufällig 5 Fragen auswählen
      displayQuestion();
    } catch (error) {
      console.error("Fehler beim Laden der Fragen:", error);
    }
  }

  // Frage anzeigen
  function displayQuestion() {
    const questionObj = questions[currentIndex];
    if (!questionObj) return endQuiz();

    document.getElementById("question").textContent = questionObj.question;

    const options = document.querySelectorAll(".options");
    const checkboxes = document.querySelectorAll(
      '#options-box input[type="checkbox"]'
    );

    options.forEach((el, i) => {
      const option = questionObj.options[i];
      if (option) {
        el.textContent = option.text;
        el.style.display = "";
        checkboxes[i].style.display = "";
        checkboxes[i].checked = false; // Checkbox zurücksetzen
      } else {
        el.style.display = "none";
        checkboxes[i].style.display = "none";
      }
    });
  }

  // Quiz beenden
  function endQuiz() {
    document.getElementById("question").textContent = "Quiz beendet!";
    document
      .querySelectorAll(".options")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll('#options-box input[type="checkbox"]')
      .forEach((el) => (el.style.display = "none"));
    document.getElementById("check").style.display = "none";
    document.getElementById("next").style.display = "none";
    document.getElementById("previous").style.display = "none";
    document.getElementById("repeat").style.display = "block";
  }

  // "Antwort prüfen"-Button
  document.getElementById("check").addEventListener("click", () => {
    const questionObj = questions[currentIndex];
    const checkboxes = document.querySelectorAll(
      '#options-box input[type="checkbox"]'
    );

    // Benutzerantworten sammeln
    const selectedAnswers = Array.from(checkboxes)
      .map((checkbox, i) => (checkbox.checked ? i : null))
      .filter((index) => index !== null);

    // Überprüfung der Antworten
    const correctAnswers = questionObj.options
      .map((option, index) => (option.isCorrect ? index : null))
      .filter((index) => index !== null);

    // Vergleich Benutzerantworten mit den richtigen Antworten
    const isCorrect =
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((index) => correctAnswers.includes(index));

    const antwortText = isCorrect
      ? "Richtig! Gut gemacht."
      : `Falsch! Richtige Antwort(en): ${correctAnswers
          .map((i) => questionObj.options[i].text)
          .join(", ")}`;

    document.getElementById("antwort").textContent = antwortText;
  });

  // "Weiter"-Button
  document.getElementById("next").addEventListener("click", () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      document.getElementById("antwort").textContent = ""; // Antworttext zurücksetzen
      displayQuestion();
      console.log(currentIndex);
      document.getElementById("previous").style.display = "inline";
    } else {
      endQuiz();
    }
  });

  // "Zurück"-Button
  document.getElementById("previous").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      document.getElementById("antwort").textContent = "";
      displayQuestion();
      console.log(currentIndex);
    }
    if (currentIndex === 0) {
      document.getElementById("previous").style.display = "none";
    }
  });

  // Quiz wiederholen
  document.getElementById("repeat").addEventListener("click", function () {
    location.reload();
  });

  // Quiz starten
  startQuiz();
});
