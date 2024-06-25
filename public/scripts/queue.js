// Elements
const casualUsername = document.getElementById('casual-username');
const queueMatchmaking = document.getElementById('queue-matchmaking');
const matchMakingReady = document.getElementById('ranked-match-ready');
const queueTimer = document.getElementById('queue-timer');
const queueInfo = document.getElementById('queue-info');
const readyCountdown = document.getElementById('ranked-match-ready-countdown');

// Interactable Elements
const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const readyButton = document.getElementById('ranked-match-ready-button');
const leaveButton = document.getElementById('leave-queue-button');

const socket = io();

var queuedMatchMode;
var mainTimer;
var ready = false;

var user;
var userID = 0;

await setUserInfo();

joinCompetetive.addEventListener('click', async (e) => {
    console.log('User has joined the competetive queue');
    var data = { matchMode: 'ranked' }
    queuedMatchMode = 'ranked';

    // Join the queue
    var response = await postData('/que/PlayerEnterQue', data);
    console.log('Response data: ' + JSON.stringify(response));
    if ( response == 201 ) {
        // Do queue frontend stuff
        alert('Successfully joined the queue!');
        queueInfo.style.display = 'block';
        mainTimer = window.setInterval(updateTimer, 1000);
        // Socket matchfound code
        //matchMakingReady.style.display = 'block';
    } else {
        alert('There was a problem joining the queue. Please refresh and try again');
    }
});

joinCasual.addEventListener('click', async (e) => {
    console.log('User has joined the casual queue');
    console.log('Submitted user name: ' + casualUsername.value);
    displayName = casualUsername.value;

    // Check that there is a username entered
    if (validateDisplayname(displayName)) {
        var data = { matchMode: 'casual' }
        queuedMatchMode = 'casual';
        // Join the queue
        var response = await postData('/que/PlayerEnterQue', data);
        
        if ( response == 201 ) {
            // Do queue frontend stuff
            alert('Successfully joined the queue!');
            timer = 0;
            queueInfo.style.display = 'block';
            mainTimer = window.setInterval(updateTimer, 1000);
            // Socket matchfound code
            //matchMakingReady.style.display = 'block';
        } else {
            alert('There was a problem joining the queue. Please refresh and try again');
        }

    } else {
        alert('Please enter a valid display name.');
    }
});

readyButton.addEventListener('click', async (e) => {
    console.log('User is ready for competetive match.');
    readyButton.style.display = 'none';
    ready = true;

    // Not sure if we need to send any data but we can leave it blank for now

    response = await postData('/que/PlayerReady');
    console.log(response);

    // Redirect to the game room once the game is created
});

leaveButton.addEventListener('click', async (e) => {
    console.log('leaving queue');
    data = { matchMode: queuedMatchMode };
    response = await postData('/que/PlayerLeaveQue', data);
    console.log(response);
    if ( response == 201 ) {
        clearTimer(mainTimer);
        queueInfo.style.display = 'none';
        alert('You have successfully left the queue');
        timer = 0;
        queueTimer.innerHTML = 'Finding Match... 00:00:00'; 
    }
});

async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}

async function setUserInfo() {
    var userInfo = await getUserInfo();
    user = userInfo.user;
    userID = user.id;
    console.log(userID);
}

function validateDisplayname(displayName) {
    if ( displayName === '' ) {
        return false;
    }

    return true;
}

var timer = 0;
var countdown = 300;

function updateTimer() {
    timer += 1;
    var time = secondsToHMS(timer);
    queueTimer.innerHTML = 'Finding Match... ' + time;    
}

function countdownTimer() {
    countdown -= 1;
    var time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
    if ( countdown == 0 ) {
        clearTimer(readyUp);
        if ( !ready ) {
            alert('You have been removed from the queue due to inactivity.');
        } else {
            alert('Your opponent did not ready up for the match and it has been canceled.');
        }
        matchMakingReady.style.display = 'none';
    }

}

function clearTimer(intervalId) {
    timer = 0;
    clearInterval(intervalId);
}

function secondsToHMS(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

function secondsToMS(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

// SOCKET JS
console.log('Joining queRoom' + userID.toString());
socket.emit('join', 'queRoom' + userID.toString());

socket.on('matchFound', (matchedPlayersData) => {
    console.log('Socket event match ready');
    console.log(matchedPlayersData);
    timer = 0;
    countdown = 300;
    queueInfo.style.display = 'none';
    matchMakingReady.style.display = 'block';
    ready = false;
    readyUp = window.setInterval(countdownTimer, 1000);
});

socket.on('matchReady', (matchedPlayersData) => {
    console.log(matchedPlayersData);
    const matchID = matchedPlayersData.matchId;
    console.log('/game?matchID=' + matchID);
    window.location.href = '/game?matchID=' + matchID;
});