import { PublicQueDatas } from "../constants/queData.js";
import { userError, clearError } from "./error.js";

// Elements
const loading = document.getElementById('loading');
const loginContent = document.getElementById('login-content');
const matchMakingUnavailable = document.getElementById('matchmaking-unavailable');
const matchMakingQueues = document.getElementById('matchmaking-queues');
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
const modal = document.getElementById('ready-modal');

// Interactable Elements
const joinCompetitive = document.getElementById('join-competitive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const queueButtons = document.getElementsByClassName('queue-section');
const readyButton = document.getElementById('ranked-match-ready-button-non-modal');
const leaveButton = document.getElementById('leave-queue-button');

// Login
const guestName = document.getElementById('guest-login-name');
const guestSubmit = document.getElementById('guest-login-button');

const socket = io();

var matchMakingStatus = false;
var queuedMatchMode;
var mainTimer;
var readyUp;
var ready = false;
var isCasual = false;

var user;
var userID = 0;

var timer = 0;
var countdown;

await setMatchMakingStatus();
await setUserInfo();
await getRecentMatches();

joinCompetitive.addEventListener('click', async (e) => {
    await clearError();

    console.log('User has joined the competitive queue');
    let data = { matchMode: 'ranked' }
    queuedMatchMode = 'ranked';

    // Join the queue
    let response = await postData('/que/PlayerEnterQue', data);
    console.log('Response data: ' + JSON.stringify(response));
    if ( response.code == 201 ) {
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
        //alert('There was a problem joining the queue. Please refresh and try again');
        console.log('error');
        let error = response.data.error;
        console.log(error);
        await userError(error);
    }
});

joinCasual.addEventListener('click', async (e) => {
    await clearError();

    console.log('User has joined the casual queue');

    // Check that there is a username entered
    let data = { matchMode: 'casual' }
    queuedMatchMode = 'casual';
    // Join the queue
    let response = await postData('/que/PlayerEnterQue', data);
    
    if ( response.code == 201 ) {
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
        //alert('There was a problem joining the queue. Please refresh and try again');
        console.log('error');
        let error = response.data.error;
        console.log(error);
        await userError(error);
    }
});

readyButton.addEventListener('click', async (e) => {
    console.log('User is ready for competitive match.');
    readyButton.style.display = 'none';
    ready = true;

    // Not sure if we need to send any data but we can leave it blank for now

    let response = await postData('/que/PlayerReady');
    console.log(response);

    // Redirect to the game room once the game is created
});

leaveButton.addEventListener('click', async (e) => {
    console.log('leaving queue');
    let data = { matchMode: queuedMatchMode };
    let response = await postData('/que/PlayerLeaveQue', data);
    console.log(response);
    if ( response.code == 201 ) {
        for ( let queueButton of queueButtons ) {
            queueButton.style.display = 'block';
        }
        clearTimer(mainTimer);
        queueInfo.style.display = 'none';
        timer = 0;
        queueTimer.innerHTML = 'Finding Match... 00:00:00'; 
    }
});

guestSubmit.addEventListener('click', async (e) => {
    if ( validateDisplayname(guestName.value) ) {
        let data = { username: guestName.value };
        let response = await postData('/api/auth/unverified/login', data);
        console.log(response);
        if ( response.code == 201 ) {
            window.location.href = '/queue';
        }
    }
});

async function getMatchMakingStatus() {
    let data = {};
    let result = await getData('/que/GetMatchmakingStatus');
    return result.data;
}

async function setMatchMakingStatus() {
    try {
        let status = await getMatchMakingStatus();
        console.log(status);
        if ( !status ) {
            loading.style.display = 'none';
            matchMakingUnavailable.style.display = 'block';
        }
        matchMakingStatus = status;
    } catch (error) {
        console.log(error);
    }
}

async function getUserInfo() {
    let data = {};
    let result = await getData('/user/GetUserInfo');
    return result.data;
}

async function setUserInfo() {
    console.log('Setting user info');
    try {
        let userInfo = await getUserInfo();
        user = userInfo.user;
        if ( !user.banned ) {
            userID = user.id;
            loginContent.style.display = 'none';
            loading.style.display = 'none';
            if ( matchMakingStatus ) {
                matchMakingQueues.style.display = 'block';
                if ( !user.discord_id ) {
                    isCasual = true;
                    casualQueue.style.display = 'block';
                } else {
                    competitiveQueue.style.display = 'block';
                    casualQueue.style.display = 'block';
                }

                if ( userInfo.queData ) {
                    setQueueInfo(userInfo.queData);
                    for ( let queueButton of queueButtons ) {
                        queueButton.style.display = 'none';
                    }
                }

                if ( userInfo.readyData ) {
                    setReadyUp(userInfo.readyData);
                    for ( let queueButton of queueButtons ) {
                        queueButton.style.display = 'none';
                    }
                }
            }
        } else {
            window.location.href = '/profile?playerId=' + user.id;
        }
    } catch (error) {
        console.log(error);
        //window.location.href = '/';
        matchMakingQueues.style.display = 'none';
        loading.style.display = 'none';
    }
}

function setQueueInfo(queueData) {
    let timeStarted = Math.floor( queueData.timeQueStarted / 1000 );
    let timeNow = Math.floor(Date.now() / 1000);
    let timeElapsed = timeNow - timeStarted;
    queuedMatchMode = queueData.matchMode;
    timer = timeElapsed;
    queueInfo.style.display = 'block';
    mainTimer = window.setInterval(updateTimer, 1000);
}

async function getRecentMatches() {
    let data = {};
    let result = await getData('/matchHistory/GetRecentMatches');
    console.log(result);
    displayRecentMatches(result.data);
}

function displayRecentMatches(recentMatchData) {
    //let players = recentMatchData.users;
    //let matches = recentMatchData.recentMatches;
    let matches = recentMatchData;
    if ( matches.length > 0 ) {
        for ( let match of matches ) {
            try {
                let row = document.createElement('div');
                row.classList.add('match-row');

                let dateCell = document.createElement('div');
                dateCell.classList.add('match-date');
                let matchDate = match.unix_created_at;
                matchDate = new Date(matchDate);
                matchDate = matchDate.getTime();
                let timeNow = Math.floor(Date.now() / 1000);
                let timeElapsed = timeNow - matchDate;
                let readableTime = getReadableTime(timeElapsed);

                dateCell.append(readableTime);

                let matchupCell = document.createElement('div');
               // let players = await getMatchUsers( [match.player1_id, match.player2_id] );
                let player1 = match.player1_id;
                let player2 = match.player2_id;
                matchupCell.classList.add('matchup');

                let matchPlayer1 = document.createElement('a');
                matchPlayer1.href = '/profile?playerId=' + match.player1_id;
                matchPlayer1.classList.add('recent-matchup-player');
                matchPlayer1.classList.add('recent-matchup-player1');
                let matchPlayer2 = document.createElement('a');
                matchPlayer2.href = '/profile?playerId=' + match.player2_id;
                matchPlayer2.classList.add('recent-matchup-player');
                matchPlayer2.classList.add('recent-matchup-player2');

                let avatarPlayer1 = document.createElement('img')
                avatarPlayer1.classList.add('recent-matchup-avatar');
                let avatarPlayer2 = document.createElement('img');
                avatarPlayer2.classList.add('recent-matchup-avatar');

                if ( match.player1_discord_avatar_hash ) {
                    avatarPlayer1.src = 'https://cdn.discordapp.com/avatars/' + match.player1_discord_id + '/' + match.player1_discord_avatar_hash + '.jpg' + '?size=512';
                } else {
                    avatarPlayer1.src = '/assets/images/chumper.png';
                }

                if ( match.player2_discord_avatar_hash ) {
                    avatarPlayer2.src = 'https://cdn.discordapp.com/avatars/' + match.player2_discord_id + '/' + match.player2_discord_avatar_hash + '.jpg' + '?size=512';
                } else {
                    avatarPlayer2.src = '/assets/images/chumper.png';
                }

                let player1Name = document.createElement('div');
                player1Name.classList.add('recent-matchup-name');
                let player2Name = document.createElement('div');
                player2Name.classList.add('recent-matchup-name');

                let player1Score = document.createElement('div');
                player1Score.classList.add('recent-matchup-score');
                if ( match.ranked ) {
                    player1Score.innerHTML = match.player1_score;
                } else {
                    player1Score.innerHTML = `&ndash;`;
                }

                let player2Score = document.createElement('div');
                player2Score.classList.add('recent-matchup-score');
                if ( match.ranked ) {
                    player2Score.innerHTML = match.player2_score;
                } else {
                    player2Score.innerHTML = `&ndash;`;
                }

                switch ( match.result ) {
                    case 0:
                    case 1:
                    case 2:
                        //
                        break;
                    case 3:
                        // player 1 win
                        player1Score.classList.add('recent-matchup-victor');
                        break;
                    case 4:
                        // player 2 win
                        player2Score.classList.add('recent-matchup-victor');
                        break;
                    default:
                        //
                        break;
                }

                player1Name.innerHTML = sanitizeDisplayName( match.player1_username );
                player2Name.innerHTML = sanitizeDisplayName( match.player2_username );

                matchPlayer1.append(avatarPlayer1);
                matchPlayer1.append( player1Name );

                matchPlayer2.append(avatarPlayer2);
                matchPlayer2.append( player2Name );

                matchupCell.append( matchPlayer1 );
                matchupCell.append( player1Score );

                let matchLink = document.createElement('a');
                matchLink.href = '/game?matchID=' + match.id;

                let vsImg = document.createElement('img');
                vsImg.classList.add('recent-matchup-vs');
                vsImg.src = '/assets/images/vs-icon.png';

                matchLink.append(vsImg);

                //matchupCell.append('vs');
                matchupCell.append(matchLink);
                matchupCell.append( player2Score );
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
    let timeStarted = Math.floor( readyData.timeWaitingStarted / 1000 );
    let timeNow = Math.floor(Date.now() / 1000);
    let timeElapsed = timeNow - timeStarted;
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
    let time = secondsToHMS(timer);
    queueTimer.innerHTML = 'Finding Match... ' + time;    
}

function countdownTimer() {
    countdown -= 1;
    let time = secondsToMS(countdown);
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
            queueButton.style.display = 'block';
        }
    }
}

function clearTimer(intervalId) {
    timer = 0;
    let time = 0;
    countdown = PublicQueDatas[queuedMatchMode].readyTimer;
    clearInterval(intervalId);

    // Reset the timers
    time = secondsToHMS(timer);
    queueTimer.innerHTML = 'Finding Match... ' + time;

    time = secondsToMS(countdown);
    readyCountdown.innerHTML = time;
}

function secondsToHMS(d) {
    d = Number(d);

    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

function secondsToMS(d) {
    d = Number(d);

    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    return ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

function getReadableTime(time) {
    let returnTime;
    let timeUnit;
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
    let player = matchUsers.filter( (user) => user.id === playerId );
    return player;
}

async function reconnectSocket() {
    await setUserInfo();
    socket.connect();
    socket.emit('join', 'userRoom');
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

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}