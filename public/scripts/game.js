import { matchModes } from "../constants/matchData.js";
import { GetRank } from "../constants/rankData.js";

// Create variables for all the elements we need to interact with

// General elements
const matchContainer = document.getElementById('match-container');
const loading = document.getElementById('loading-message');
const requeueButton = document.getElementById('requeue-button');

// Player elements
const player1InGameName = document.getElementById('player1-in-game-name');
const player2InGameName = document.getElementById('player2-in-game-name');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const player1DiscordName = document.getElementById('player1-discord-name');
const player2DiscordName = document.getElementById('player2-discord-name');
const player1Avatar = document.getElementById('player1-avatar');
const player2Avatar = document.getElementById('player2-avatar');
const player1RankContent = document.getElementById('player1-rank');
const player1RankIcon = document.getElementById('player1-rank-icon');
const player2RankContent = document.getElementById('player2-rank');
const player2RankIcon = document.getElementById('player2-rank-icon');
const player1VictoryButton = document.getElementById('player1-victory-button');
const player2VictoryButton = document.getElementById('player2-victory-button');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const scoreContainers = document.getElementsByClassName('score-container');
const playerScores = document.getElementsByClassName('player-score');
const victoryButtons = document.getElementsByClassName('player-victory-button');
const leaveMatch = document.getElementById('leave-match-button');

const needHelp = document.getElementById('player-need-help');
const playerRaiseDispute = document.getElementById('player-raise-dispute-button');

const playerResolve = document.getElementById('player-resolve-content');
const playerResolveDispute = document.getElementById('player-resolve-dispute');

// Admin
const adminContent = document.getElementById('admin-content');
const adminDisputeOptions = document.getElementById('admin-dispute-options');
const adminResolveButton = document.getElementById('admin-resolve-dispute');

// Match options
const setLength = document.getElementById('set-length');
const turnTimer = document.getElementById('timer-duration');

// Stage elements
const stageList = document.getElementById('stages-list');
const stages = document.getElementsByClassName('stage');
const selectableStages = document.getElementsByClassName('stage-selectable');
const playingStage = document.getElementById('playing-stage');

// Messages
const confirmationMessage = document.getElementById('confirmation-message');
const gameMessage = document.getElementById('game-messages');

// Strike elements
const currentStrikerName = document.getElementById('current-striker');
const strikerSection = document.getElementById('striker-section');
const strikeContent = document.getElementById('strike-content');
const strikeInfo = document.getElementById('strike-info');
const strikeButton = document.getElementById('confirm-map-selection');

// Chat elements
const chatLog = document.getElementById('match-chat-log');
const chatForm = document.getElementById('match-chat-form');
const chatInput = document.getElementById('match-chat-input');
const chatSend = document.getElementById('match-chat-button');


var match;
var user = {};
var oppUser = {};

// Player
var userID = 0;
var username = '';
var userELO;
var userRank;

// Opponent
var oppID = 0;
var oppELO;
var oppRank;

var matchInfo = [];
var players = [];
var chat = [];
var games = [];
var casualMatch = false;

var strikes = [];
var stageStrikes = [];
var strikeAmount = 1;
var counterpickStrikeAmount;
var strikesRemaining = strikeAmount;
var currentStriker = 0;
var mapSelect = false;
var starters = [];
var counterpicks = [];
var pickingStage = false;

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

await setUserInfo();
await setMatchInfo();
// check if the match is in dispute on pageload for admins that come to check chat
await showModDispute();

// Set event listeners for interactable elements

// Stage selection event listener
for (let stage of stages ) {
    stage.addEventListener('click', (e) => {
        if ( currentStriker == userID ) {
            if ( stage.classList.contains('stage-selectable') ) {
                // Prevent toggle for new stages when you have no strikes remaining for that round of striking
                if ( strikesRemaining != 0 || stage.classList.contains('stage-selected') ) {
                    stage.classList.toggle('stage-selected');
                }
                var stageValue = parseInt(stage.getAttribute('stage-value'));

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

                if ( !pickingStage ) {
                    strikeInfo.innerHTML = strikesRemaining + ' stage strike' + ( strikesRemaining == 1 ? '' : 's' ) + ' remaining.';
                }
            }
        }
    });
}

