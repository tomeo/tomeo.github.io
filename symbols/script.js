function preloadVoices() {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length) {
        resolve(voices);
        } else {
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };
        }
    });
}

function speak(message, callback) {
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.name === 'Google UK English Female');
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.onend = callback;
    utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool() {
    return Math.random() < 0.5;
}

function changeSymbol(symbol) {
    document.getElementById('symbol').innerText = symbol.value;
}

function countingPhrase(value, answer) {
    let max = Number(value);
    let numbers = [];
    for(var i = 1; i <= max; i++) numbers.push(i);
    let numbersStr = numbers.join(", ");
    return `${numbersStr}. ${value} ${answer}`
}

function phrase(symbol, answer) {
    return isNaN(symbol.value)
    ? `${symbol.value.toUpperCase()} is for ${answer}`
    : countingPhrase(symbol.value, answer);
}

function changeText(symbol, answer) {
    document.getElementById('text').innerText = phrase(symbol, answer);
    document.getElementById('text').classList.remove("hidden");
}

function changeImage(answer) {
    document.getElementById('img').src = `img/${answer.toLowerCase()}.jpg`;
    document.getElementById('img').classList.remove("hidden");
}

function reset(symbol) {
    changeSymbol(symbol);
    document.getElementById('img').classList.add("hidden");
    document.getElementById('text').classList.add("hidden");
}

function symbol_type(value) {
    return isNaN(value) ? "letter" : "number";
}

function correct(symbol, answer) {
    changeText(symbol, answer);
    changeImage(answer);
    speak(`Yes! That is the ${symbol_type(symbol.value)} ${symbol.value}. ${phrase(symbol, answer)}`, function () {
        reset(getRandom(symbols));
    });
}

document.addEventListener('DOMContentLoaded', function() {
    preloadVoices().then(() => {
        reset(getRandom(symbols));
        document.addEventListener('keydown', function(event) {
            let currentValue = document.getElementById('symbol').innerText.toLowerCase()
            let currentSymbol = symbols.find(s => s.value.toLowerCase() == currentValue);
            if (event.key === currentSymbol.value.toLowerCase()) {
                let answer = getRandom(currentSymbol.answers);
                correct(currentSymbol, answer);
            }
        });
      });
});