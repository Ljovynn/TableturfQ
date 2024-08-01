import { PublicQueDatas } from "../constants/queData.js";

// Elements
const loading = document.getElementById('loading');
const competitiveQueue = document.getElementById('competitive-queue');
const casualQueue = document.getElementById('casual-queue');
const casualUsername = document.getElementById('casual-username');
const queueMatchmaking = document.getElementById('queue-matchmaking');
const matchMakingReady = document.getElementById('ranked-match-ready-non-modal');
const queueTimer = document.getElementById('queue-timer');
const queueInfo = document.getElementById('queue-info');
const readyCountdown = document.getElementById('ranked-match-ready-countdown-non-modal');
const recentMatches = document.getElementById('recent-matches');
const recentMatchesList = document.getElementById('recent-matches-list');
const modal = document.getElementById("ready-modal");

// Interactable Elements
const joinCompetitive = document.getElementById('join-competitive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const queueButtons = document.getElementsByClassName('queue-button');
const readyButton = document.getElementById('ranked-match-ready-button-non-modal');
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

await setUserInfo();
await getRecentMatches();

joinCompetitive.addEventListener('click', async (e) => {
    console.log('User has joined the competitive queue');
    var data = { matchMode: 'ranked' }
    queuedMatchMode = 'ranked';

    // Join the queue
    var response = await postData('/que/PlayerEnterQue', data);
    console.log('Response data: ' + JSON.stringify(response));
    if ( response == 201 ) {
        for ( let queueButton of queueButtons ) {
            queueButton.style.display = 'none';
        }
        // Do queue frontend stuff
        timer = 0;
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
        for ( let queueButton of queueButtons ) {
            queueButton.style.display = 'none';
        }
        // Do queue frontend stuff
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
    console.log('User is ready for competitive match.');
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
        for ( let queueButton of queueButtons ) {
            queueButton.style.display = 'inline-block';
        }
        clearTimer(mainTimer);
        queueInfo.style.display = 'none';
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
        user = userInfo.user;
        if ( !user.banned ) {
            userID = user.id;
            loading.style.display = 'none';
            if ( !user.discord_id ) {
                isCasual = true;
                casualQueue.style.display = 'block';
            } else {
                competitiveQueue.style.display = 'block';
                casualQueue.style.display = 'block';
            }

            if ( userInfo.queData ) {
                setQueueInfo(userInfo.queData);
            }

            if ( userInfo.readyData ) {
                setReadyUp(userInfo.readyData);
            }
        } else {
            window.location.href = '/profile?playerId=' + user.id;
        }
    } catch (error) {
        console.log(error);
        window.location.href = '/';
    }
}

function setQueueInfo(queueData) {
    var timeStarted = Math.floor( queueData.timeQueStarted / 1000 );
    var timeNow = Math.floor(Date.now() / 1000);
    var timeElapsed = timeNow - timeStarted;
    queuedMatchMode = queueData.matchMode;
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
            try {
                let row = document.createElement('div');
                row.classList.add('match-row');

                let dateCell = document.createElement('div');
                dateCell.classList.add('match-date');
                var matchDate = match.unix_created_at;
                matchDate = new Date(matchDate);
                matchDate = matchDate.getTime();
                var timeNow = Math.floor(Date.now() / 1000);
                var timeElapsed = timeNow - matchDate;
                var readableTime = getReadableTime(timeElapsed);

                dateCell.append(readableTime);

                let matchupCell = document.createElement('div');
               // var players = await getMatchUsers( [match.player1_id, match.player2_id] );
                var player1 = getMatchPlayer(players, match.player1_id);
                var player2 = getMatchPlayer(players, match.player2_id);
                matchupCell.classList.add('matchup');

                let matchPlayer1 = document.createElement('div');
                matchPlayer1.classList.add('recent-matchup-player');
                matchPlayer1.classList.add('recent-matchup-player1');
                let matchPlayer2 = document.createElement('div');
                matchPlayer2.classList.add('recent-matchup-player');
                matchPlayer2.classList.add('recent-matchup-player2');

                let avatarPlayer1 = document.createElement('img')
                avatarPlayer1.classList.add('recent-matchup-avatar');
                let avatarPlayer2 = document.createElement('img');
                avatarPlayer2.classList.add('recent-matchup-avatar');

                if ( player1[0].discord_avatar_hash ) {
                    avatarPlayer1.src = 'https://cdn.discordapp.com/avatars/' + player1[0].discord_id + '/' + player1[0].discord_avatar_hash + '.jpg' + '?size=512';
                } else {
                    avatarPlayer1.src = '/assets/images/chumper.png';
                }

                if ( player2[0].discord_avatar_hash ) {
                    avatarPlayer2.src = 'https://cdn.discordapp.com/avatars/' + player2[0].discord_id + '/' + player2[0].discord_avatar_hash + '.jpg' + '?size=512';
                } else {
                    avatarPlayer2.src = '/assets/images/chumper.png';
                }

                let player1Name = document.createElement('div');
                player1Name.classList.add('recent-matchup-name');
                let player2Name = document.createElement('div');
                player2Name.classList.add('recent-matchup-name');

                switch ( match.result ) {
                    case 0:
                    case 1:
                    case 2:
                        //
                        break;
                    case 3:
                        // player 1 win
                        player1Name.classList.add('recent-matchup-victor');
                        break;
                    case 4:
                        // player 2 win
                        player2Name.classList.add('recent-matchup-victor');
                        break;
                    default:
                        //
                        break;
                }

                player1Name.append( sanitizeDisplayName( player1[0].username ) );
                player2Name.append( sanitizeDisplayName( player2[0].username ) );

                matchPlayer1.append(avatarPlayer1);
                matchPlayer1.append( player1Name );

                matchPlayer2.append(avatarPlayer2);
                matchPlayer2.append( player2Name );

                matchupCell.append( matchPlayer1 );
                matchupCell.append('vs');
                matchupCell.append( matchPlayer2 );

                /*let outcomeCell = document.createElement('div');
                outcomeCell.classList.add('match-outcome');
                let outcome = '';
                outcomeCell.append(outcome);*/

                let typeCell = document.createElement('div');
                typeCell.classList.add('match-type');

                if ( match.ranked ) {
                    typeCell.append('Ranked');
                } else {
                    typeCell.append('Casual');
                }

                row.append(matchupCell);
                row.append(typeCell);
                row.append(dateCell);
                //row.append(outcomeCell);

                recentMatchesList.append(row);
            } catch (error) {
                // idk user not found handling
            }
        }
        recentMatches.style.display = 'block';
    }
}

