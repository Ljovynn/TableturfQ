// Create variables for all the elements we need to interact with
const selectableStages = document.getElementsByClassName('stage-selectable');
const strikeButton = document.getElementById('confirm-map-selection');
const victoryButtons = document.getElementsByClassName('player-victory-button');
const chatInput = document.getElementById('match-chat-input');
const chatSend = document.getElementById('match-chat-button');

var strikes = [];
var strikeAmount = 1;

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