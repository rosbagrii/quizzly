// together-lobby.js:

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


const socket = io();

function getValidInput(promptMessage) {
  let input;
  do {
    input = prompt(promptMessage);
    if (!input) {
      alert("Eingabe darf nicht leer sein. Bitte erneut versuchen.");
    }
  } while (!input);
  return input;
}


// Lobby-ID eingeben oder generieren
const lobbyId = getValidInput("Gib die Lobby-ID ein oder erzeuge eine neue:");
const playerName = getValidInput("Gib deinen Namen ein:");

if (!playerName || !lobbyId) {
  alert('Bitte geben Sie einen Namen und eine Lobby-ID ein.');
} else {
  socket.emit("joinLobby", { name: playerName, lobbyId });
}

socket.on('errorMessage', (message) => {
  alert(message);
  window.close();
});


const playersList = document.getElementById("players");
const startGameButton = document.getElementById("start-game");
const lobbyIdDisplay = document.getElementById("lobby-id");

// Lobby-ID anzeigen
lobbyIdDisplay.textContent = `Lobby-ID: ${lobbyId}`;

// Spieler zur Lobby hinzufügen
socket.on("updatePlayers", (players) => {
  playersList.innerHTML = ""; // Spieler-Liste leeren
  players.forEach((player) => {
    const li = document.createElement("li");
    li.setAttribute("data-id", player.id); // Spieler-ID hinzufügen
    li.textContent = player.name + (player.isCreator ? " (Ersteller)" : "");
    playersList.appendChild(li);
  });
});

// Wenn das Fenster geschlossen wird, den Spieler aus der Lobby entfernen
window.addEventListener("beforeunload", () => {
  socket.emit("exitLobby", { lobbyId });
});

// Spieler aus der Liste entfernen, wenn ein anderer Spieler die Lobby verlässt
socket.on("playerLeft", (playerId) => {
  const playerElement = document.querySelector(`li[data-id="${playerId}"]`);
  if (playerElement) {
    playerElement.remove(); // Entferne den Spieler aus der Liste
  }
});

// Wenn der Creator die Lobby verlässt, zeige eine Nachricht an
socket.on("creatorLeft", (data) => {
  alert(data.message);
 window.close();
});

// Nur der Ersteller darf das Spiel starten
socket.on("isCreator", (isCreator) => {
  startGameButton.disabled = !isCreator;
  navigationButtons.forEach((button) => {
    button.disabled = !isCreator;
    if (!isCreator) {
      button.style.visibility = "hidden";
    }
    
  });
});

// Spiel starten
startGameButton.addEventListener("click", () => {
  const token = localStorage.getItem("token");
  const selectedCategory = document.getElementById('dropdown').options[dropdown.selectedIndex].text;
  socket.emit("startGame", { lobbyId, token, selectedCategory }); // Sende das Token explizit an den Server
  navigationButtons.forEach(function(element) {
    element.style.display = "block";
  });
});


// Status der Lobby synchronisieren
socket.on("syncState", (state) => {
  console.log("Synchronisierter Zustand: ", state);
});


/*
// Weiterleitung zum Quiz-Spiel
socket.on("startGame", (quizData) => {
  document.getElementById('container').style.display = 'flex';
  startGameButton.classList.add('disabled');
  startGameButton.textContent = "Spiel läuft...";
});
*/

socket.on("startGame", (quizData) => {
  document.getElementById('container').style.display = 'flex';
  startGameButton.classList.add('disabled');
  document.getElementById('next').classList.add('disabled');
  startGameButton.textContent = "Spiel läuft...";
  document.querySelectorAll('.score').forEach(function(e) {
    e.remove();
  });

  // Optionselemente beim Start sichtbar machen
  const optionsBox = document.getElementById("options-box");
  if (optionsBox) {
    const children = Array.from(optionsBox.children);
    children.forEach((child) => {
      child.style.display = "flex";  // Zeigt alle Optionselemente wieder an
    });
  }
});




// Wenn Quiz-Daten empfangen werden
socket.on("quizData", (quizData) => {
});


// Fehlermeldungen anzeigen
socket.on("error", (error) => {
  console.error("Fehler:", error);
  alert(error.message || JSON.stringify(error));
});





// WENN DAS SPIEL GESTARTET WIRD

const navigationButtons = document.querySelectorAll(".navigation-buttons");

