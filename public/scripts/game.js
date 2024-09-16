import { matchModes, rulesets } from "../constants/matchData.js";
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
const player1RankLabel = document.getElementById('player1-rank-label');
const player2RankContent = document.getElementById('player2-rank');
const player2RankIcon = document.getElementById('player2-rank-icon');
const player2RankLabel = document.getElementById('player2-rank-label');
const player1VictoryButton = document.getElementById('player1-victory-button');
const player2VictoryButton = document.getElementById('player2-victory-button');
const player1Score = document.getElementById('player1-score');
const player1ScoreMobile = document.getElementById('player1-score-mobile');
const player2Score = document.getElementById('player2-score');
const player2ScoreMobile = document.getElementById('player2-score-mobile');
const scoreContainers = document.getElementsByClassName('score-container');
const playerScores = document.getElementsByClassName('player-score');
const victoryButtons = document.getElementsByClassName('player-victory-button');
const leaveMatch = document.getElementById('leave-match-button');
const toggleContent = document.getElementById('toggle-content');

const matchContent = document.getElementById('match-content');

const needHelp = document.getElementById('player-need-help');
const playerRaiseDispute = document.getElementById('player-raise-dispute-button');

const playerResolve = document.getElementById('player-resolve-content');
const playerResolveDispute = document.getElementById('player-resolve-dispute');

const toggleMatchChat = document.getElementById('toggle-match-chat');
const toggleMatchStrikes = document.getElementById('toggle-match-strikes');
const notifications = document.getElementsByClassName('notification-icon');

// Admin
const adminContent = document.getElementById('admin-content');
const adminDisputeOptions = document.getElementById('admin-dispute-options');
const adminResolveButton = document.getElementById('admin-resolve-dispute');

const adminPlayer1 = document.getElementById('admin-player1');
const adminPlayer2 = document.getElementById('admin-player2');
const adminBanPlayer1Content = document.getElementById('admin-ban-player1-content');
const adminBanPlayer1Button = document.getElementById('admin-ban-player1-button');
const adminUnbanPlayer1Content = document.getElementById('admin-unban-player1-content');
const adminUnbanPlayer1Button = document.getElementById('admin-unban-player1-button');
const adminBanPlayer1Details = document.getElementById('admin-ban-player1-details');
const adminBanPlayer1Length = document.getElementById('admin-ban-player1-length');
const adminBanPlayer1Reason = document.getElementById('admin-ban-player1-reason');

const adminBanPlayer2Content = document.getElementById('admin-ban-player2-content');
const adminBanPlayer2Button = document.getElementById('admin-ban-player2-button');
const adminUnbanPlayer2Content = document.getElementById('admin-unban-player2-content');
const adminUnbanPlayer2Button = document.getElementById('admin-unban-player2-button');
const adminBanPlayer2Details = document.getElementById('admin-ban-player2-details');
const adminBanPlayer2Length = document.getElementById('admin-ban-player2-length');
const adminBanPlayer2Reason = document.getElementById('admin-ban-player2-reason');

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
const matchStrikeContent = document.getElementById('match-strike-content');
const currentStrikerName = document.getElementById('current-striker');
const strikerSection = document.getElementById('striker-section');
const strikeContent = document.getElementById('strike-content');
const strikeInfo = document.getElementById('strike-info');
const strikeButton = document.getElementById('confirm-map-selection');

// Chat elements
const matchChatContent = document.getElementById('match-chat-content');
const chatLog = document.getElementById('match-chat-log');
const chatForm = document.getElementById('match-chat-form');
const chatInput = document.getElementById('match-chat-input');
const chatSend = document.getElementById('match-chat-button');

// Modal Elements
const overlay = document.querySelector(".overlay");
const qualifierModal = document.getElementById('qualifier-modal');
const qualifierImage = document.getElementById('qualifier-image');
const qualifierName = document.getElementById('qualifier-name');
const closeModalBtn = document.getElementById('qualifier-close');

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
var privateMatch = false;

var loadingMessages = false;

// Suppress the opponent left socket if the current user is the one who left the match
var userLeft = false;

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
await showAdminDispute();
await showAdminBanInfo();

// Set event listeners for interactable elements

