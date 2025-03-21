// socketHandler.js:

const axios = require('axios'); // Zum Abrufen von Fragen von der API


let questions = [];
let playerAnswers = {};


module.exports = function(io) {
    let lobbies = {};  // Speichert die Lobbys und deren Status

    // Verbindung zum Client
    io.on('connection', (socket) => {
        console.log('Ein Benutzer hat sich verbunden:', socket.id);


        // Beitritt zur Lobby
        socket.on('joinLobby', ({ name, lobbyId }) => {
            if (!name || !lobbyId) {
                io.to(socket.id).emit('errorMessage', 'Name und Lobby-ID dürfen nicht leer sein.');
                return; // Beenden, wenn die Eingaben ungültig sind
            }
            if (!lobbies[lobbyId]) {
                lobbies[lobbyId] = { players: [], creator: null, gameActive: false };
            }
 
            if (lobbies[lobbyId].gameActive === true) {
              console.log(`Spiel läuft bereits in Lobby ${lobbyId}, Beitritt für ${name} verweigert.`);
              io.to(socket.id).emit('errorMessage', 'Diese Lobby ist bereits im Spiel und kann nicht beigetreten werden.');
              return;
          }


            const player = { id: socket.id, name, isCreator: false };
            lobbies[lobbyId].players.push(player);

            if (!lobbies[lobbyId].creator) {
                lobbies[lobbyId].creator = socket.id;
                player.isCreator = true;
            }
            socket.join(lobbyId);
            io.to(lobbyId).emit('updatePlayers', lobbies[lobbyId].players);
            io.to(socket.id).emit('isCreator', player.isCreator);
        });


        // Lobby verlassen
        socket.on("exitLobby", ({ lobbyId }) => {
            if (lobbies[lobbyId]) {
              const isCreatorLeaving = lobbies[lobbyId].creator === socket.id; // Prüfen, ob der Creator die Lobby verlässt
          
              // Spieler aus der Lobby entfernen
              lobbies[lobbyId].players = lobbies[lobbyId].players.filter(player => player.id !== socket.id);
          
              // Wenn keine Spieler mehr in der Lobby sind, lösche die Lobby
              if (lobbies[lobbyId].players.length === 0) {
                delete lobbies[lobbyId];
              } else {
                // Wenn der Creator die Lobby verlässt, sende eine Nachricht an alle anderen Spieler
                if (isCreatorLeaving) {
                  io.to(lobbyId).emit("creatorLeft", { message: "Die Lobby existiert nicht mehr, der Ersteller hat die Lobby verlassen." });
                }
          
                // Sende das Event an die verbleibenden Spieler, damit sie die Liste aktualisieren
                io.to(lobbyId).emit("playerLeft", socket.id);
              }
            }
          });

          


        // Wenn das Spiel gestartet wird
          socket.on('startGame', async ({ lobbyId, token, selectedCategory }) => {

          console.log("GESENDETE KATEGORIE:", selectedCategory);
              if (lobbies[lobbyId] && lobbies[lobbyId].creator === socket.id) {
                  try {


                  if (!token) {
                  throw new Error('Token fehlt');
                  }

                      // Fragen aus der API abrufen
                      const response = await axios.get(`http://localhost:5001/api/quiz/multi-questions?category=${selectedCategory}`, {
                          headers: {
                              'Authorization': `Bearer ${token}`  // Falls ein JWT benötigt wird
                          }
                      });
                      questions = response.data;  // Die Fragen aus der Antwort
                      lobbies[lobbyId].gameActive = true;

                      function getRandomQuestions(data, count = 5) {
                        return data.sort(() => Math.random() - 0.5).slice(0, count);
                      }

                      questions = getRandomQuestions(questions, 5);
          
                      // Alle Spieler in der Lobby über die Fragen benachrichtigen
                      io.to(lobbyId).emit('quizData', questions); // Sende die Fragen an alle
                      io.to(lobbyId).emit('startGame', questions); // Startet das Quiz bei allen Spielern
          
                  } catch (error) {
                      console.error('Fehler beim Abrufen der Fragen:', error.response ? error.response.data : error.message);
                      io.to(lobbyId).emit('error', { message: 'Fehler beim Laden der Fragen.', details: error.response ? error.response.data : error.message });
                  }
              }
          });

        socket.on("nextQuestion", (data) => {
            const { lobbyId, currentIndex } = data;

             // Sicherstellen, dass die Lobby existiert und der Absender der Creator ist
    if (!lobbies[lobbyId] || lobbies[lobbyId].creator !== socket.id) {
        console.log(`Unauthorized attempt to change question by ${socket.id}`);
        return; // Blockiere den unautorisierten Aufruf
    }

            console.log("Server received nextQuestion with index:", currentIndex);
            
            const nextQuestion = questions[currentIndex];
            if (nextQuestion) {
              console.log("Sending next question to all players.");
              io.to(lobbyId).emit("updateQuestion", nextQuestion);
              io.to(lobbyId).emit("clearResults");
              io.to(lobbyId).emit("showOptionsBox");
            }
          });

          
            socket.on("endQuiz", ({ lobbyId }) => {

                if (!lobbies[lobbyId] || lobbies[lobbyId].creator !== socket.id) {
                    console.log(`Unauthorized attempt to end quiz by ${socket.id}`);
                    return;
                }

              console.log(`Quiz in Lobby ${lobbyId} beendet.`);
              io.to(lobbyId).emit("clearResults");
              io.to(lobbyId).emit("quizEnded");
              lobbies[lobbyId].gameActive = false;
            });
          


        // Trennung des Clients
        socket.on('disconnect', () => {
            for (const lobbyId in lobbies) {
                lobbies[lobbyId].players = lobbies[lobbyId].players.filter(player => player.id !== socket.id);
                if (lobbies[lobbyId].players.length === 0) {
                    delete lobbies[lobbyId]; // Wenn keine Spieler mehr da sind, Lobby löschen
                }
            }
            console.log('Benutzer getrennt:', socket.id);
        });



         

         // Wenn ein Spieler seine Antwort sendet
         socket.on("playerAnswer", (data) => {
           const { lobbyId, playerName, questionIndex, selectedAnswers, unselectedAnswers } = data;
         
           if (!playerAnswers[lobbyId]) {
             playerAnswers[lobbyId] = {}; // Initialisiere die Lobby, falls noch nicht geschehen
           }
         
           playerAnswers[lobbyId][playerName] = { selectedAnswers, unselectedAnswers }; // Speichert die Antwort des Spielers
         
           // Logge die Antworten des Spielers und die Lobby-Details
           console.log(`Antwort von Spieler ${playerName} in Lobby ${lobbyId}:`, selectedAnswers);
           console.log(`Gesammelte Antworten für Lobby ${lobbyId}:`, playerAnswers[lobbyId]);
         });
         




         // Wenn der "Check"-Button geklickt wird und die Auswertung erforderlich ist
         socket.on("evaluateAnswers", (data) => {
           const { lobbyId, questionIndex } = data;
         
          /* if (!playerAnswers[lobbyId]) {
             console.log(`Keine Antworten für Lobby ${lobbyId} vorhanden.`);
             return;
           }*/
         
           const answers = playerAnswers[lobbyId];
           
           console.log(`Alle gesammelten Antworten für Lobby ${lobbyId}:`, answers);
           io.to(lobbyId).emit("allAnswers", { answers });
         
           let answerCounts = {};
           let unselectedCounts = {}; 
         
           for (let player in answers) {
             const { selectedAnswers, unselectedAnswers } = answers[player];
             selectedAnswers.forEach(answer => {
               answerCounts[answer] = (answerCounts[answer] || 0) + 1;
             });

             unselectedAnswers.forEach(answer => {
              unselectedCounts[answer] = (unselectedCounts[answer] || 0) + 1;
            });
             }




         

           console.log(`Antworthäufigkeiten für Lobby ${lobbyId}:`, answerCounts);

           io.to(lobbyId).emit("answerEvaluation", { answerCounts, unselectedCounts });


         
           playerAnswers[lobbyId] = {}; 
           console.log(`Antworten für Lobby ${lobbyId} wurden zurückgesetzt.`);
         




           
         });
         
        
        

        












        




    });
};
