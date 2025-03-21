document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const navbar = document.getElementById("navbar");
  const content = document.getElementById("content");
  const footer = document.getElementById("footer");
  const addQuestionsBtn = document.getElementById("add-questions");
  const questionPopup = document.getElementById("question-popup");
  const close = document.getElementById("close");

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

  try {
    const response = await fetch("/api/auth/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      document.getElementById("username").textContent = data.nickname;
      document.getElementById("score").textContent = data.score;
    } else {
      alert("Fehler beim Abrufen der Benutzerdaten.");
      window.location.href = "/html/startseite.html";
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    window.location.href = "/html/startseite.html";
  }

  //Profilbild hinzufügen
  const fileInput = document.getElementById("file-input");
  const imagePreview = document.getElementById("image-preview");
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  // Funktion zum Abrufen des Profilbildes vom Server
  async function loadProfilePicture() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Nicht eingeloggt");
      return;
    }

    try {
      const response = await fetch("/api/auth/get-profile-picture", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profilePicture) {
          imagePreview.src = data.profilePicture; // Zeige das Bild in der Vorschau an
        } else {
          imagePreview.src = "/img/avatar.png"; // Fallback, wenn kein Bild vorhanden
        }
      } else {
        console.error("Fehler beim Abrufen des Profilbildes");
        imagePreview.src = "/img/avatar.png"; // Fallback
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Profilbildes:", error);
      imagePreview.src = "/img/avatar.png"; // Fallback
    }
  }

  // Lade das Profilbild beim Laden der Seite
  loadProfilePicture();

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      // Überprüfe, ob die Dateigröße das Limit überschreitet
      if (file.size > MAX_FILE_SIZE) {
        alert(
          "Die Datei ist zu groß. Bitte wählen Sie ein Bild, das kleiner als 5 MB ist."
        );
        return;
      }

      const readerForUpload = new FileReader();
      readerForUpload.onload = async (e) => {
        const base64Image = e.target.result;

        // Zeige das hochgeladene Bild in der Vorschau an
        imagePreview.src = base64Image;

        // Sende das Base64-Bild an den Server
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Nicht eingeloggt.");
          return;
        }

        try {
          const response = await fetch("/api/auth/upload-profile-picture", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ profilePicture: base64Image }),
          });

          if (response.ok) {
            const data = await response.json();
            alert("Profilbild erfolgreich hochgeladen!");
          } else {
            const errorData = await response.text(); // Antwort als Text einlesen
            console.error("Fehler:", errorData);
            if (errorData.includes("PayloadTooLargeError")) {
              alert(
                "Das Bild ist zu groß. Bitte wählen Sie ein kleineres Bild."
              );
            } else {
              alert(`Fehler: ${errorData}`);
            }
          }
        } catch (error) {
          console.error("Fehler beim Hochladen des Profilbilds:", error);
          alert("Fehler beim Hochladen des Bildes.");
        }
      };
      readerForUpload.readAsDataURL(file);
    }
  });

  const userLogout = function () {
    const logout = document.getElementById("logout");
    logout.addEventListener("click", function () {
      localStorage.removeItem("token");
      window.location.href = "/html/startseite.html";
    });
  };
  userLogout();

  //Fragen hinzufügen

  const submitQuestions = function () {
    const questionForm = document.getElementById("questionForm");
    questionForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = document.getElementById("question").value.trim();
      const option1 = document.getElementById("option1").value.trim();
      const option2 = document.getElementById("option2").value.trim();
      const option3 = document.getElementById("option3").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const correctOption = document.querySelector(
        'input[name="correctOption"]:checked'
      )?.value;


      const subjectList = ["Informatik", "Biologie", "Physik", "Philosophie"];
      
      if (!subjectList.includes(subject)) {
        alert("Ungültiges Fach. Erlaubt: Informatik, Biologie, Physik, Philosophie.");
        return;
      }

      questionForm.reset();
      // Eingaben validieren
      if (
        !question ||
        !option1 ||
        !option2 ||
        !option3 ||
        !subject ||
        correctOption === undefined
      ) {
        alert(
          "Bitte alle Felder ausfüllen und eine richtige Antwort auswählen."
        );
        return;
      }

      const options = [
        { text: option1, isCorrect: correctOption === "0" },
        { text: option2, isCorrect: correctOption === "1" },
        { text: option3, isCorrect: correctOption === "2" },
      ];

      try {
        const response = await fetch("/api/quiz/question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, options, subject }),
        });

        if (response.ok) {
          const data = await response.json();
          alert("Frage erfolgreich abgesendet!");
          console.log(data);
        } else {
          const errorData = await response.json();
          alert(
            `Fehler: ${
              errorData.error || "Daten konnten nicht gesendet werden."
            }`
          );
        }
      } catch (error) {
        console.error("Fehler beim Versenden von Daten:", error);
        alert("Ein unerwarteter Fehler ist aufgetreten.");
      }
    });
  };

  submitQuestions();

  const openQuestionForm = function () {
    questionPopup.style.display = "flex";
    navbar.style.opacity = "50%";
    content.style.opacity = "50%";
    footer.style.opacity = "50%";
  };
  addQuestionsBtn.addEventListener("click", openQuestionForm);



  const openLearnMode = function () {
    const learnModeBtn = document.getElementById("learn-mode");
    learnModeBtn.addEventListener("click", function () {
      window.open("/html/einzelspiel.html");
    });
  };
  openLearnMode();

  const openPvpMode = function () {
    const learnModeBtn = document.getElementById("together-mode");
    learnModeBtn.addEventListener("click", function () {
      window.open("/html/together-lobby.html");
    });
  };
  openPvpMode();


  const closeQuestionForm = function() {
    questionPopup.style.display = "none";
    navbar.style.opacity = "100%";
    content.style.opacity = "100%";
    footer.style.opacity = "100%";
    questionForm.reset();
  }

  close.addEventListener('click', closeQuestionForm);



});