// Victory button click listener
for (let victoryButton of victoryButtons ) {
    victoryButton.addEventListener('click', async (e) => {
        console.log('Marked victory for ' + victoryButton.value);
        // Send off the victory mark event for the selected player and wait for the other player to submit the victor
        var data = { winnerId: victoryButton.value };
        var response = await postData('/match/WinGame', data);
        console.log(response);
        if ( response == 201 ) {
            console.log('Winner was marked at least');
            confirmationMessage.innerHTML = 'Waiting for opponent to confirm the winner.';
            confirmationMessage.style.display = 'block';
            player1VictoryButton.style.display = 'none';
            player2VictoryButton.style.display = 'none';
        }
    });
}

// Chat send listener
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    var chatMessage = chatInput.value;
    console.log( 'Player is sending the message: ' + chatMessage );

    // Do front end validation/sanitization functions
    if ( validateChatMessage(chatMessage) ) {
        var data;
        if ( user.role == 2 ) {
            data = { matchId: matchId, message: chatMessage };
            var response = await postData('/admin/ModChatMessage', data);
        } else {
            data = { matchId: matchId, userId: userID, message: chatMessage };
            var response = await postData('/match/SendChatMessage', data);
        }
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
        var data = {};
        var response;
        if ( !mapSelect ) {
            data = { stages: stageStrikes };
            response = await postData('/match/StrikeStages', data);
        } else {
            data = { stage: stageStrikes[0] };
            response = await postData('/match/PickStage', data);
        }
        console.log(response);

        if ( response == 201 ) {
            stageStrikes = [];
        }

        // If strikes are accepted
    } else {
        alert('Invalid strikes. Please submit again.');
    }
});

adminResolveButton.addEventListener('click', async (e) => {
    var data = { matchId: matchId, resolveOption: parseInt(adminDisputeOptions.value) };
    var response = await postData('/admin/ResolveDispute', data);
    console.log(response);
    if ( response == 201 ) {
        adminContent.style.display = 'none';
    }
});

needHelp.addEventListener('click', async (e) => {
    playerRaiseDispute.style.display = 'inline-block';
});

playerRaiseDispute.addEventListener('click', async (e) => {
    var data = { userId: userID };
    var response = await postData('/match/Dispute', data);
    console.log(response);
    playerRaiseDispute.style.display = 'none';
});

playerResolveDispute.addEventListener('click', async (e) => {
    playerResolve.style.display = 'none';
    var response = await postData('/match/ResolveDispute');
    console.log(response);
    if ( response == 201 ) {
        // idk
    }
});

leaveMatch.addEventListener('click', async (e) => {
    if ( casualMatch ) {
        var data = {userId: userID};
        var response = await postData('/match/CasualMatchEnd', data);
        console.log(response);
        window.location.href = '/';
    }
});

// Page functions
async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}


async function setUserInfo() {
    var userInfo = await getUserInfo(userID);

    user = userInfo.user;
    username = user.username;
    userID = user.id;
}

async function getMatchInfo(matchId) {
    var data = {matchId: matchId};
    console.log(data);
    var result = await getData('/match/GetMatchInfo', data);
    matchInfo = result;
    console.log(matchInfo);
}