let currentIndex = 0;
    let questions = [];
    const label = ["A)", "B)", "C)"];
    let score = {};

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
  
    function endQuiz() {
      document.getElementById("question").textContent = "Quiz beendet!";
      document.querySelectorAll(".options").forEach((el) => (el.style.display = "none"));
      document
        .querySelectorAll('#options-box input[type="checkbox"]')
        .forEach((el) => (el.style.display = "none"));
      document.getElementById("check").style.display = "none";
      document.getElementById("next").style.display = "none";
      document.querySelectorAll(".result").forEach((element) => {
        element.remove(); // Entfernt die bisherigen Resultate aus dem DOM
      });
      document.querySelectorAll(".correct-answer").forEach((el) => {
        el.remove();
    });
    startGameButton.classList.remove("disabled");
    startGameButton.textContent = "Spiel starten";

    const checkboxes = document.querySelectorAll('#options-box input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.disabled = false;
    });

    const optionsBox = document.getElementById('options-box');
    Object.entries(score).forEach(([name, points]) => {
      const p = document.createElement("p");
      p.classList.add('score');
      p.textContent = `${name}: ${points}/${questions.length} richtig beantwortet`;
      optionsBox.appendChild(p);


    });

    score = {};

    document.querySelectorAll(".charts").forEach(function(chart) {
      chart.remove();
    });
    
    }
  

// Funktion, die beim Ändern einer Checkbox ausgeführt wird
function setupCheckboxAnswering() {
  const checkboxes = document.querySelectorAll('#options-box input[type="checkbox"]');

  // Funktion zum Senden der Antworten beim Ändern der Checkbox
  const sendAnswer = () => {
    const selectedAnswers = Array.from(checkboxes)
      .map((checkbox, i) => (checkbox.checked ? i : null))
      .filter((index) => index !== null);

      const unselectedAnswers = Array.from(checkboxes)
      .map((checkbox, i) => (!checkbox.checked ? i : null)) 
      .filter((index) => index !== null); 
      

    // **Jeder Spieler sendet seine Antwort**
    socket.emit("playerAnswer", {
      lobbyId,
      playerName,
      questionIndex: currentIndex,
      selectedAnswers,
      unselectedAnswers
    });
    console.log("Antwort gesendet:", selectedAnswers);
  };


    // Funktion zum Deaktivieren/Aktivieren der anderen Checkboxen
    const toggleCheckboxes = (selectedCheckbox) => {
      checkboxes.forEach((checkbox) => {
        if (checkbox !== selectedCheckbox) {
          checkbox.disabled = selectedCheckbox.checked; // Alle anderen deaktivieren, wenn eins ausgewählt wurde
        }
      });
    };

      // Event-Listener für jede Checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      sendAnswer();
      toggleCheckboxes(event.target);
    });
  });
}


/*
  // Event-Listener für jede Checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", sendAnswer);
  });
}
*/


// Aufruf der Funktion, um das Setup zu starten
setupCheckboxAnswering();







// Event-Listener für den "CHECK"-Button
document.getElementById("check").addEventListener("click", () => {
  socket.emit("evaluateAnswers", {
    lobbyId,
    questionIndex: currentIndex
  });
document.getElementById('next').classList.remove('disabled');    
});

socket.on("answerEvaluation", ( { answerCounts, unselectedCounts } ) => {
  console.log("Antwort-Auswertung:", answerCounts);
  const optionsBox = document.getElementById("options-box");

  if (optionsBox) {
    const children = Array.from(optionsBox.children);
    children.forEach((child) => {
      child.style.display = "none";
    });

     // Annahme: Die Reihenfolge der Optionen ist in `questions[currentIndex].options`
     const options = questions[currentIndex].options;

     const totalCount = Object.values(answerCounts).reduce((sum, count) => sum + count, 0);
     // Anzeigen der ausgewählten Antworten in der Reihenfolge der Optionen
     options.forEach((option, index) => {
       const selectedCount = answerCounts[index] || 0; // Standardwert 0, wenn keine Antwort für diese Option vorliegt
       const percentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
       const resultText = `${label[index]}: ${selectedCount} mal`;
 
       const paragraph = document.createElement("p");
       paragraph.classList.add("result");
       paragraph.textContent = resultText;
       paragraph.style.position = "absolute";
       //optionsBox.appendChild(paragraph);


       const chartBox = document.createElement('div');
       chartBox.classList.add("charts");
       chartBox.style.height = "7%";
       chartBox.style.width = "70%";
       chartBox.style.backgroundColor = "rgb(209, 210, 195)";
       chartBox.style.display = "flex";
       chartBox.style.alignItems = "center";
       optionsBox.appendChild(chartBox);

       const paragraphBox = document.createElement('div');
       paragraphBox.style.height = "100%";
       paragraphBox.style.width = "30%";
       paragraphBox.style.display = "flex";
       paragraphBox.style.alignItems = "center";
       paragraphBox.appendChild(paragraph);
       chartBox.appendChild(paragraphBox);

       const chartLine = document.createElement('div');
       chartLine.style.height = "100%";
       chartLine.style.width = `${percentage}%`;
       chartLine.style.backgroundColor = "lightBlue";
       chartLine.style.display = "flex";
       chartLine.style.alignItems = "center";
       chartLine.style.justifyContent = "center";
       chartBox.appendChild(chartLine);

       const perc = document.createElement('p');
       perc.textContent = `${percentage}%`;
       chartLine.appendChild(perc);
       perc.style.position = "absolute";

     });

        const correctIndex = questions[currentIndex].options.findIndex(option => option.isCorrect);
        const correctAnswers = questions[currentIndex].options
        .filter((option) => option.isCorrect)
        .map((option) => option.text);
      const correctAnswerText = `Richtige Antwort: ${label[correctIndex]} ${correctAnswers.join(", ")}`;
      const correctAnswerParagraph = document.createElement("p");
      correctAnswerParagraph.classList.add("correct-answer");
      correctAnswerParagraph.textContent = correctAnswerText;
      optionsBox.appendChild(correctAnswerParagraph);

  } else {
    console.error("Das Element mit der ID 'option-box' wurde nicht gefunden.");
  }

  document.getElementById('check').disabled = "true";

});









