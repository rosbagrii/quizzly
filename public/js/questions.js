



async function fetchQuestions() {
    try {
        const response = await fetch('/api/quiz/all');
        const questions = await response.json();
        const questionList = document.getElementById('questionList');

        questions.forEach(q => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${q.question}</strong> <br> <em>Kategorie:</em> ${q.category}`;
            questionList.appendChild(li);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Fragen:', error);
    }
}

fetchQuestions();