// Stage selection event listener
for (let stage of stages ) {
    stage.addEventListener('click', (e) => {
        if ( currentStriker == userID ) {
            if ( stage.classList.contains('stage-selectable') ) {
                // Prevent toggle for new stages when you have no strikes remaining for that round of striking
                /*if ( strikesRemaining != 0 || stage.classList.contains('stage-selected') ) {
                    stage.classList.toggle('stage-selected');
                }*/
                let stageValue = parseInt(stage.getAttribute('stage-value'));

                // Add/Remove stage from the list of strikes that will be sent off to the server when the confirm strikes button is selected
                let i = stageStrikes.indexOf( stageValue );
                if ( i === -1 ) {
                    // Don't go into negative strikes
                    if ( strikesRemaining > 0 ) {
                        strikesRemaining = strikesRemaining - 1;
                    } else{
                        stages[stageStrikes[0] - 1].classList.remove('stage-selected');
                        stageStrikes.shift();
                    }
                    stage.classList.add('stage-selected');
                    stageStrikes.push( stageValue );
                } else {
                    strikesRemaining = strikesRemaining + 1;
                    stage.classList.remove('stage-selected');
                    stageStrikes.splice(i,1);
                }

                if ( !pickingStage ) {
                    if ( strikesRemaining > 0 ) {
                        strikeInfo.innerHTML = 'Strike <span class="strike-counter">' + strikesRemaining + '</span> stage' + ( strikesRemaining == 1 ? '' : 's' ) + ' you do not want to play on.';
                    } else {
                        strikeInfo.innerHTML = 'Confirm your stage strikes.';
                    }
                }
            }
        }
    });

    stage.addEventListener('touchstart', (e) => {
        stage.classList.toggle('mobile-selected');
        stage.classList.add('touch-hover');
    });
    stage.addEventListener('touchend', (e) => {
        stage.classList.remove('touch-hover');
    })
}

// Victory button click listener
for (let victoryButton of victoryButtons ) {
    victoryButton.addEventListener('click', async (e) => {
        console.log('Marked victory for ' + victoryButton.value);
        // Send off the victory mark event for the selected player and wait for the other player to submit the victor
        let data = { winnerId: victoryButton.value };
        let response = await postData('/match/WinGame', data);
        console.log(response);
        if ( response.code == 201 ) {
            console.log('Winner was marked at least');
            //confirmationMessage.style.display = 'block';
            player1VictoryButton.style.display = 'none';
            player2VictoryButton.style.display = 'none';
            //confirmationMessage.innerHTML = 'Waiting for opponent to confirm the winner.';
        }
    });
}

toggleMatchChat.addEventListener('click', async (e) => {
    if ( !toggleMatchChat.classList.contains('active') ) {
        toggleMatchChat.classList.toggle('active');
        toggleMatchStrikes.classList.toggle('active');
        matchChatContent.classList.toggle('untoggled');
        matchStrikeContent.classList.toggle('untoggled');
        removeNotifications();
        chatInput.focus();
    }
});

toggleMatchStrikes.addEventListener('click', async (e) => {
    if ( !toggleMatchStrikes.classList.contains('active') ) {
        toggleMatchChat.classList.toggle('active');
        toggleMatchStrikes.classList.toggle('active');
        matchChatContent.classList.toggle('untoggled');
        matchStrikeContent.classList.toggle('untoggled');
        removeNotifications();
    }
});

// Chat send listener
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let chatMessage = sanitizeInput( chatInput.value );
    console.log( 'Player is sending the message: ' + chatMessage );
    let response = null;

    // Do front end validation/sanitization functions
    if ( validateChatMessage(chatMessage) ) {
        let data;
        if ( user.role == 2 ) {
            data = { matchId: matchId, message: chatMessage };
            response = await postData('/admin/ModChatMessage', data);
        } else {
            data = { matchId: matchId, userId: userID, message: chatMessage };
            response = await postData('/match/SendChatMessage', data);
        }
        console.log('chat message send response: ' + response);

        if ( response.code == 201 ) {
            // If the message is accepted by the server
            chatInput.value = '';
        }
    } else {
        alert('Your message can\'t be sent. Please try again.');
    }
});

chatLog.addEventListener('scroll', async (e) => {
    console.log(chatLog.scrollTop);
    if ( chatLog.scrollTop <= 10 ) {
        if ( !loadingMessages ) {
            loadingMessages = true;
            console.log('trying to load new messages!');
            let response = await getChatMessages(matchId, chatLog.childElementCount);
            console.log(response);
            if ( response ) {
                response = response.reverse();
                await addChatMessages(response, true);
            }
        }
    }
});

// Confirm strikes/Select map to play on listener
strikeButton.addEventListener('click', async (e) => {
    console.log(stageStrikes);
    if ( validateStrikes(stageStrikes, strikeAmount) ) {
        let data = {};
        let response;
        if ( !mapSelect ) {
            data = { stages: stageStrikes };
            response = await postData('/match/StrikeStages', data);
        } else {
            data = { stage: stageStrikes[0] };
            response = await postData('/match/PickStage', data);
        }
        console.log(response);

        if ( response.code == 201 ) {
            stageStrikes = [];
        }

        // If strikes are accepted
    } else {
        alert('Invalid strikes. Please submit again.');
    }
});

needHelp.addEventListener('click', async (e) => {
    playerRaiseDispute.style.display = 'inline-block';
});

