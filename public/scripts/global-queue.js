import { PublicQueDatas } from "../constants/queData.js";

const readyCountdown = document.getElementById('ranked-match-ready-countdown');
const readyButton = document.getElementById('ranked-match-ready-button');
const modal = document.getElementById("ready-modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn-close");
const matchFoundMessage = document.getElementsByClassName('match-found-message');
const favicons = document.querySelectorAll('link[rel="icon"]');
const originalFaviconhref = document.querySelector('link[rel="icon"]').href;

const socket = io();

var countdown;
var queuedMatchMode;
var ready = false;
var readyUp;

var readySound = new Audio('../assets/sounds/match-found.wav');

readyButton.addEventListener('click', async (e) => {
    readyButton.style.display = 'none';
    ready = true;

    let readyNonModal = document.getElementById('ranked-match-ready-button-non-modal');
    if ( readyNonModal != null ) {
        readyNonModal.style.display = 'none';
        readyNonModal.classList.add('modal-readied');
    }

    for ( let message of matchFoundMessage ) {
        message.innerHTML = 'Waiting for opponent.';
    }

    // Not sure if we need to send any data but we can leave it blank for now

    let response = await postData('/que/PlayerReady');

    // Redirect to the game room once the game is created
});

closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('focus', (e) => {
    console.log('FOCUSING');
    favicons.forEach(clearBadge);
});


async function setUserInfo() {
    let userInfo = await getUserInfo();
    if ( userInfo.queData ) {
        queuedMatchMode = userInfo.queData.matchMode;
    } else if ( userInfo.readyData ) {
        queuedMatchMode = userInfo.readyData.matchMode;
    } else {
        // idk error I guess
    }
}

async function getUserInfo() {
    let data = {};
    let result = await fetchData('/user/GetUserInfo');
    return result.data;
}

function openModal() {
    readyButton.style.display = 'block';
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.scrollTop = 0;

    let settingsReady = localStorage.getItem('queueSound');
    console.log(settingsReady);

    if ( settingsReady != 'false' ) {
        readySound.play();
    }
}

function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function addBadge(favicon) {
  const faviconSize = 32;
  const canvas = document.createElement('canvas');

  canvas.width = faviconSize;
  canvas.height = faviconSize;

  const context = canvas.getContext('2d');
  const img = document.createElement('img');

  const createBadge = () => {
      context.drawImage(img, 0, 0, faviconSize, faviconSize);

      context.beginPath();
      context.arc(canvas.width - faviconSize / 3 , faviconSize / 3, faviconSize / 3, 0, 2 * Math.PI);
      context.fillStyle = '#e30';
      context.fill();

      context.font = '15px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#fff';
      context.fillText('', canvas.width - faviconSize / 3, faviconSize / 3);

      favicon.href = canvas.toDataURL('image/png');
   };

  img.addEventListener('load', createBadge);

  img.src = favicon.href;
}

function clearBadge(favicon) {
    favicon.href = originalFaviconhref;
}

function countdownTimer() {
    countdown -= 1;
    let time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
    if ( countdown == 0 ) {
        clearTimer(readyUp);
        if ( modal.offsetTop != 0 ) {
            if ( !ready ) {
                alert('You have been removed from the queue due to inactivity.');
                closeModal();
            } else {
                alert('Your opponent did not ready up for the match and it has been canceled.');
                closeModal();
            }
        }
    }
}

function clearTimer(intervalId) {
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    clearInterval(intervalId);

    let time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
}

function secondsToMS(d) {
    d = Number(d);

    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    return ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

async function reconnectSocket() {
    await setUserInfo();
    socket.connect();
    socket.emit('join', 'userRoom');
}

socket.emit('join', 'userRoom');

socket.on('matchFound', async () => {
    for ( let message of matchFoundMessage ) {
        message.innerHTML = 'Match found! Please ready up.';
    }
    await setUserInfo();
    // show modal
    openModal();
    favicons.forEach(addBadge);

    // timer
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    ready = false;
    readyUp = window.setInterval(countdownTimer, 1000);
});

socket.on('matchReady', (matchID) => {
    clearTimer(readyUp);
    window.location.href = '/game?matchID=' + matchID;
});

socket.on("connect_error", async (err) => {
  /*alert(`Socket connection error. Please report this to the devs! (And reload the page to reconnect).
  
  Message: ${err.message}
  
  Decription: ${err.description}
  
  Context: ${err.context}`);*/
    await reconnectSocket();
});

socket.on("disconnect", async (reason, details) => {
  /*alert(`Socket disconnect. This shouldnt be pushed to prod!

  Reason: ${reason}
  
  Message: ${details.message}
  
  Decription: ${details.description}
  
  Context: ${details.context}`);*/
    await reconnectSocket();
});