// Create variables for all the elements we need to interact with
const matchContainer = document.getElementById('match-container');
const loading = document.getElementById('loading-message');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const player1VictoryButton = document.getElementById('player1-victory-button');
const player2VictoryButton = document.getElementById('player2-victory-button');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const playerScores = document.getElementsByClassName('player-score');
const setLength = document.getElementById('set-length');
const turnTimer = document.getElementById('timer-duration');
const selectableStages = document.getElementsByClassName('stage-selectable');
const gameMessage = document.getElementById('game-messages');
const playingStage = document.getElementById('playing-stage');
const currentStrikerName = document.getElementById('current-striker');
const strikerSection = document.getElementById('striker-section');
const strikeContent = document.getElementById('strike-content');
const strikeInfo = document.getElementById('strike-info');
const strikeButton = document.getElementById('confirm-map-selection');
const victoryButtons = document.getElementsByClassName('player-victory-button');
const chatLog = document.getElementById('match-chat-log');
const chatInput = document.getElementById('match-chat-input');
const chatSend = document.getElementById('match-chat-button');

var userID = 0;
var user = {};
var matchInfo = [];
var players = [];

var stageStrikes = [];
var strikeAmount = 1;
var strikesRemaining = strikeAmount;
var currentStriker = 0;

// Just the map for set length -> best of N
var bestOfSets = {
    1: 1,
    2: 3,
    3: 5,
    4: 7
};

const url = window.location.href;
const searchParams = new URL(url).searchParams;
const entries = new URLSearchParams(searchParams).entries();
const entriesArray = Array.from(entries);
const matchId = entriesArray[0][1];
console.log(matchId);

const socket = io();

setMatchInfo();

// Set event listeners for interactable elements

// Stage selection event listener
for (let stage of selectableStages ) {
    stage.addEventListener('click', (e) => {
        // Prevent toggle for new stages when you have no strikes remaining for that round of striking
        if ( strikesRemaining != 0 || stage.classList.contains('stage-selected') ) {
            stage.classList.toggle('stage-selected');
        }
        stageValue = parseInt(stage.getAttribute('stage-value'));

        // Add/Remove stage from the list of strikes that will be sent off to the server when the confirm strikes button is selected
        var i = stageStrikes.indexOf( stageValue );
        console.log(i);
        if ( i === -1 ) {
            // Don't go into negative strikes
            if ( strikesRemaining > 0 ) {
                strikesRemaining = strikesRemaining - 1;
                stageStrikes.push( stageValue );
            }
        } else {
            strikesRemaining = strikesRemaining + 1;
            stageStrikes.splice(i,1);
        }

        strikeInfo.innerHTML = strikesRemaining + ' stage strike' + ( strikesRemaining == 1 ? '' : 's' ) + ' remaining.';
    });
}

// Victory button click listener
for (let victoryButton of victoryButtons ) {
    victoryButton.addEventListener('click', (e) => {
        console.log('Marked victory for ' + victoryButton.value);
        // Send off the victory mark event for the selected player and wait for the other player to submit the victor
        data = { winnerId: victoryButton.value };
        response = postData('/match/WinGame', data);
        if ( response == 201 ) {
            console.log('Winner was marked at least');
        }
    });
}

// Chat send listener
chatSend.addEventListener('click', async (e) => {
    var chatMessage = chatInput.value;
    console.log( 'Player is sending the message: ' + chatMessage );

    // Do front end validation/sanitization functions
    if ( validateChatMessage(chatMessage) ) {
        data = { userId: userID, message: chatMessage };
        response = await postData('/match/SendChatMessage', data);
        console.log('chat message send response: ' + response);

        if ( response == 201 ) {
            // If the message is accepted by the server
            chatInput.value = '';
        }
    } else {
        alert('Your message can\'t be sent. Please try again.');
    }
});

// Confirm strikes/Select map to play on listener
strikeButton.addEventListener('click', async (e) => {
    console.log(stageStrikes);
    if ( validateStrikes(stageStrikes, strikeAmount) ) {
        data = { stages: stageStrikes };
        response = await postData('/match/StrikeStages', data);
        console.log(response);

        if ( response == 201 ) {
            stageStrikes = [];
        }

        // If strikes are accepted
    } else {
        alert('Invalid strikes. Please submit again.');
    }
});

// Page functions
async function getMatchInfo(matchId) {
    data = {matchId: matchId};
    console.log(data);
    result = await getData('/match/GetMatchInfo', data);
    matchInfo = result;
    console.log(matchInfo);
}

async function setMatchInfo() {
    await getMatchInfo(matchId);

    match = matchInfo.match;
    players = matchInfo.players;
    user = matchInfo.user;
    userID = user.id;
    chat = match.chat;
    strikes = match.gamesArr.at(-1).strikes;
    console.log(match);
    console.log(players);
    console.log(strikes);
    loading.style.display = 'none';
    matchContainer.style.display = 'block';
    player1Name.innerHTML = player1Name.innerHTML + players[0].username;
    player1VictoryButton.value = players[0].id;
    player1Score.setAttribute('player-id', players[0].id);
    player2Name.innerHTML = player2Name.innerHTML + players[1].username;
    player2VictoryButton.value = players[1].id;
    player2Score.setAttribute('player-id', players[1].id);
    setLength.innerHTML = setLength.innerHTML + bestOfSets[match.mode.rulesetData.setLength] + ' games';
    turnTimer.innerHTML = turnTimer.innerHTML + ( match.mode.rulesetData.turnTimer * 10 ) + ' seconds';

    addChatMessages(chat);
    setStrikes(strikes);
    setStrikeAmount();
    setCurrentStriker();
    isPlayerStriker();
}