playerRaiseDispute.addEventListener('click', async (e) => {
    if ( !privateMatch ) {
        let data = { userId: userID };
        let response = await postData('/match/Dispute', data);
        console.log(response);
        playerRaiseDispute.style.display = 'none';
    }
});

playerResolveDispute.addEventListener('click', async (e) => {
    playerResolve.style.display = 'none';
    let response = await postData('/match/ResolveDispute');
    console.log(response);
    if ( response.code == 201 ) {
        // idk
    }
});

leaveMatch.addEventListener('click', async (e) => {
    if ( casualMatch || privateMatch ) {
        userLeft = true;
        let data = {userId: userID};
        let response = await postData('/match/CasualMatchEnd', data);
        console.log(response);
        window.location.href = '/';
    } else {
        if ( window.confirm('Are you sure you want to leave the match? It will be considered a forfeit and result in a loss.') ) {
            userLeft = true;
            let data = { userId: userID };
            let response = await postData('/match/ForfeitMatch', data);
            console.log(response);
            window.location.href = '/';
        }
    }
});

closeModalBtn.addEventListener('click', (e) => {
    qualifierModal.classList.add('hidden');
    overlay.classList.add('hidden');
});

// Admin actions
if ( user.role== 2 ) {
    adminResolveButton.addEventListener('click', async (e) => {
        let data = { matchId: matchId, resolveOption: parseInt(adminDisputeOptions.value) };
        let response = await postData('/admin/ResolveDispute', data);
        console.log(response);
        if ( response.code == 201 ) {
            adminContent.style.display = 'none';
        }
    });

    adminBanPlayer1Button.addEventListener('click', async (e) => {
        let data = { bannedUserId: players[0].id, banLength: parseInt(adminBanPlayer1Length.value), reason: adminBanPlayer1Reason.value };
        let response = await postData('/admin/BanUser', data);
        if ( response.code == 201 ) {
            adminBanPlayer1Content.style.display = 'none';
            adminUnbanPlayer1Content.style.display = 'block';
        }
    });

    adminUnbanPlayer1Button.addEventListener('click', async (e) => {
        let data = { unbannedUserId: players[0].id };
        let response = await postData('/admin/UnbanUser', data);
        if ( response.code == 201 ) {
            adminBanPlayer1Content.style.display = 'block';
            adminUnbanPlayer1Content.style.display = 'none';
        }
    });

    adminBanPlayer2Button.addEventListener('click', async (e) => {
        let data = { bannedUserId: players[1].id, banLength: parseInt(adminBanPlayer2Length.value), reason: adminBanPlayer2Reason.value };
        let response = await postData('/admin/BanUser', data);
        if ( response.code == 201 ) {
            adminBanPlayer2Content.style.display = 'none';
            adminUnbanPlayer2Content.style.display = 'block';
        }
    });

    adminUnbanPlayer2Button.addEventListener('click', async (e) => {
        let data = { unbannedUserId: players[1].id };
        let response = await postData('/admin/UnbanUser', data);
        if ( response.code == 201 ) {
            adminBanPlayer2Content.style.display = 'block';
            adminUnbanPlayer2Content.style.display = 'none';
        }
    });
}

// Page functions
async function getUserInfo() {
    let data = {};
    let result = await getData('/user/GetUserInfo');
    return result;
}


async function setUserInfo() {
    try {
        let userInfo = await getUserInfo(userID);

        user = userInfo.data.user;
        username = sanitizeInput( user.username );
        userID = user.id;
        userELO = user.g2_rating;

    } catch (error) {
        await getMatchInfo(matchId);
        match = matchInfo.match;
        console.log(matchModes[match.mode]);
        counterpicks = rulesets[ matchModes[match.mode] ].counterPickStagesArr;
        chatForm.style.display = 'none';
        chatLog.style.display = 'none';
        console.log(match);
        if ( match.status != 3 && match.status != 4 ) {
            window.location.href = '/';  
        }
    }
}