socket.on("clearResults", () => {
  console.log("Ergebnisse werden zurückgesetzt.");
  document.querySelectorAll(".result").forEach((element) => {
    element.remove(); // Entfernt die bisherigen Resultate aus dem DOM
  });
});






socket.on("quizEnded", () => {
  endQuiz();
});
  
    document.getElementById("next").addEventListener("click", () => {
      document.getElementById('next').classList.add('disabled');
      currentIndex++;
      document.querySelectorAll(".result").forEach((element) => {
        element.style.setProperty("display", "none", "important");
      });
      console.log("Sending nextQuestion with index: ", currentIndex);
      if (currentIndex < questions.length) {
        
        socket.emit("nextQuestion", { lobbyId, currentIndex });

      } else {
        socket.emit("endQuiz", { lobbyId });
      }
      document.getElementById('check').disabled = false;
    });

    socket.on("showOptionsBox", () => {
      const optionsBox = document.getElementById("options-box");
      if (optionsBox) {
          const children = Array.from(optionsBox.children);
          children.forEach((child) => {
              child.style.display = "flex";
          });
      }

            // Alle Checkboxen wieder aktivieren
    const checkboxes = optionsBox.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.disabled = false; // Alle Checkboxen aktivieren
      checkbox.checked = false;  // Optional: Setzt alle zurück auf "nicht ausgewählt"
    });

      const correctAnswer = document.querySelector(".correct-answer");
      if (correctAnswer) {
      correctAnswer.remove();
    }

    document.querySelectorAll(".charts").forEach(function(chart) {
      chart.remove();
    });

  });
  
    
    
    socket.on("updateQuestion", (nextQuestion) => {
      questions[currentIndex] = nextQuestion; // Update die Fragenliste
      displayQuestion(); // Zeige die neue Frage an
    });

    /*
    const selectedCategory = document.getElementById('dropdown').options[dropdown.selectedIndex].text;
    fetch(`/api/quiz/multi-questions"?category=${selectedCategory}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        questions = data;
        socket.emit("joinQuiz", { lobbyId, playerName, questions, selectedCategory });
      })
      .catch((err) => {
        console.error("Fehler beim Abrufen der Fragen:", err);
        alert("Fehler beim Abrufen der Quizfragen.");
      });
      */
  
    socket.on("quizData", (quizData) => {
      console.log("Empfangene Fragen:", quizData);
      questions = quizData;
      currentIndex = 0;
      displayQuestion();
   
    });


    socket.on("allAnswers", (playerAnswers) => {
      console.log("Event allAnswers received:", playerAnswers.answers);
    

      let result = {};

      Object.keys(playerAnswers.answers).forEach(key => {
        result[key] = playerAnswers.answers[key].selectedAnswers;
      });
      
      console.log(result);


      for (let user in result) {
        // Prüfen, ob die Option des jeweiligen Nutzers korrekt ist
        if (questions[currentIndex].options[result[user][0]]?.isCorrect) {
          console.log(`${user} hat 1 Punkt`);
      
          // Punktestand im score-Objekt hinzufügen
          if (score[user]) {
            score[user] += 1;  // Falls der Nutzer bereits Punkte hat, 1 Punkt hinzufügen
          } else {
            score[user] = 1;   // Falls der Nutzer noch keine Punkte hat, 1 Punkt setzen
          }
        }
      }
      
      // Ausgabe des aktuellen Punktestands
      console.log(score);






    });
    



});