async function setMatchInfo() {
    await getMatchInfo(matchId);

    console.log(matchInfo);

    match = matchInfo.match;
    players = matchInfo.players;

    console.log('UserID ' + userID);
    if ( match.players[0].id == userID ) {
        oppID = match.players[1].id;
    } else {
        oppID = match.players[0].id;
    }
    console.log(oppID);

    chat = match.chat;
    starters = match.mode.rulesetData.starterStagesArr;
    counterpicks = match.mode.rulesetData.counterPickStagesArr;
    counterpickStrikeAmount = match.mode.rulesetData.counterPickBans;

    var player1DiscordId = players[0].discord_id;
    var player1DiscordAvatar = players[0].discord_avatar_hash;
    var player1ELO = players[0].g2_rating;
    var player1Rank = await GetRank(player1ELO);
    console.log(player1Rank);

    var player2DiscordId = players[1].discord_id;
    var player2DiscordAvatar  = players[1].discord_avatar_hash;
    var player2ELO = players[1].g2_rating;
    var player2Rank = await GetRank(player2ELO);
    console.log(player2Rank);

    var player1AvatarString = 'https://cdn.discordapp.com/avatars/' + player1DiscordId + '/' + player1DiscordAvatar + '.jpg' + '?size=512';
    var player2AvatarString = 'https://cdn.discordapp.com/avatars/' + player2DiscordId + '/' + player2DiscordAvatar + '.jpg' + '?size=512';

    if ( JSON.stringify(match.mode) === JSON.stringify(matchModes.casual) ) {
        casualMatch = true;
    }

    stageStrikes = match.gamesArr.at(-1).strikes;
    console.log(match);
    console.log(players);
    console.log('strikes');
    console.log(strikes);
    loading.style.display = 'none';
    matchContainer.style.display = 'block';
    playerResolve.style.display = 'none';

    player1InGameName.innerHTML = players[0].username;
    if ( players[0].discord_id ) {
        player1InGameName.href = '/profile?playerId=' + players[0].id;
        player1InGameName.setAttribute('target', '_blank');
        player1DiscordName.style.display = 'block';
        player1Name.innerHTML = players[0].discord_username;
        player1Avatar.src = player1AvatarString;
    }
    player1VictoryButton.value = players[0].id;
    player1Score.setAttribute('player-id', players[0].id);
    if ( !players[0].hide_rank ) {
        player1RankIcon.src = player1Rank.imageURL;
    }

    player2InGameName.innerHTML = players[1].username;
    if ( players[1].discord_id ) {
        player2InGameName.href = '/profile?playerId=' + players[1].id;
        player2InGameName.setAttribute('target', '_blank');
        player2DiscordName.style.display = 'block';
        player2Name.innerHTML = players[1].discord_username;
        player2Avatar.src = player2AvatarString;
    }
    player2VictoryButton.value = players[1].id;
    player2Score.setAttribute('player-id', players[1].id);
    if ( !players[1].hide_rank ) {
        player2RankIcon.src = player2Rank.imageURL;
    }

    setLength.innerHTML = 'Best of ' + bestOfSets[match.mode.rulesetData.setLength] + ' games';
    turnTimer.innerHTML = ( match.mode.rulesetData.turnTimer * 10 ) + ' seconds';

    addChatMessages(chat);
    if ( !casualMatch ) {
        setScores();
        setStages();
        setStrikes(stageStrikes);
        setStrikeAmount();
        setCurrentStriker();
        isPlayerStriker();

        switch(match.status) {
            case 1:
                startGame();
                break;
            case 2:
                //idk dispute?
                break;
            case 3:
                console.log('setting winner - player1');
                // player 1 win
                stageList.style.display = 'none';
                currentStrikerName.style.display = 'none';
                gameMessage.innerHTML = players[0].username + ' has won the match!';
                requeueButton.style.display = 'block';
                break;
            case 4:
                console.log('setting winner - player2');
                // player 2 win
                stageList.style.display = 'none';
                currentStrikerName.style.display = 'none';
                gameMessage.innerHTML = players[0].username + ' has won the match!';
                requeueButton.style.display = 'block';
                break;
            case 5:
                // No Winner
                break;
            default: 
        }
    } else {
        setCasualGame();
    }
}

// Grab all messages associated with the game and add them to the chat log
function addChatMessages(chat) {
    var amountMessages = chatLog.childElementCount;
    console.log('Adding messages: ' + JSON.stringify(chat));
    var i = 1;
    for ( const message of chat ) {
        if ( i > amountMessages ) {
            addMessage(message);
        }
        i++;
    }
}