async function getMatchInfo(matchId) {
    let data = {matchId: matchId};
    console.log(data);
    let result = await postData('/match/GetMatchInfo', data);
    matchInfo = result.data;
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

    starters = rulesets[ matchModes[match.mode] ].starterStagesArr;
    counterpicks = rulesets[ matchModes[match.mode] ].counterPickStagesArr;
    counterpickStrikeAmount = rulesets[ matchModes[match.mode] ].counterPickBans;
    privateMatch = match.privateBattle;
    chat = match.chat;

    let player1DiscordId = null;
    let player1DiscordAvatar = null;
    let player1ELO = null;
    let player1Rank = null;

    let player2DiscordId = null;
    let player2DiscordAvatar = null;
    let player2ELO = null;
    let player2Rank = null;

    try {
         player1DiscordId = players[0].discord_id;
         player1DiscordAvatar = players[0].discord_avatar_hash;
         player1ELO = players[0].g2_rating;
         player1Rank = GetRank(player1ELO);
        console.log(player1Rank);
    } catch (error) {
        // Set Deleted player 1 stuff
    }

    try {
         player2DiscordId = players[1].discord_id;
         player2DiscordAvatar  = players[1].discord_avatar_hash;
         player2ELO = players[1].g2_rating;
         player2Rank = GetRank(player2ELO);
        console.log(player2Rank);
    } catch (error) {
        // Set Deleted player 2 stuff
    }

    let countryElement;

    let player1AvatarString = 'https://cdn.discordapp.com/avatars/' + player1DiscordId + '/' + player1DiscordAvatar + '.jpg' + '?size=512';
    let player2AvatarString = 'https://cdn.discordapp.com/avatars/' + player2DiscordId + '/' + player2DiscordAvatar + '.jpg' + '?size=512';

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

    try {
        if ( players[0].country ) {
            countryElement = `<img src="https://flagcdn.com/w20/${players[0].country}.png" />&nbsp;`;
        } else {
            countryElement = '';
        }

        player1InGameName.innerHTML = countryElement + sanitizeInput( players[0].username );
        if ( players[0].discord_id ) {
            player1InGameName.href = '/profile?playerId=' + players[0].id;
            player1InGameName.setAttribute('target', '_blank');
            player1DiscordName.style.display = 'block';
            player1Name.innerHTML = sanitizeInput( players[0].discord_username );
            player1Avatar.src = player1AvatarString;
        }
        player1VictoryButton.value = players[0].id;
        player1Score.setAttribute('player-id', players[0].id);
        player1ScoreMobile.setAttribute('player-id', players[0].id);
        player1RankIcon.src = player1Rank.imageURL;
        player1RankLabel.innerHTML = player1Rank.name;
    } catch (error) {
        console.log(error);
        // deleted player 1 country
        player1InGameName.innerHTML = 'Deleted User';
    }

    try {
        if ( players[1].country ) {
                countryElement = `<img src="https://flagcdn.com/w20/${players[1].country}.png" />&nbsp;`;
        } else {
            countryElement = '';
        }

        player2InGameName.innerHTML = countryElement + sanitizeInput( players[1].username );
        if ( players[1].discord_id ) {
            player2InGameName.href = '/profile?playerId=' + players[1].id;
            player2InGameName.setAttribute('target', '_blank');
            player2DiscordName.style.display = 'block';
            player2Name.innerHTML = sanitizeInput( players[1].discord_username );
            player2Avatar.src = player2AvatarString;
        }
        player2VictoryButton.value = players[1].id;
        player2Score.setAttribute('player-id', players[1].id);
        player2ScoreMobile.setAttribute('player-id', players[1].id);
        player2RankIcon.src = player2Rank.imageURL;
        player2RankLabel.innerHTML = player2Rank.name;
    } catch (error) {
        console.log(error);
        // deleted player 2 country
        player2InGameName.innerHTML = 'Deleted User';
    }

    setLength.innerHTML = 'Best of ' + bestOfSets[match.setLength] + ' games';
    turnTimer.innerHTML = ( rulesets[ matchModes[match.mode] ].turnTimer * 10 ) + ' seconds';

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
                setSelectedStage(match.gamesArr.at(-1).stage);
                break;
            case 2:
                //idk dispute?
                await showAdminDispute();
                await showPlayerResolve();
                break;
            case 3:
                console.log('setting winner - player1');
                // player 1 win
                stageList.style.display = 'none';
                currentStrikerName.style.display = 'none';
                strikeContent.style.display = 'none';
                gameMessage.innerHTML = sanitizeInput( players[0].username ) + ' has won the match!';
                requeueButton.style.display = 'block';
                confirmationMessage.style.display = 'none';
                break;
            case 4:
                console.log('setting winner - player2');
                // player 2 win
                stageList.style.display = 'none';
                currentStrikerName.style.display = 'none';
                strikeContent.style.display = 'none';
                gameMessage.innerHTML = sanitizeInput( players[1].username ) + ' has won the match!';
                requeueButton.style.display = 'block';
                confirmationMessage.style.display = 'none';
                break;
            case 5:
                // No Winner
                break;
            default: 
        }
    } else {
        setCasualGame();
    }
    checkPrivateMatch();
    checkMatchOver();
    checkPlayerStatus();
}

async function getChatMessages(matchId, amountMessages) {
    let data = { matchId: matchId, loadedMessagesAmount: amountMessages };
    let response = await postData('/match/LoadChatMessages', data);
    console.log(response);
    loadingMessages = false;
    return response.data;
}

