// ================================
// Rock Paper Scissors Pro
// script.js
// ================================

const emojis = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️"
};

let wins = Number(localStorage.getItem("wins")) || 0;
let losses = Number(localStorage.getItem("losses")) || 0;
let ties = Number(localStorage.getItem("ties")) || 0;
let streak = Number(localStorage.getItem("streak")) || 0;
let bestStreak = Number(localStorage.getItem("bestStreak")) || 0;

let history = JSON.parse(localStorage.getItem("history")) || [];

const playerChoice = document.getElementById("playerChoice");
const computerChoice = document.getElementById("computerChoice");
const result = document.getElementById("result");

const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const tiesEl = document.getElementById("ties");
const gamesEl = document.getElementById("games");

const streakEl = document.getElementById("streak");
const bestEl = document.getElementById("best");
const rateEl = document.getElementById("rate");

const historyList = document.getElementById("historyList");

// ----------------------------

updateScreen();

// ----------------------------

function play(playerMove) {

    playerChoice.textContent = emojis[playerMove];

    computerChoice.textContent = "🤔";

    result.textContent = "Computer is thinking...";

    setTimeout(() => {

        const options = ["rock", "paper", "scissors"];

        const computerMove =
            options[Math.floor(Math.random() * 3)];

        computerChoice.textContent =
            emojis[computerMove];

        let gameResult = "";

        if (playerMove === computerMove) {

            ties++;

            gameResult = "Tie!";

            result.style.color = "#ffd54f";

        }

        else if (

            (playerMove === "rock" && computerMove === "scissors") ||

            (playerMove === "paper" && computerMove === "rock") ||

            (playerMove === "scissors" && computerMove === "paper")

        ) {

            wins++;

            streak++;

            if (streak > bestStreak)
                bestStreak = streak;

            gameResult = "You Win! 🎉";

            result.style.color = "#4caf50";

        }

        else {

            losses++;

            streak = 0;

            gameResult = "Computer Wins!";

            result.style.color = "#ff5252";

        }

        result.textContent = gameResult;

        history.unshift(
            `${playerMove} vs ${computerMove} → ${gameResult}`
        );

        if (history.length > 10)
            history.pop();

        saveData();

        updateScreen();

    }, 800);

}

// ----------------------------

function updateScreen() {

    winsEl.textContent = wins;

    lossesEl.textContent = losses;

    tiesEl.textContent = ties;

    const totalGames = wins + losses + ties;

    gamesEl.textContent = totalGames;

    streakEl.textContent = streak;

    bestEl.textContent = bestStreak;

    if (totalGames === 0)
        rateEl.textContent = "0%";
    else
        rateEl.textContent =
            Math.round((wins / totalGames) * 100) + "%";

    historyList.innerHTML = "";

    if (history.length === 0) {

        historyList.innerHTML =
            "<li>No games played yet.</li>";

    }

    else {

        history.forEach(item => {

            const li = document.createElement("li");

            li.textContent = item;

            historyList.appendChild(li);

        });

    }

}

// ----------------------------

function saveData() {

    localStorage.setItem("wins", wins);

    localStorage.setItem("losses", losses);

    localStorage.setItem("ties", ties);

    localStorage.setItem("streak", streak);

    localStorage.setItem("bestStreak", bestStreak);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );

}

// ----------------------------

function resetGame() {

    if (!confirm("Reset all statistics?"))
        return;

    wins = 0;

    losses = 0;

    ties = 0;

    streak = 0;

    bestStreak = 0;

    history = [];

    playerChoice.textContent = "❔";

    computerChoice.textContent = "❔";

    result.textContent = "Make Your Move!";

    result.style.color = "#ffd54f";

    saveData();

    updateScreen();

}

// ----------------------------

const soundBtn = document.getElementById("soundBtn");

let sound = true;

soundBtn.addEventListener("click", () => {

    sound = !sound;

    soundBtn.textContent =

        sound ?

        "🔊 Sound ON"

        :

        "🔇 Sound OFF";

});