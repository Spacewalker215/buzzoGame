let correct = 0;
let numberOfQuestionsComplete = 0;
let playing = true
let soundOn = false
let hidden = false
let gameDif = ""

// Choosing the color of the background
const highlightColorPicker = document.querySelector(".colorPicker");
const background = document.querySelector(".container");

highlightColorPicker.oninput = () => {
    background.style.backgroundColor = highlightColorPicker.value
}

// Import the string-similarity library
if('speechSynthesis' in window){
    const synth = window.speechSynthesis
    document.addEventListener('DOMContentLoaded', function () {
        const textField = document.querySelector('#text');
        textField.style.opacity = 100;

        textField.innerHTML = "Welcome to Buzzo, a certamen bot which will develope your skills. To get started please click the gear and select the difficulty of the questions."
        
        document.querySelector('#difficulty').oninput = () => {
            document.querySelector('#difficultyValue').textContent = document.querySelector('#difficulty').value;
            const selectedDifficulty = document.querySelector('#difficulty').value;
            const spreadsheetPath = getSpreadsheetPath(selectedDifficulty);
    
            fetch(spreadsheetPath)
                .then(response => response.arrayBuffer())
                .then(data => {
                    const { questions, answers } = parseSpreadsheetData(data);
                    animateTextWithRandomQuestions(questions, answers);
                })
                .catch(error => console.error('Error fetching spreadsheet data:', error));
        }

        function getSpreadsheetPath(difficulty) {
            switch (difficulty) {
                case 'Novice':
                    return 'noviceCertamen.xlsx';
                case 'Intermediate':
                    return 'intermediateCertamen.xlsx';
                case 'Advanced':
                    return 'advancedCertamen.xlsx';
                default:
                    return '';
            }
        }

        function parseSpreadsheetData(data) {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
            const questions = [];
            const answers = [];
    
            for (let i = 2; ; i++) {
                const questionCell = sheet['A' + i];
                const answerCell = sheet['B' + i];
    
                if (!questionCell || !answerCell) {
                    break;
                }
    
                questions.push(questionCell.v.toString().trim());
                answers.push(answerCell.v.toString().trim());
            }
            return { questions, answers };
        }

        function animateTextWithRandomQuestions(questions, answers) {
            const textContainer = document.querySelector('.text-container');
            const inputField = document.querySelector('.answerfield input');
            const responseText = document.querySelector('.response-label');
            const questionInfo = document.querySelector('.questionInfo');
            const answerInfo = document.querySelector('.answerInfo');
            
            synth.cancel()

            inputField.style.display = 'none';
            responseText.style.display = 'none';

            const SPEED = 300; // Adjust as needed for displaying words
            const speakingSPEED = 0.2 + 0.6 * (1 - SPEED / 1000); // Adjust as needed for speaking rate
            const DELAY_BEFORE_NEXT_QUESTION = 1000; // Adjust this value as needed

            // let shuffledIndexes = shuffle(Array.from({ length: questions.length }, (_, i) => i));
            // Just the orginal array
            let ogIndexes = Array.from({ length: questions.length }, (_, i) => i)
            let currentIndex = 0;

            displayNextQuestion();

            document.addEventListener('keydown', function startAnimation(event) {
                if (event.key === ' ' && ogIndexes.length > 0 && playing) {
                    inputField.style.display = 'block';
                    inputField.style.backgroundColor = '';
                    responseText.style.display = 'block';
                    answerInfo.style.display = 'block';
                    questionInfo.style.display = 'none'
                    textContainer.style.display = 'none';
                    synth.cancel()
                }
            });

            function displayNextQuestion() {
                setTimeout(() => {
                    const index = ogIndexes[currentIndex];
                    const words = questions[index].split(/\s+/);
                    //Resetting the values to their orginal
                    textContainer.innerHTML = '';
                    inputField.style.backgroundColor = '';
                    inputField.value = '';
                    inputField.disabled = false
                    responseText.textContent = 'Response: ';

                    textContainer.style.display = 'block';
                    inputField.style.display = 'none';
                    responseText.style.display = 'none';
                    answerInfo.style.display = 'none';
                    questionInfo.style.display = 'block';

                    numberOfQuestionsComplete ++;

                    displayWords(words, index);
                    if(soundOn){
                        const utterThis = new SpeechSynthesisUtterance(words)
                        utterThis.rate = speakingSPEED
                        synth.speak(utterThis)
                    }
                }, DELAY_BEFORE_NEXT_QUESTION);
            }

            function displayWords(words, index) {
                for (let k = 0; k < words.length; k++) {
                    const span = document.createElement('span');
                    span.textContent = words[k];
                    span.classList.add('word');
                    textContainer.appendChild(span);

                    if (k < words.length - 1) {
                        const space = document.createTextNode(' ');
                        textContainer.appendChild(space);
                    }

                    setTimeout(function () {
                        document.querySelectorAll('.text-container .word').forEach(function (wordSpan) {
                            wordSpan.classList.remove('highlight');
                        });

                        span.style.opacity = 1;
                        span.classList.add('highlight');

                        if (k === words.length - 1) {
                            setTimeout(function () {
                                handleAnswer(index);
                            }, (k + 2) * SPEED);
                        }
                    }, (k + 1) * SPEED);
                }
            }

            function handleAnswer(index) {
                const correctAnswer = answers[index].toLowerCase();

                document.addEventListener('keydown', checkResponse);


            function checkResponse(event) {
                if (event.key === 'Enter') {
                    const userResponse = inputField.value.toLowerCase();

                    // Calculate the similarity between userResponse and correctAnswer
                    const similarity = stringSimilarity.compareTwoStrings(userResponse, correctAnswer);

                    // Set a threshold for similarity (e.g., 60%)
                    const isCorrect = similarity >= 0.6;

                    inputField.disabled = true;

                    inputField.style.backgroundColor = isCorrect ? 'limegreen' : 'tomato';
                    responseText.textContent = isCorrect ? 'Correct!' : 'Incorrect!';

                    if (!isCorrect) {
                        setTimeout(function () {
                            inputField.style.display = 'none';
                            responseText.textContent = correctAnswer;
                        }, 2000);
                    } else {
                        correct++;
                    }

                    // Remove the event listener after use
                    document.removeEventListener('keydown', checkResponse);

                    // Move to the next question
                    currentIndex = (currentIndex + 1) % ogIndexes.length;
                    document.addEventListener('keydown', function nextQ(event) {
                        if (event.key == ' ') displayNextQuestion();
                        document.removeEventListener('keydown', nextQ);
                    });
                }
            }

            }
            
            //Shuffling
            /*function shuffle(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }*/
        }
    });
    function finishGame(){
        synth.cancel()
        playing = false
        const textContainer = document.querySelector('.text-container');
        const inputField = document.querySelector('.answerfield input');
        const responseText = document.querySelector('.response-label');
        const questionInfo = document.querySelector('.questionInfo');
        const answerInfo = document.querySelector('.answerInfo');
        const correctness = document.querySelector('.correctness');
        const percent = document.querySelector('.percent');
        //Hiding everything
        textContainer.style.display = 'none'
        inputField.style.display = 'none'
        responseText.style.display = 'none'
        questionInfo.style.display = 'none'
        answerInfo.style.display = 'none'
        correctness.style.display = 'block'
        percent.style.display = 'block'
        

        //Displaying stats
        correctness.textContent = 'Congrats you got ' + correct + ' correct out of ' + numberOfQuestionsComplete + '!'
        percent.textContent = 'This is a ' + Math.round((correct/numberOfQuestionsComplete)*100) +'%. Refresh for a chance to get a higher score, otherwise Vale 👋'

    }

    function settings() {
    
        // Get the settings element
        var settingsElement = document.getElementById("settings");
    
        // Toggle the spin class to trigger the spinning animation
        settingsElement.classList.toggle("spin");
    
        // Add a timeout to remove the spin class after the spinning animation completes
        setTimeout(function () {
            settingsElement.classList.toggle("spin");
    
            // Get the settings container element
            var settingsContainer = document.querySelector(".settings-container");
    
            // Toggle the 'show' class to trigger the pop-in animation
            settingsContainer.classList.toggle("show");
            settingsContainer.classList.toggle("pop-in");
        }, 1000); // Adjust the timeout based on the duration of your spinning animation
    }    

    function soundControl(){
        const sound = document.querySelector("#soundManagement")
        soundOn = !soundOn
        if(soundOn) sound.src = "volume.png"
        else sound.src = "mute.png"
    }

    function credits(){
        const sound = document.querySelector("#soundManagement")
        const credits = document.querySelector("#credits")
        sound.style.opacity = hidden ? "0" : "1"
        credits.textContent = "Settings icons created by Freepik - Flaticon, \n Mute icons created by Freepik - Flaticon, \n Speaker icons created by Pixel perfect - Flaticon, \n thanks Komyca 3D Font by Alit Design for the 'credits' image"
        credits.style.opacity = hidden ? "1" : "0"
        hidden = !hidden
    }

} else {
    console.log("Web Speech API not supported :-(") 
}

