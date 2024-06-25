import { GetRank } from "../constants/rankData.js";

// User elements
const loadingSection = document.getElementById('page-loading');
const profileContent = document.getElementById('profile-content');
const userInGameName = document.getElementById('user-in-game-name-value');
const userDiscordName = document.getElementById('user-discord-name');
const userDisplayNameContent = document.getElementById('user-in-game-name');
const userDisplayName =  document.getElementById('user-in-game-name-value');
const userProfilePicture = document.getElementById('user-profile-picture');
const userRankInfo = document.getElementById('user-rank-info');
const userELO = document.getElementById('user-rank-elo');
const userRank = document.getElementById('user-rank');

// Interaction/edit elements
const editDisplayName = document.getElementById('user-profile-edit-name');
const editDisplayNameForm = document.getElementById('user-profile-edit-name-form');
const displayNameInput = document.getElementById('user-profile-name-input');
const displayNameSubmit = document.getElementById('user-profile-name-submit');
const editDisplayNameClose = document.getElementById('user-profile-edit-close');

const matchHistory = document.getElementById('user-match-history');

// Logout
const logoutButton = document.getElementById('logout-button');

// User vars
var user;
var userId;
var username;
var discordUsername;
var discordId;
var discordAvatarHash;
var userInfo;
var eloRating;
var rank;

var matches;

setUserInfo();
setMatchHistory();

editDisplayName.addEventListener('click', (e) => {
    console.log('User clicked the display name edit button');
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

editDisplayNameClose.addEventListener('click', (e) => {
    console.log('User clicked the edit display name close button');
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

displayNameSubmit.addEventListener('click', (e) => {
    var newDisplayName = displayNameInput.value;
    console.log('User submitted display name edit: ' + newDisplayName);
    // Validate the name update
    if ( validateDisplayName(newDisplayName) ) {

        var data = { username: newDisplayName };
        var response = postData('/user/SetUsername', data);

        // On successful response
        editDisplayNameForm.classList.toggle('editing');
        userDisplayNameContent.classList.toggle('editing');
        displayNameInput.value = '';
        userDisplayName.textContent = newDisplayName;
    } else {
        alert('The submitted display name is invalid. Please try again.');
    }
});

logoutButton.addEventListener('click', async (e) => {
    response = await postData('/user/DeleteUserLoginData');
    console.log(response);
    if ( response == 201 ) {
        window.location.href = '/';
    }

});

async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}

async function setUserInfo() {
    try {
        userInfo = await getUserInfo();

        loadingSection.style.display = 'none';
        profileContent.style.display = 'block';
        console.log(userInfo);

        user = userInfo.user;
        userId = user.id;
        username = user.username;
        discordUsername = user.discord_username;
        discordId = user.discord_id;
        discordAvatarHash = user.discord_avatar_hash;
        console.log(rank);

        userDisplayName.innerHTML = username;
        userDiscordName.innerHTML = discordUsername;
        var avatarString = 'https://cdn.discordapp.com/avatars/' + discordId + '/' + discordAvatarHash + '.jpg';
        userProfilePicture.src = avatarString;

        if ( !user.hide_rank ) {
            eloRating = (Math.round(user.g2_rating * 100) / 100).toFixed(2);
            rank = await GetRank(eloRating);
            userELO.innerHTML = eloRating;
            userRank.src = rank.imageURL;
            userRankInfo.style.display = 'block';
        }
    } catch (error) {
        window.location.href = '/';
    }
}

async function getMatchHistory() {
    var data = {};
    var result = await getData('/user/GetUserMatchHistory');
    console.log('matches');
    console.log(result);
    return result;
}

async function setMatchHistory() {
    matches = await getMatchHistory();

    for ( let match of matches ) {
        console.log(match);
        let row = document.createElement('div');
        row.classList.add('match-row');

        let dateCell = document.createElement('div');
        dateCell.classList.add('match-date');
        var matchDate = match.created_at.split('T')[0];
        dateCell.append(matchDate);

        let matchupCell = document.createElement('div');
        var players = await getMatchUsers( [match.player1_id, match.player2_id] );
        console.log(players);
        matchupCell.classList.add('matchup');
        matchupCell.append(players[0].username + ' vs ' + players[1].username);

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
                if ( players[0].id == userId )
                    outcome = 'W';
                else
                    outcome = 'L';
                break;
            case 4:
                // player 2 win
                if ( players[1].id == userId )
                    outcome = 'L';
                else
                    outcome = 'W';
                break;
            default:
                break;
        }
        outcomeCell.append(outcome);

        row.append(dateCell);
        row.append(matchupCell);
        row.append(outcomeCell);

        matchHistory.append(row);
    }
}

async function getMatchUsers(users) {
    var data = { userIdList: users };
    console.log(data);
    var result = await getData('/user/GetUsers', data);
    return result;
}

function validateDisplayName(newDisplayName) {
    // Just validate the name isn't empty for now
    if ( newDisplayName === '' ) {
        return false;
    }

    if ( newDisplayName.length < 2 || newDisplayName.length > 32 ) {
        return false;
    }

    return true;
}