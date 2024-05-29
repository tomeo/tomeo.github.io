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
    const enVoices = voices.filter(voice => voice.lang === 'en-GB' || voice.lang === 'en-US');
    let selectedVoice = getRandom(enVoices);

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

function maybeUppercase(value) {
    if (value === "i") return "i";
    if (value === "l") return "L";

    return randomBool() ? value : value.toUpperCase();
}

function changeSymbol(symbol) {
    document.getElementById('symbol').value = maybeUppercase(symbol.value);
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
    document.getElementById('symbol').classList.remove("hidden");
    document.getElementById('img').classList.add("hidden");
    document.getElementById('text').classList.add("hidden");
}

function symbol_type(value) {
    return isNaN(value) ? "letter" : "number";
}

// function correct(symbol, answer, fireworks) {
    function correct(symbol, answer) {
    // fireworks.start();
    document.getElementById('symbol').classList.add("hidden");
    document.getElementById('symbol').value = "";
    changeText(symbol, answer);
    changeImage(answer);
    speak(`Yes! That is the ${symbol_type(symbol.value)} ${symbol.value}. ${phrase(symbol, answer)}`, function () {
        reset(getRandom(symbols));
        // fireworks.stop();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // const fireworks = new Fireworks.default(document.querySelector("#main"));

    document.getElementById('symbol').addEventListener('keypress', function(event) {
        event.preventDefault();
    });

    preloadVoices().then(() => {
        reset(getRandom(symbols));
        document.addEventListener('keydown', function(event) {
            let currentValue = document.getElementById('symbol').value.toLowerCase()
            let currentSymbol = symbols.find(s => s.value.toLowerCase() == currentValue);
            if (event.key === currentSymbol.value.toLowerCase()) {
                let answer = getRandom(currentSymbol.answers);
                // correct(currentSymbol, answer, fireworks);
                correct(currentSymbol, answer);
            }
        });
      });
});