async function addMessage(chatData) {
    console.log('Addming message');
    console.log(chatData);
    var userId = chatData.ownerId;
    var chatMessage = chatData.content;
    console.log(userId);
    console.log(chatMessage);
    var sentByCurrentPlayer = false;
    var senderName = '';
    var chatString = '';
    console.log('players');
    console.log(players);

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
        var modUser = await getModUser([userId]);
        // Admin message
        /*if ( matchInfo.user.id == userId && matchInfo.user.role == 2 ) {
            senderName = matchInfo.user.username + ' (Admin)';
        }*/
        senderName = modUser[0].username + ' (Moderator)';
        // idk who sent this
        // probably for mods
    }

    chatString = '<div class="match-chat-message"><span class="match-chat-player ' + ( sentByCurrentPlayer ? 'match-chat-current-player' : 'match-chat-opponent-player') + '">' + senderName + ':&nbsp;</span>' + chatMessage + '</div>'

    chatLog.insertAdjacentHTML( 'beforeend', chatString );

    chatLog.scrollTop = chatLog.scrollHeight;
}

function setScores() {
    for (let score of playerScores ) {
        score.innerHTML = 0
    }

    games = match.gamesArr;
    for ( let game of games ) {
        setWinner(game.winnerId);
    }
}

function setStages() {
    if (match.gamesArr.length > 1) {
        var currentStage = match.gamesArr.at(-1).stage;
        for( let counterpick of counterpicks ) {
            var stage = document.querySelectorAll('[stage-value="' + counterpick + '"]')[0];
            // If the stage hasn't been selected, remove all stage-stricken classes first
            // If the stage has been selected, strike everything except the selected stage
            if ( !currentStage ) {
                stage.classList.remove('stage-stricken');
            } else {
                if ( stage.getAttribute('stage-value') != currentStage ) {
                    stage.classList.add('stage-stricken');
                }
            }
            stage.classList.remove('stage-unselectable');
            stage.classList.add('stage-selectable');
        }
    } else {
        for ( let starter of starters ) {
            var stage = document.querySelectorAll('[stage-value="' + starter + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.remove('stage-unselectable');
            stage.classList.add('stage-selectable');
        }
    }
}

function resetStages() {
    if ( match.gamesArr.length > 1 ) {
        for ( let counterpick of counterpicks ) {
            var stage = document.querySelectorAll('[stage-value="' + counterpick + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.add('stage-selectable');
            stage.style.display = 'inline-block';
        }
    } else {
        for ( let starter of starters ) {
            var stage = document.querySelectorAll('[stage-value="' + starter + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.add('stage-selectable');
            stage.style.display = 'inline-block';
        }
    }
}

function setStrikes(receivedStrikes) {
    console.log('received strikes');
    console.log(receivedStrikes);
    for (let strike of receivedStrikes ) {
        console.log('strike array: ' + JSON.stringify(strikes));
        strikes.push(strike);
        //console.log('striking ' + strike);
        var stage = document.querySelectorAll('[stage-value="' + strike + '"]')[0];
        //console.log(stage);
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
    if ( matchInfo.match.gamesArr.length == 1 ) {
        // Figure out the current strike amount
        var strikeableStages = document.getElementsByClassName('stage-selectable');
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
    } else {
        strikeableStages = document.getElementsByClassName('stage-selectable');
        console.log(counterpicks.length);
        console.log(strikeableStages.length);
        // Rewrite this, this is dumb as hell
        if ( strikeableStages.length == counterpicks.length ) {
            strikeAmount = counterpickStrikeAmount;
            strikeButton.innerHTML = 'Confirm Strikes';
        } else {
            strikeAmount = 1;
            strikeButton.innerHTML = 'Select Map';
            mapSelect = true;
        }
        strikesRemaining = strikeAmount;
        strikeInfo.innerHTML = strikesRemaining + ' stage strike' + ( strikesRemaining == 1 ? '' : 's' ) + ' remaining.';
    }
}

function setCurrentStriker() {
    var strikeableStages = document.getElementsByClassName('stage-selectable');
    var oppUnpickableStages = [];
    var oppID;
    // TODO: Rewrite this whole function, this is horrible
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

    if ( match.gamesArr.length > 1 ) {
        currentStriker = match.gamesArr.at(-2).winnerId;
        if ( currentStriker == players[0].id ) {
            name = players[0].username;
            oppUnpickableStages = match.players[1].unpickableStagesArr;
            oppID = match.players[1].id;
        } else {
            name = players[1].username;
            oppUnpickableStages = match.players[0].unpickableStagesArr;
            oppID = match.players[0].id;
        }
    }

    currentStrikerName.innerHTML = name + ' is currently striking.';

    // Hide opponent's DSRs so you don't waste a strike
    setDSRStages(oppID);

    // If 12 stages remain, just set it to the other player, we have to select the game
    // Rewrite this too, this is awful
    if ( strikeableStages.length == (counterpicks.length - oppUnpickableStages.length - counterpickStrikeAmount) ) {
        if ( currentStriker == players[0].id ) {
            currentStriker = players[1].id;
            name = players[1].username;
        } else {
            currentStriker = players[0].id;
            name = players[0].username;
        }

        setDSRStages(currentStriker);

        pickingStage = true;

        currentStrikerName.innerHTML = name + ' is currently picking the map to play on.';
        strikeInfo.innerHTML = 'Select the map to play on.';
    }
}

function isPlayerStriker() {
    console.log(userID);
    console.log(currentStriker);
    if ( userID == currentStriker ) {
        gameMessage.style.display = 'none';
        strikeContent.style.display = 'block';
    } else {
        gameMessage.style.display = 'block';
        strikeContent.style.display = 'none';
    }
}

function setSelectedStage(selectedStage) {
    // Just mark every stage that wasn't selected as stricken
    for ( let stage of stages ) {
        if ( parseInt(stage.getAttribute('stage-value')) != selectedStage ) {
            stage.classList.add('stage-stricken');
        }
    }
}

function setDSRStages(currentStriker) {
    var unpickableStages = [];
    if ( players[0].id == currentStriker ) {
        unpickableStages = match.players[0].unpickableStagesArr;
    } else {
        unpickableStages = match.players[1].unpickableStagesArr;
    }

    console.log(unpickableStages);

    for ( let unpickableStage of unpickableStages ) {
        console.log('Force striking ' + unpickableStage);
        var stage = document.querySelectorAll('[stage-value="' + unpickableStage + '"]')[0];

        //console.log(stage);
        // Change the classes to remove selected stage from eligible selections
        if ( stage.classList.contains('stage-selected') )
            stage.classList.remove('stage-selected');
        stage.classList.remove('stage-selectable');
        stage.classList.add('stage-stricken');
    }
}

function setCasualGame() {
    stageList.style.display = 'none';
    playingStage.style.display = 'none';
    player1Score.style.display = 'none';
    player2Score.style.display = 'none';
    player1VictoryButton.style.display = 'none';
    player2VictoryButton.style.display = 'none';
    gameMessage.style.display = 'none';

    for ( let scoreContainer of scoreContainers ) {
        scoreContainer.style.display = 'none';
    }

    setLength.innerHTML = 'Unlimited games';
    turnTimer.innerHTML = 'Players may choose timer duration';
}

function startGame() {
    playingStage.innerHTML = 'This game will be played on';
    playingStage.style.display = 'block';
    strikerSection.style.display = 'none';
    strikeContent.style.display = 'none';
    playerResolve.style.display = 'none';

    var selectedStage = document.getElementsByClassName('stage-selected');
    if ( selectedStage.length > 0 )
        selectedStage[0].classList.remove('stage-selected');

    var strickenStages = document.getElementsByClassName('stage-stricken');
    for ( let stage of strickenStages ) {
        stage.style.display = 'none';
    }

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

async function nextGame(winnerId) {
    mapSelect = false;
    playingStage.style.display = 'none';
    confirmationMessage.style.display = 'none';
    player1VictoryButton.style.display = 'none';
    player2VictoryButton.style.display = 'none';
    currentStriker = winnerId;
    strikes = [];
    resetStages();
    strikerSection.style.display = 'block';
    strikeContent.style.display = 'block';
    console.log('Reset');
    console.log(matchInfo);
    setScores();
    setStrikeAmount();
    setCurrentStriker();
}

async function resetGame() {
    resetStages();
    setStrikeAmount();
    setCurrentStriker();
}

function gameFinish(winnerId) {
    setScores();
    // Do this one last time to update the score when we can't get new match data
    setWinner(winnerId);
    playingStage.style.display = 'none';
    player1VictoryButton.style.display = 'none';
    player2VictoryButton.style.display = 'none';
    stageList.style.display = 'none';
    strikerSection.style.display = 'block';
    currentStrikerName.style.display = 'none';

    if ( players[0].id == winnerId ) {
        name = players[0].username;
    } else {
        name = players[1].username;
    }

    confirmationMessage.style.display = 'none';
    gameMessage.style.display = 'block';

    gameMessage.innerHTML = name + ' has won the match!';
    requeueButton.style.display = 'block';
}

function showModDispute() {
    if ( user.role == 2 && match.status == 2 ) {
        adminContent.style.display = 'block';
    }
}

function showPlayerResolve() {
    playerResolve.style.display = 'block';
}

async function getModUser(users) {
    var data = { userIdList: users };
    var result = await getData('/user/GetUsers', data);
    return result;
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

socket.emit('join', 'match' + matchId);

socket.on('chatMessage', (chatData) => {
    console.log(chatData);
    addMessage(chatData);
});

socket.on('stageStrikes', (receivedStrikes) => {
    console.log('Striking stages');
    setStrikes(receivedStrikes);
    setStrikeAmount();
    setCurrentStriker();
    isPlayerStriker();

    var strikeableStages = document.getElementsByClassName('stage-selectable');

    if (strikeableStages.length == 1) {
        startGame();
    }
});

socket.on('stagePick', (selectedStage) => {
    console.log('Stage was selected!');
    console.log(selectedStage);
    setSelectedStage(selectedStage);
    startGame();
});

socket.on('playerConfirmedWin', (winnerId) => {
    console.log('Player ' + winnerId + ' has won the game!!!');
    console.log('Waiting for confirmation');
    //setWinner(winnerId);
    // Get the match info again to update the local match object
    //getMatchInfo(matchId);
    // Start the next game
    // Set winner to striker with 3 strikes
});

socket.on('gameWin', async (winnerId) => {
    // I guess check if the match is over before reseting the game state
    await setMatchInfo();
    await nextGame(winnerId);
    isPlayerStriker();
    //getMatchInfo(matchId);
    //setMatchInfo(matchId);
});

socket.on('matchWin', async (data) => {
    console.log('Match win socket!');
    console.log(data[0]);
    //await getMatchInfo(matchId);
    gameFinish(data[0]);
    // Unhide return to queue button
    // Do any final things
});

socket.on('matchEnd', async (data) => {
    alert('Your opponent has left the match.');
    requeueButton.style.display = 'block';
    leaveMatch.style.display = 'none';
});

socket.on('dispute', async () => {
    alert('There has been a dispute in match results. Please wait for a moderator to resolve the issue. If the dispute was made by accident, please press the resolve dispute button and properly mark the winner.');
    await setMatchInfo();
    await showModDispute();
    await showPlayerResolve();
    confirmationMessage.innerHTML = 'Please wait for a moderator to resolve the match dispute. If the dispute was made by accident, please press the resolve dispute button and properly mark the winner.';
    console.log(match);
});

socket.on('resolveDispute', async () => {
    alert('The dispute has been resolved.');
    await setMatchInfo();
    console.log(match);
    // If the game or the match has to be reset, go through the reset function
    // We'll check based on whether or not the strikes have been reset
    if ( match.gamesArr.at(-1).strikes.length == 0 ) {
        resetGame();
    }
});