// Grab all messages associated with the game and add them to the chat log
function addChatMessages(chat) {
    for ( const message of chat ) {
        addMessage(message['ownerId'], message['content']);
    }
}

function addMessage(userId, chatMessage) {
    var sentByCurrentPlayer = false;
    var senderName = '';
    var chatString = '';

    // Check if the incoming message is from the current user to set the sender color
    if ( userId == user.id ) {
        sentByCurrentPlayer = true;
    }

    // Get the sender username
    if ( players[0].id == userId ) {
        senderName = players[0].username;
    } else if ( players[1].id == userId ) {
        senderName = players[1].username;
    } else {
        // idk who sent this
        // probably for mods
    }

    chatString = '<div class="match-chat-message"><span class="match-chat-player ' + ( sentByCurrentPlayer ? 'match-chat-current-player' : 'match-chat-opponent-player') + '">' + senderName + ':&nbsp;</span>' + chatMessage + '</div>'

    chatLog.insertAdjacentHTML( 'beforeend', chatString );

    chatLog.scrollTop = chatLog.scrollHeight;
}

function setStrikes(receivedStrikes) {
    for (let strike of receivedStrikes ) {
        strikes.push(strike);
        console.log('striking ' + strike);
        stage = document.querySelectorAll('[stage-value="' + strike + '"]')[0];
        console.log(stage);
        // Change the classes to remove selected stage from eligible selections
        if ( stage.classList.contains('stage-selected') )
            stage.classList.remove('stage-selected');
        stage.classList.remove('stage-selectable');
        stage.classList.add('stage-stricken');
    }
    // Reset the local strike array after setting all the strikes
    stageStrikes = [];
}

function setStrikeAmount() {
    // Figure out the current strike amount
    strikeableStages = document.getElementsByClassName('stage-selectable');
    /*if ( strikeableStages.length == 4 ) {
        strikeAmount = 2;
    } else {
        strikeAmount = 1;
    }*/
    strikeAmount = (strikes.length + 1) % 4;
    // Maybe I'm just dumb, I cannot get the mod logic to work correctly for the very last strike whether I count the amount of already stricken stages or the amount of stages remaining
    if ( strikeableStages.length == 2 )
        strikeAmount = 1;
    strikesRemaining = strikeAmount;
    strikeInfo.innerHTML = strikesRemaining + ' stage strike' + ( strikesRemaining == 1 ? '' : 's' ) + ' remaining.';
}

function setCurrentStriker() {
    strikeableStages = document.getElementsByClassName('stage-selectable');
    if ( strikeableStages.length == 5 ) {
        currentStriker = players[0].id;
        name = players[0].username;
    }

    if ( strikeableStages.length == 4 ) {
        currentStriker = players[1].id;
        name = players[1].username;
    }

    if ( strikeableStages.length == 2 ) {
        currentStriker = players[0].id;
        name = players[0].username;
    }

    currentStrikerName.innerHTML = name + ' is currently striking.';
}

function isPlayerStriker() {
    if ( userID == currentStriker ) {
        gameMessage.style.display = 'none';
        strikeContent.style.display = 'block';
    } else {
        gameMessage.style.display = 'block';
        strikeContent.style.display = 'none';
    }
}

function startGame() {
    playingStage.innerHTML = 'This game will be played on';
    playingStage.style.display = 'block';
    strikerSection.style.display = 'none';
    strikeContent.style.display = 'none';

    for (let victoryButton of victoryButtons ) {
        victoryButton.style.display = 'inline-block';
    }
}

function setWinner(winnerId) {
    for (let score of playerScores ) {
        console.log(score);
        console.log(score.getAttribute('player-id'));
        if ( score.getAttribute('player-id') == winnerId ) {
            score.innerHTML = parseInt(score.innerHTML) + 1;
        }
    }
}

// Strike validation
function validateStrikes(strikes, strikeAmount) {
    if ( strikes.length != strikeAmount ) {
        return false;
    } else {
        return true;
    }
}

// Chat validation

function validateChatMessage(chatMessage) {
    // Simple validation to check the message isn't blank for now
    if ( chatMessage === '' ) {
        return false;
    }

    return true;
}

// SOCKET FUNCTIONS

socket.emit('join', 'match' + matchId.toString());

socket.on('chatMessage', (userId, chatMessage) => {
    addMessage(userId, chatMessage);
});

socket.on('stageStrikes', (receivedStrikes) => {
    console.log('Striking stages');
    setStrikes(receivedStrikes);
    setStrikeAmount();
    setCurrentStriker();
    isPlayerStriker();

    if (strikeableStages.length == 1) {
        startGame();
    }
});

socket.on('gameWin', (winnerId) => {
    console.log('Player ' + winnerId + ' has won the game!!!');
    setWinner(winnerId);
    // Get the match info again to update the local match object
    getMatchInfo(matchId);
    // Start the next game
    // Set winner to striker with 3 strikes
});