function setReadyUp(readyData) {
    var timeStarted = Math.floor( readyData.timeWaitingStarted / 1000 );
    var timeNow = Math.floor(Date.now() / 1000);
    var timeElapsed = timeNow - timeStarted;
    queuedMatchMode = readyData.matchMode;
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
        if ( modal.offsetTop == 0 ) {
            console.log('hidden modal');
            // Make the logic work if they clicked ready from the modal
            if ( readyButton.classList.contains('modal-readied') ) {
                console.log('readied on modal');
                ready = true;
                readyButton.classList.remove('modal-readied');
            }

            if ( !ready ) {
                alert('You have been removed from the queue due to inactivity.');
            } else {
                alert('Your opponent did not ready up for the match and it has been canceled.');
            }
        }
        matchMakingReady.style.display = 'none';
        for ( let queueButton of queueButtons ) {
            queueButton.style.display = 'inline-block';
        }
    }
}

function clearTimer(intervalId) {
    timer = 0;
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    clearInterval(intervalId);

    // Reset the timers
    var time = secondsToHMS(timer);
    queueTimer.innerHTML = 'Finding Match... ' + time;

    var time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
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

function getReadableTime(time) {
    var returnTime;
    var timeUnit;
    if ( time / 3600 > 24 ) {
        returnTime = Math.floor( time / 3600 / 24);
        if ( returnTime != 1 ) {
            timeUnit = 'days';
        } else {
            timeUnit = 'day'
        }
    } else if ( time > 3600 ) {
        returnTime = Math.round( time / 3600);
        if ( returnTime != 1 ) {
            timeUnit = 'hours';
        } else {
            timeUnit = 'hour'
        }
    } else if ( time < 60 ) {
        returnTime = time;
        if ( returnTime != 1 ) {
            timeUnit = 'seconds';
        } else {
            timeUnit = 'second';
        }
    } else {
        returnTime = Math.round( time / 60 );
        if ( returnTime != 1 ) {
            timeUnit = 'minutes';
        } else {
            timeUnit = 'minute';
        }
    }

    return returnTime + ' ' + timeUnit + ' ago';
}

function getMatchPlayer( matchUsers, playerId ) {
    var player = matchUsers.filter( (user) => user.id === playerId );
    return player;
}

// SOCKET JS
socket.emit('join', 'userRoom');

socket.on('matchFound', () => {
    console.log('Socket event match ready');
    timer = 0;
    clearTimer(mainTimer);
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    queueInfo.style.display = 'none';
    matchMakingReady.style.display = 'block';
    readyButton.style.display = 'inline-block';
    ready = false;
    readyUp = window.setInterval(countdownTimer, 1000);
});

socket.on('matchReady', (matchID) => {
    clearTimer(readyUp);
    console.log('/game?matchID=' + matchID);
    window.location.href = '/game?matchID=' + matchID;
});

socket.on("connect_error", (err) => {
  alert(`Socket connection error. Please report this to the devs! (And reload the page to reconnect).
  
  Message: ${err.message}
  
  Decription: ${err.description}
  
  Context: ${err.context}`);
});

socket.on("disconnect", (reason, details) => {
  alert(`Socket disconnect. This shouldnt be pushed to prod!

  Reason: ${reason}
  
  Message: ${details.message}
  
  Decription: ${details.description}
  
  Context: ${details.context}`);
});

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}