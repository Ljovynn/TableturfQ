import { PublicQueDatas } from "../constants/queData.js";

// Elements
const loading = document.getElementById('loading');
const competetiveQueue = document.getElementById('competetive-queue');
const casualQueue = document.getElementById('casual-queue');
const casualUsername = document.getElementById('casual-username');
const queueMatchmaking = document.getElementById('queue-matchmaking');
const matchMakingReady = document.getElementById('ranked-match-ready');
const queueTimer = document.getElementById('queue-timer');
const queueInfo = document.getElementById('queue-info');
const readyCountdown = document.getElementById('ranked-match-ready-countdown');
const recentMatches = document.getElementById('recent-matches');
const recentMatchesList = document.getElementById('recent-matches-list');

// Interactable Elements
const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const readyButton = document.getElementById('ranked-match-ready-button');
const leaveButton = document.getElementById('leave-queue-button');

const socket = io();

var queuedMatchMode;
var mainTimer;
var readyUp;
var ready = false;
var isCasual = false;

var user;
var userID = 0;

var timer = 0;
var countdown;
console.log(countdown);

await setUserInfo();
await getRecentMatches();

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

    // Check that there is a username entered
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
});

readyButton.addEventListener('click', async (e) => {
    console.log('User is ready for competetive match.');
    readyButton.style.display = 'none';
    ready = true;

    // Not sure if we need to send any data but we can leave it blank for now

    var response = await postData('/que/PlayerReady');
    console.log(response);

    // Redirect to the game room once the game is created
});

leaveButton.addEventListener('click', async (e) => {
    console.log('leaving queue');
    var data = { matchMode: queuedMatchMode };
    var response = await postData('/que/PlayerLeaveQue', data);
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
    console.log('Setting user info');
    try {
        var userInfo = await getUserInfo();
        console.log(userInfo);
        user = userInfo.user;
        console.log(user);
        userID = user.id;
        console.log(userID);
        loading.style.display = 'none';
        if ( !user.discord_id ) {
            isCasual = true;
            casualQueue.style.display = 'block';
        } else {
            competetiveQueue.style.display = 'inline-block';
            casualQueue.style.display = 'inline-block';
        }

        if ( userInfo.queData ) {
            setQueueInfo(userInfo.queData);
        }

        if ( userInfo.readyData ) {
            setReadyUp(userInfo.readyData);
        }
    } catch (error) {
        window.location.href = '/';
    }
}

function setQueueInfo(queueData) {
    var timeStarted = Math.floor( queueData.timeQueStarted / 1000 );
    var timeNow = Math.floor(Date.now() / 1000);
    var timeElapsed = timeNow - timeStarted;
    timer = timeElapsed;
    queueInfo.style.display = 'block';
    mainTimer = window.setInterval(updateTimer, 1000);
}

async function getRecentMatches() {
    var data = {};
    var result = await fetchData('/matchHistory/GetRecentMatches');
    console.log(result);
    displayRecentMatches(result);
}

function displayRecentMatches(recentMatchData) {
    var players = recentMatchData.users;
    var matches = recentMatchData.recentMatches;
    if ( matches.length > 0 ) {
        for ( let match of matches ) {
            let row = document.createElement('div');
            row.classList.add('match-row');

            let dateCell = document.createElement('div');
            dateCell.classList.add('match-date');
            var matchDate = match.created_at.split('T')[0];
            dateCell.append(matchDate);

            let matchupCell = document.createElement('div');
           // var players = await getMatchUsers( [match.player1_id, match.player2_id] );
            var player1 = getMatchPlayer(players, match.player1_id);
            var player2 = getMatchPlayer(players, match.player2_id);
            matchupCell.classList.add('matchup');
            matchupCell.append(player1[0].username + ' vs ' + player2[0].username);

            let outcomeCell = document.createElement('div');
            outcomeCell.classList.add('match-outcome');
            let outcome = '';
            switch ( match.result ) {
                case 0:
                case 1:
                case 2:
                    outcome = 'In Game';
                    break;
                case 3:
                    // player 1 win
                    outcome = player1[0].username + ' Victory';
                    break;
                case 4:
                    // player 2 win
                    outcome = player2[0].username + ' Victory';
                    break;
                default:
                    outcome = 'No Winner';
                    break;
            }
            outcomeCell.append(outcome);

            row.append(dateCell);
            row.append(matchupCell);
            row.append(outcomeCell);

            recentMatchesList.append(row);
        }
        recentMatches.style.display = 'block';
    }
}

function setReadyUp(readyData) {
    var timeStarted = Math.floor( readyData.timeWaitingStarted / 1000 );
    var timeNow = Math.floor(Date.now() / 1000);
    var timeElapsed = timeNow - timeStarted;
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    countdown = countdown - timeElapsed;
    matchMakingReady.style.display = 'block';
    ready = readyData.ready;
    if ( ready ) {
        readyButton.style.display = 'none';
    } else {
        readyButton.style.display = 'inline-block'
    }
    readyUp = window.setInterval(countdownTimer, 1000);
}

function validateDisplayname(displayName) {
    if ( displayName === '' ) {
        return false;
    }

    return true;
}

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

function getMatchPlayer( matchUsers, playerId ) {
    var player = matchUsers.filter( (user) => user.id === playerId );
    return player;
}

// SOCKET JS
socket.emit('join', 'queRoom');

socket.on('matchFound', () => {
    console.log('Socket event match ready');
    timer = 0;
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    queueInfo.style.display = 'none';
    matchMakingReady.style.display = 'block';
    ready = false;
    readyUp = window.setInterval(countdownTimer, 1000);
});

socket.on('matchReady', (matchID) => {
    console.log('/game?matchID=' + matchID);
    window.location.href = '/game?matchID=' + matchID;
});