// Grab all messages associated with the game and add them to the chat log
async function addChatMessages(chat, prepend = false) {
    console.log(chat);
    console.log(prepend);
    console.log('Adding messages: ' + JSON.stringify(chat));
    let amountMessages = chatLog.childElementCount;
    let i;
    if ( !prepend ) {
        i = 1;
    } else {
        i = amountMessages + 1;
    }
    for ( const message of chat ) {
        console.log(i);
        console.log(amountMessages);
        if ( i > amountMessages ) {
            let messageString = await getMessageString(message);
            console.log(messageString);
            if ( !prepend ) {
                console.log('adding message');
                await addMessage(messageString);
            } else {
                console.log('prepending message');
                await prependMessage(messageString);
            }
        }
        i++;
    }
}

async function addMessage(chatString) {
    chatLog.insertAdjacentHTML( 'beforeend', chatString );
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function prependMessage(chatString) {
    let chatMessage = document.createElement('div');
    console.log(chatMessage);
    chatMessage.innerHTML = chatString.trim();
    console.log(chatMessage);
    chatLog.insertBefore( chatMessage.firstChild, chatLog.firstChild );
}

async function getMessageString(chatData) {
    console.log('Adding message');
    console.log(chatData);
    let userId = chatData.ownerId;
    let chatMessage = chatData.content;
    let chatDate = new Date(chatData.date);
    console.log(userId);
    console.log(chatMessage);
    let sentByCurrentPlayer = false;
    let senderName = '';
    let chatString = '';
    let senderClass = 'match-chat-opponent-player';

    console.log('players');
    console.log(players);

    // Check if the incoming message is from the current user to set the sender color
    if ( userId == user.id ) {
        sentByCurrentPlayer = true;
        senderClass = 'match-chat-current-player';
    }

    // Get the sender username
    if ( players[0].id == userId ) {
        senderName = sanitizeInput( players[0].username );
    } else if ( players[1].id == userId ) {
        senderName = sanitizeInput( players[1].username );
    } else if ( 'System' == userId || userId === null ) {
        chatMessage = chatMessage.replaceAll('<' + players[0].id + '>', sanitizeInput( players[0].username) );
        chatMessage = chatMessage.replaceAll('<' + players[1].id + '>', sanitizeInput( players[1].username) );
        senderName = 'System';
        senderClass = 'match-chat-system';
    } else {
        let modUser = await getModUser([userId]);
        // Admin message
        /*if ( matchInfo.user.id == userId && matchInfo.user.role == 2 ) {
            senderName = matchInfo.user.username + ' (Admin)';
        }*/
        senderName = sanitizeInput( modUser[0].username ) + ' (Moderator)';
        senderClass = 'match-chat-moderator';
        // idk who sent this
        // probably for mods
    }

    chatString = '<div class="match-chat-message"><span class="match-chat-player ' + senderClass + '">' + senderName + ' [' + ( '0' + chatDate.getHours() ).slice(-2) + ':' + ( '0' + chatDate.getMinutes() ).slice(-2) + ']:&nbsp;</span>' + chatMessage + '</div>';
    return chatString;
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
        let currentStage = match.gamesArr.at(-1).stage;
        for( let counterpick of counterpicks ) {
            let stage = document.querySelectorAll('[stage-value="' + counterpick + '"]')[0];
            // If the stage hasn't been selected, remove all stage-stricken classes first
            // If the stage has been selected, strike everything except the selected stage
            if ( !currentStage ) {
                stage.classList.remove('stage-stricken');
            } else {
                if ( stage.getAttribute('stage-value') != currentStage ) {
                    stage.classList.add('stage-stricken');
                } else {
                    stage.style.display = 'inline-block';
                }
            }
            stage.classList.remove('stage-unselectable');
            stage.classList.add('stage-selectable');
        }
    } else {
        for ( let starter of starters ) {
            let stage = document.querySelectorAll('[stage-value="' + starter + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.remove('stage-unselectable');
            stage.classList.add('stage-selectable');
        }
    }
}

function resetStages() {
    if ( match.gamesArr.length > 1 ) {
        for ( let counterpick of counterpicks ) {
            let stage = document.querySelectorAll('[stage-value="' + counterpick + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.add('stage-selectable');
            stage.style.display = 'inline-block';
        }
    } else {
        for ( let stage of stages ) {
            stage.classList.remove('stage-selectable');
            stage.classList.add('stage-unselectable');
            stage.classList.add('stage-stricken');
            stage.style.display = 'none';
        }

        for ( let starter of starters ) {
            let stage = document.querySelectorAll('[stage-value="' + starter + '"]')[0];
            stage.classList.remove('stage-stricken');
            stage.classList.remove('stage-unselectable');
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
        let stage = document.querySelectorAll('[stage-value="' + strike + '"]')[0];
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
    let strikeableStages = null;
    if ( matchInfo.match.gamesArr.length == 1 ) {
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

        if ( strikesRemaining > 0 ) {
            strikeInfo.innerHTML = 'Strike <span class="strike-counter">' + strikesRemaining + '</span> stage' + ( strikesRemaining == 1 ? '' : 's' ) + ' you do not want to play on.';
        } else {
            strikeInfo.innerHTML = 'Confirm your stage strikes.';
        }
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
            strikeButton.innerHTML = 'Select Stage';
            mapSelect = true;
        }
        strikesRemaining = strikeAmount;

        if ( strikesRemaining > 0 ) {
            strikeInfo.innerHTML = 'Strike <span class="strike-counter">' + strikesRemaining + '</span> stage' + ( strikesRemaining == 1 ? '' : 's' ) + ' you do not want to play on.';
        } else {
            strikeInfo.innerHTML = 'Confirm your stage strikes.';
        }
    }
}

function setCurrentStriker() {
    let strikeableStages = document.getElementsByClassName('stage-selectable');
    let oppUnpickableStages = [];
    let oppID;
    // TODO: Rewrite this whole function, this is horrible
    if ( strikeableStages.length == 5 ) {
        currentStriker = players[0].id;
        name = sanitizeInput( players[0].username );
    }

    if ( strikeableStages.length == 4 ) {
        currentStriker = players[1].id;
        name = sanitizeInput( players[1].username );
    }

    if ( strikeableStages.length == 2 ) {
        currentStriker = players[0].id;
        name = sanitizeInput( players[0].username );
    }

    if ( match.gamesArr.length > 1 ) {
        currentStriker = match.gamesArr.at(-2).winnerId;
        if ( currentStriker == players[0].id ) {
            name = sanitizeInput( players[0].username );
            oppUnpickableStages = match.players[1].unpickableStagesArr;
            oppID = match.players[1].id;
        } else {
            name = sanitizeInput( players[1].username );
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
            name = sanitizeInput( players[1].username );
        } else {
            currentStriker = players[0].id;
            name = sanitizeInput( players[0].username );
        }

        setDSRStages(currentStriker);

        pickingStage = true;

        currentStrikerName.innerHTML = name + ' is currently picking the stage to play on.';
        strikeInfo.innerHTML = 'Select the stage to play on.';
    }

    currentStrikerName.style.display = 'block';
}

function isPlayerStriker() {
    console.log(userID);
    console.log(currentStriker);
    if ( userID == currentStriker ) {
        tabAlert(toggleMatchStrikes);
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
        } else {
            stage.classList.remove('stage-stricken');
            stage.style.display = 'inline-block';
        }
    }
}

function setDSRStages(currentStriker) {
    let unpickableStages = [];
    if ( players[0].id == currentStriker ) {
        unpickableStages = match.players[0].unpickableStagesArr;
    } else {
        unpickableStages = match.players[1].unpickableStagesArr;
    }

    console.log(unpickableStages);

    for ( let unpickableStage of unpickableStages ) {
        console.log('Force striking ' + unpickableStage);
        let stage = document.querySelectorAll('[stage-value="' + unpickableStage + '"]')[0];

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
    toggleContent.style.display = 'none';

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
    pickingStage = false;

    let selectedStage = document.getElementsByClassName('stage-selected');
    if ( selectedStage.length > 0 ) {
        if ( selectedStage[0].classList.contains('mobile-selected') );
            selectedStage[0].classList.remove('mobile-selected');
        selectedStage[0].classList.remove('stage-selected');
    }

    let strickenStages = document.getElementsByClassName('stage-stricken');
    for ( let stage of strickenStages ) {
        stage.style.display = 'none';
        if ( stage.classList.contains('mobile-selected') );
            stage.classList.remove('mobile-selected');
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

function checkPrivateMatch() {
    if ( privateMatch ) {
        playerRaiseDispute.style.display = 'none';
    }
}

function checkMatchOver() {
    console.log(matchInfo.match.status);
    if ( matchInfo.match.status == 3 || matchInfo.match.status == 4 || matchInfo.match.status == 5 ) {
        needHelp.style.display = 'none';
        leaveMatch.style.display = 'none';
        playerRaiseDispute.style.display = 'none';
        strikerSection.style.display = 'none';
    }
}

function checkPlayerStatus() {
    // Hide everything but players and score if user isn't admin or in the match
    if ( user.role != 2 && userID != players[0].id && userID != players[1].id ) {
        matchContent.style.display = 'none';
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
    pickingStage = false;
    mapSelect = false;
}

async function gameFinish(winnerId) {
    console.log('winner id: ' + winnerId);
    setScores();
    // Do this one last time to update the score when we can't get new match data
    setWinner(winnerId);
    playingStage.style.display = 'none';
    player1VictoryButton.style.display = 'none';
    player2VictoryButton.style.display = 'none';
    stageList.style.display = 'none';
    strikerSection.style.display = 'block';
    currentStrikerName.style.display = 'none';
    leaveMatch.style.display = 'none';

    console.log(players);

    if ( players[0].id == winnerId ) {
        name = sanitizeInput( players[0].username );
    } else {
        name = sanitizeInput( players[1].username );
    }

    console.log('winner name: ' + name);

    setMatchWinnerMessage(winnerId);
    
    requeueButton.style.display = 'block';
}

function playerResetDispute() {
    needHelp.style.display = 'block';
    playerRaiseDispute.style.display = 'none';
}

function showAdminDispute() {
    if ( user.role == 2 && match.status == 2 ) {
        adminContent.style.display = 'block';
        // Hide player resolve if user is admin
        playerResolve.style.display = 'none';
    }
}

function hideAdminDispute() {
    adminContent.style.display = 'none';
}

function showAdminBanInfo() {
    if ( user.role == 2 ) {
        adminPlayer1.style.display = 'block';
        adminPlayer2.style.display = 'block';

        if ( players[0].banned ) {
            adminBanPlayer1Content.style.display = 'block';
        }

        if ( players[1].banned ) {
            adminBanPlayer2Content.style.display = 'block';
        }
    }
}

function showPlayerResolve() {
    if ( !privateMatch ) {
        needHelp.style.display = 'none';
        // Don't show player resolve for users who are admins
        if ( user.role != 2 ) {
            playerResolve.style.display = 'block';
        }
    }
}

async function getModUser(users) {
    let data = { userIdList: users };
    let result = await postData('/user/GetUsers', data);
    return result.data;
}

async function setStrikeSystemMessages(currentStriker, receivedStrikes) {
    // {ownerId: '23M2UCi0s6BUdfFr', content: '50', date: 1720538721390}
    let strikeString = '';
    let i = 1;
    let arrLength = receivedStrikes.length;
    for (let strike of receivedStrikes) {
        let stage = document.querySelectorAll('[stage-value="' + strike + '"]')[0];
        let stageValue = stage.children[0].innerHTML;
        strikeString += stageValue;
        ( i < arrLength ? strikeString += ', ' : strikeString += '.' );
        i++;
    }
    let systemMessage = { ownerId: 'System', content: '<' + currentStriker + '> striked ' + strikeString, date: Date.now() }
    let messageString = await getMessageString(systemMessage);
    await addMessage(messageString);
}

async function setPickSystemMessage(currentStriker, selectedStage) {
    let strikeString = '';
    let stage = document.querySelectorAll('[stage-value="' + selectedStage + '"]')[0];
    let stageValue = stage.children[0].innerHTML;
    strikeString += stageValue;
    let systemMessage = { ownerId: 'System', content: '<' + currentStriker + '> chose to play on ' + strikeString + '.', date: Date.now() }
    console.log(systemMessage);
    let messageString = await getMessageString(systemMessage);
    await addMessage(messageString);
    return;
}

async function setConfirmPlayerMessage(playerId, winnerId) {
    console.log(playerId);
    console.log(winnerId);
    let confirmString = '';
    let systemMessage = { ownerId: 'System', content: '<' + playerId + '> marked <' + winnerId + '> as the winner.', date: Date.now() }
    let messageString = await getMessageString(systemMessage);
    await addMessage(messageString);
    return;
}

async function setMatchWinnerMessage(playerId) {
    let systemMessage = { ownerId: 'System', content: '<' + playerId + '> won the match.', date: Date.now() }
    let messageString = await getMessageString(systemMessage);
    await addMessage(messageString);
    return;
}

async function setPlayerLeftMessage(playerId, ranked) {
    let systemMessage;
    if ( ranked ) {
        systemMessage = { ownerId: 'System', content: '<' + playerId + '> forfeited the match.', date: Date.now() }
    } else {
        systemMessage = { ownerId: 'System', content: '<' + playerId + '> has chosen to end the session.', date: Date.now() }
    }
    let messageString = await getMessageString(systemMessage);
    await addMessage(messageString);
    return;
}

async function checkPlayerRanked(newPlayerRatings) {
    let newPlayerRating;
    let ratingstring;
    if ( players[0].id == userID ) {
        newPlayerRating = newPlayerRatings.newPlayer1Rating;
    } else {
        newPlayerRating = newPlayerRatings.newPlayer2Rating;
    }

    if ( userELO == null && newPlayerRating != null ) {
        let userRank = GetRank(newPlayerRating);
        qualifierImage.src = userRank.imageURL;
        qualifierName.innerHTML = userRank.name;
        overlay.classList.remove('hidden');
        qualifierModal.classList.remove('hidden');
    }

}

function tabAlert(button) {
    if ( !button.classList.contains('active') ) {
        let notification = button.childNodes[0];
        notification.classList.add('alert')
    }
}

function removeNotifications() {
    for (let notification of notifications ) {
        notification.classList.remove('alert');
    }
}

async function reconnectSocket() {
    console.log('Reconnecting!');
    await setMatchInfo();
    socket.connect();
    socket.emit('join', 'match' + matchId);
    socket.emit('join', 'userRoom');
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

function sanitizeInput(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

// SOCKET FUNCTIONS

async function socketHeartBeat() {
    console.log('badum');
    await setMatchInfo();
    if ( !socket.connected ) {
        await reconnectSocket();
    }
}

socket.emit('join', 'match' + matchId);
socket.emit('join', 'userRoom');

socket.on('connection', async () => {
    alert('connecting');
    await setMatchInfo();
});

socket.on('chatMessage', async (chatData) => {
    console.log(chatData);
    tabAlert(toggleMatchChat);
    let chatString = await getMessageString(chatData);
    await addMessage(chatString);
});

socket.on('stageStrikes', (receivedStrikes) => {
    console.log('Striking stages');
    setStrikes(receivedStrikes);
    setStrikeSystemMessages(currentStriker, receivedStrikes);
    setStrikeAmount();
    setCurrentStriker();
    isPlayerStriker();

    let strikeableStages = document.getElementsByClassName('stage-selectable');

    if (strikeableStages.length == 1) {
        startGame();
    }
});

socket.on('stagePick', (selectedStage) => {
    console.log('Stage was selected!');
    console.log(selectedStage);
    setSelectedStage(selectedStage);
    setPickSystemMessage(currentStriker, selectedStage);
    startGame();
});

socket.on('playerConfirmedWin', (data) => {
    setConfirmPlayerMessage(data.playerId, data.winnerId);
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
    console.log(data);
    console.log(data.winnerId);
    //await getMatchInfo(matchId);
    await gameFinish(data.winnerId);
    //confirmationMessage.style.display = 'none';
    checkPlayerRanked(data.newPlayerRatings);
    // Unhide return to queue button
    // Do any final things
});

socket.on('matchEnd', async (data) => {
    console.log(data);
    if ( !userLeft ) {
        let leftPlayer;
        if ( players[0].id == userID ) {
            leftPlayer = players[1].id;
        } else {
            leftPlayer = players[0].id;
        }
        //alert('Your opponent has left the match.');
        //confirmationMessage.innerHTML = 'Your opponent has left the match.';
        setPlayerLeftMessage( leftPlayer, false );
        requeueButton.style.display = 'block';
        leaveMatch.style.display = 'none';
    }
});

socket.on('forfeit', async (data) => {
    console.log(data);
    if ( !userLeft ) {
        let leftPlayer;
        if ( players[0].id == userID ) {
            leftPlayer = players[1].id;
        } else {
            leftPlayer = players[0].id;
        }
        alert('Your opponent has forfeited the match.');
        setPlayerLeftMessage( leftPlayer, true );
        //confirmationMessage.innerHTML = 'Your opponent has forfeited the match.';
        requeueButton.style.display = 'block';
        leaveMatch.style.display = 'none';
        checkPlayerRanked(data.newPlayerRatings);
    }
});

socket.on('dispute', async () => {
    if ( !privateMatch ) {
        alert('There has been a dispute in match results. Please wait for a moderator to resolve the issue. If the dispute was made by accident, please press the resolve dispute button and properly mark the winner.');
    }
    await setMatchInfo();
    await showAdminDispute();
    await showPlayerResolve();
    confirmationMessage.innerHTML = 'Please wait for a moderator to resolve the match dispute. If the dispute was made by accident, please press the resolve dispute button and properly mark the winner.';
    confirmationMessage.style.display = 'block';
    console.log(match);
});

socket.on('resolveDispute', async (resolveOption) => {
    console.log(resolveOption);
    if ( !privateMatch ) {
        alert('The dispute has been resolved.');
    }
    await setMatchInfo();
    await playerResetDispute();
    await hideAdminDispute();
    console.log(match);
    confirmationMessage.style.display = 'none';
    // If the game or the match has to be reset, go through the reset function
    // We'll check based on whether or not the strikes have been reset
    if ( match.gamesArr.at(-1).strikes.length == 0 ) {
        resetGame();
    }
});

socket.on("connect_error", async (err) => {
  /*alert(`Socket connection error. Please report this to the devs! (And reload the page to reconnect).
  
  Message: ${err.message}
  
  Decription: ${err.description}
  
  Context: ${err.context}

  Attempting to rejoin`);*/
  await reconnectSocket();
});

socket.on("disconnect", async (reason, details) => {
  /*alert(`Socket disconnect. This shouldnt be pushed to prod!

  Reason: ${reason}
  
  Message: ${(details) ? details.message : ''}
  
  Decription: ${(details) ? details.description : ''}
  
  Context: ${(details) ? details.context : ''}

  Attempting to rejoin`);*/
  await reconnectSocket();
});

// heart beat every 1:30
setInterval(socketHeartBeat, 90*1000);