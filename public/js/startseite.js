const navbar = document.getElementById("navbar"); 
const content = document.getElementById("content");
const footer = document.getElementById("footer");  

//Input Feld anzeigen beim Klicken auf Login oder Register

const showInputField = function () {
  const buttons = document.querySelectorAll(".popup-toggle");
  const popups = document.querySelectorAll(".inputField");


  buttons.forEach(function (button) {
    button.addEventListener("click", function (e) {
      const targetPopup = e.target.getAttribute("data-target");

      if (
        localStorage.getItem("token") !== null &&
        targetPopup === "login-popup"
      ) {
        window.location.href = "/html/user-page.html";
        return;
      }

      // Alle Popups verstecken
      popups.forEach(function (popup) {
        popup.style.display = "none";
      });

      // Das richtige Popup anzeigen
      const popupToShow = document.getElementById(targetPopup);
      if (popupToShow) {
        popupToShow.style.display = "flex";
      }

      // Opacity des Hintergrunds ändern
      navbar.style.opacity = "50%";
      content.style.opacity = "50%";
      footer.style.opacity = "50%";

    });
  });
};
showInputField();

//Alle Popups schließen
const closeAllPopups = function () {
  const popups = document.querySelectorAll(".inputField");
  popups.forEach(function (popup) {
    popup.style.display = "none";
  });
  document.getElementById("registerForm").reset();
  document.getElementById("loginForm").reset();
  registerMessage.textContent = "";
  const messageBox = document.getElementById("login-message");
  messageBox.textContent = "";

};

// Frontend: Registrierung
const registerForm = document.getElementById("registerForm");
const registerMessage = document.createElement("p");
registerForm.appendChild(registerMessage);

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerMessage.textContent = "";
  registerMessage.style.color = "red";
  registerMessage.style.fontSize = "1vw";

  const nickname = document.getElementById("register-nickname").value;
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const subject = document.getElementById("register-subject").value;

  const subjectList = ["Informatik", "Biologie", "Physik", "Philosophie"];
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!passwordRegex.test(password)) {
    registerMessage.textContent = "Passwort muss min. 6 Zeichen, Groß-/Kleinschreibung & eine Zahl enthalten.";
    return;
  }
  
  if (!subjectList.includes(subject)) {
    registerMessage.textContent = "Ungültiges Fach. Erlaubt: Informatik, Biologie, Physik, Philosophie.";
    return;
  }

  try {
    const checkNickname = await fetch(`/api/auth/check-nickname?nickname=${nickname}`);
    const nicknameData = await checkNickname.json();
    if (!checkNickname.ok) {
      registerMessage.textContent = nicknameData.message;
      return;
    }
    
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, username, password, subject }),
    });

    const data = await response.json();
    if (response.ok) {
      registerMessage.style.color = "green";
      registerMessage.textContent = "Registrierung erfolgreich!";
      localStorage.setItem("token", data.token);
    } else {
      registerMessage.textContent = data.message;
    }
  } catch (error) {
    registerMessage.textContent = "Fehler bei der Registrierung.";
  }
});

// Frontend-Login-Funktion
const loginFunction = function () {
  const loginForm = document.getElementById("loginForm");
  const messageBox = document.createElement("p");
  messageBox.id = "login-message";
  messageBox.style.color = "red";
  messageBox.style.fontSize = "1vw";
  loginForm.appendChild(messageBox);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    messageBox.textContent = ""; // Zurücksetzen der Nachricht

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        messageBox.style.color = "green";
        messageBox.textContent = "Login erfolgreich!";
        localStorage.setItem("token", data.token);
        setTimeout(() => {
          window.location.href = "/html/user-page.html";
        }, 1000);
      } else {
        messageBox.style.color = "red";
        messageBox.textContent = data.message || "Login fehlgeschlagen!";
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      messageBox.style.color = "red";
      messageBox.textContent = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.";
    }
  });
};

loginFunction();

// Close Popup 
document.querySelectorAll('.x').forEach((e) => {
  e.addEventListener('click', (closebtn) => {
    closeAllPopups();
    navbar.style.opacity = "100%";
    content.style.opacity = "100%";
    footer.style.opacity = "100%";
  });
});
