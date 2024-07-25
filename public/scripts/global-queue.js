import { PublicQueDatas } from "../constants/queData.js";

const readyCountdown = document.getElementById('ranked-match-ready-countdown');
const readyButton = document.getElementById('ranked-match-ready-button');
const modal = document.getElementById("ready-modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn-close");

const socket = io();

var countdown;
var queuedMatchMode;
var ready = false;
var readyUp;

readyButton.addEventListener('click', async (e) => {
    console.log('User is ready for competitive match.');
    readyButton.style.display = 'none';
    ready = true;

    // Not sure if we need to send any data but we can leave it blank for now

    var response = await postData('/que/PlayerReady');
    console.log(response);

    // Redirect to the game room once the game is created
});

closeModalBtn.addEventListener('click', closeModal);

async function setUserInfo() {
    var userInfo = await getUserInfo();
    if ( userInfo.queData ) {
        queuedMatchMode = userInfo.queData.matchMode;
    }
}

async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}

function openModal() {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.scrollTop = 0;
}

function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function countdownTimer() {
    countdown -= 1;
    var time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
    if ( countdown == 0 ) {
        clearTimer(readyUp);
        if ( !ready ) {
            alert('You have been removed from the queue due to inactivity.');
            closeModal();
        } else {
            alert('Your opponent did not ready up for the match and it has been canceled.');
            closeModal();
        }
    }
}

function clearTimer(intervalId) {
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    clearInterval(intervalId);

    var time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
}

function secondsToMS(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

socket.emit('join', 'userRoom');

socket.on('matchFound', () => {
    setUserInfo();
    // show modal
    openModal();

    // timer
    console.log('Socket event match ready');
    console.log(queuedMatchMode);
    console.log(PublicQueDatas[queuedMatchMode]);
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    ready = false;
    readyUp = window.setInterval(countdownTimer, 1000);
});

socket.on('matchReady', (matchID) => {
    clearTimer(readyUp);
    console.log('/game?matchID=' + matchID);
    window.location.href = '/game?matchID=' + matchID;
});