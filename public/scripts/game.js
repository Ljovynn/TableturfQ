// Create variables for all the elements we need to interact with
const matchContainer = document.getElementById('match-container');
const loading = document.getElementById('loading-message');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const setLength = document.getElementById('set-length');
const turnTimer = document.getElementById('timer-duration');
const selectableStages = document.getElementsByClassName('stage-selectable');
const strikeButton = document.getElementById('confirm-map-selection');
const victoryButtons = document.getElementsByClassName('player-victory-button');
const chatInput = document.getElementById('match-chat-input');
const chatSend = document.getElementById('match-chat-button');

var matchInfo = [];
var players = [];

var strikes = [];
var strikeAmount = 1;

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

setMatchInfo();

// Set event listeners for interactable elements

// Stage selection event listener
for (let stage of selectableStages ) {
    stage.addEventListener('click', (e) => {
        stage.classList.toggle('stage-selected');

        // Add/Remove stage from the list of strikes that will be sent off to the server when the confirm strikes button is selected
        var i = strikes.indexOf(stage.id);
        if ( i === -1 ) {
            strikes.push(stage.id);
        } else {
            strikes.splice(i,1);
        }
        
    });
}

// Victory button click listener
for (let victoryButton of victoryButtons ) {
    victoryButton.addEventListener('click', (e) => {
        console.log('Marked victory for ' + victoryButton.value);
        // Send off the victory mark event for the selected player and wait for the other player to submit the victor
        data = { gameWinner: victoryButton.value };
        response = postData('/WinGame', data);
    });
}

// Chat send listener
chatSend.addEventListener('click', (e) => {
    var chatMessage = chatInput.value;
    console.log( 'Player is sending the message: ' + chatMessage );

    // Do front end validation/sanitization functions
    if ( validateChatMessage(chatMessage) ) {
        data = { message: chatMessage };
        response = postData('/SendChatMessage', data);

        // If the message is accepted by the server
        chatInput.value = '';
    } else {
        alert('Your message can\'t be sent. Please try again.');
    }
});

// Confirm strikes/Select map to play on listener
strikeButton.addEventListener('click', (e) => {
    console.log(strikes);
    if ( validateStrikes(strikes, strikeAmount) ) {
        data = { strikes };
        response = postData('/StrikeStages', data);
        console.log(response);

        // If strikes are accepted
        strikes = [];
        var selectedStages = document.getElementsByClassName('stage-selected');
        for (let stage of selectedStages ) {
            // Change the classes to remove selected stage from eligible selections
            stage.classList.remove('stage-selected');
            stage.classList.remove('stage-selectable');
            stage.classList.add('stage-stricken');
        } 
    } else {
        alert('Invalid strikes. Please submit again.');
    }
});

// Page functions
async function getMatchInfo(matchId) {
    data = {matchId: matchId};
    console.log(data);
    result = await getData('/GetMatchInfo', data);
    matchInfo = result;
    console.log(matchInfo);
}

async function setMatchInfo() {
    await getMatchInfo(matchId);

    match = matchInfo.match;
    players = matchInfo.players;
    console.log(match);
    console.log(players);
    loading.style.display = 'none';
    matchContainer.style.display = 'block';
    player1Name.innerHTML = player1Name.innerHTML + players[0].username;
    player2Name.innerHTML = player2Name.innerHTML + players[1].username;
    setLength.innerHTML = setLength.innerHTML + bestOfSets[match.mode.rulesetData.setLength] + ' games';
    turnTimer.innerHTML = turnTimer.innerHTML + ( match.mode.rulesetData.turnTimer * 10 ) + ' seconds';
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