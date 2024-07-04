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
const userCountry = document.getElementById('user-country');
const userCountryValue = document.getElementById('user-country-value');

// Interaction/edit elements
const editDisplayName = document.getElementById('user-profile-edit-name');
const editDisplayNameForm = document.getElementById('user-profile-edit-name-form');
const displayNameInput = document.getElementById('user-profile-name-input');
const displayNameSubmit = document.getElementById('user-profile-name-submit');
const editDisplayNameClose = document.getElementById('user-profile-edit-close');

const editCountry = document.getElementById('user-profile-edit-country');
const editCountryForm = document.getElementById('user-profile-edit-country-form');
const countryInput = document.getElementById('country-select');
const countrySubmit = document.getElementById('user-profile-country-submit');
const editCountryClose = document.getElementById('user-country-edit-close');

const matchHistory = document.getElementById('user-match-history');

// Logout
const logoutButton = document.getElementById('logout-button');

// Admin
const adminContent = document.getElementById('admin-profile');
const adminBanUser = document.getElementById('admin-ban-user');
const adminBanUserContent = document.getElementById('admin-ban-user-content');
const adminBanUserButton = document.getElementById('admin-ban-user-button');
const adminUnbanUserContent = document.getElementById('admin-unban-user-content');
const adminUnbanUserButton = document.getElementById('admin-unban-user-button');
const adminBanDetails = document.getElementById('admin-ban-details');
const adminBanLength = document.getElementById('admin-ban-user-length');

var loggedInUserInfo;
var loggedInUserID = '';

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
var countryFlag;

var matchList;
var matches;
var matchUsers;
var playerID = '';

try {
    const url = window.location.href;
    const searchParams = new URL(url).searchParams;
    const entries = new URLSearchParams(searchParams).entries();
    const entriesArray = Array.from(entries);
    playerID = entriesArray[0][1];
} catch (error) {
    console.log(error);
    // idk who cares
}


await setUserInfo();
await setMatchHistory();
await showAdminBanInfo();

editDisplayName.addEventListener('click', (e) => {
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

editDisplayNameClose.addEventListener('click', (e) => {
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

editCountry.addEventListener('click', (e) => {
    editCountryForm.classList.toggle('editing');
    userCountry.classList.toggle('editing');
});

editCountryClose.addEventListener('click', (e) => {
    editCountryForm.classList.toggle('editing');
    userCountry.classList.toggle('editing');
});


displayNameSubmit.addEventListener('click', (e) => {
    var newDisplayName = displayNameInput.value;
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

countrySubmit.addEventListener('click', async (e) => {
    var newCountry = countryInput.value;

    var data = { country: newCountry };
    var response = await postData('/user/SetUserCountry', data);

    // On Success
    console.log(response);

    editCountryForm.classList.toggle('editing');
    userCountry.classList.toggle('editing');
    var countryElement = document.createElement('img');
    countryElement.src = 'https://flagcdn.com/w20/' + newCountry.toLowerCase() + '.png';
    countryFlag = countryElement;
    userCountryValue.innerHTML = '';
    userCountryValue.append(countryFlag);
});

logoutButton.addEventListener('click', async (e) => {
    response = await postData('/user/DeleteUserLoginData');
    if ( response == 201 ) {
        window.location.href = '/';
    }
});

// Admin actions
if ( loggedInUserInfo.user.role== 2 ) {
    adminBanUser.addEventListener('click', async (e) => {
        adminBanUserContent.style.display = 'block';
    });

    adminBanLength.addEventListener('click', async (e) => {
        adminBanLength.value = Math.round( new Date().getTime()/1000 );
        adminBanUserButton.innerHTML = 'Suspend User';
    });

    adminBanUserButton.addEventListener('click', async (e) => {
        var data = { bannedUserId: userId, expiresAt: parseInt(adminBanLength.value) };
        var response = await postData('/admin/BanUser', data);

        console.log(response);
        if ( response == 201 ) {
            adminUnbanUserContent.style.display = 'block';
            adminBanUser.style.display = 'none';
            adminBanUserContent.style.display = 'none';
        }
    });

    adminUnbanUserButton.addEventListener('click', async (e) => {
        var data = { unbannedUserId: userId };
        var response = await postData('/admin/UnbanUser', data);

        console.log(response);
        if ( response == 201 ) {
            adminUnbanUserContent.style.display = 'none';
            adminBanUser.style.display = 'block';
        }
    });
}

async function getUserInfo() {
    try {
        var data = {};
        var result = await fetchData('/user/GetUserInfo');
        return result;
    } catch (error) {
        return null;
    }
}

async function setUserInfo() {
    try {
        loggedInUserInfo = await getUserInfo();
        if ( loggedInUserInfo ) {
            loggedInUserID = loggedInUserInfo.user.id;
        }
        // If no playerID is set, try the default get current user info
        if ( playerID != '' ) {
            userInfo = await getMatchUsers([playerID]);
            user = userInfo[0];
        } else {
            userInfo = loggedInUserInfo;
            user = userInfo.user;
        }

        loadingSection.style.display = 'none';
        profileContent.style.display = 'block';

        userId = user.id;
        username = user.username;
        discordUsername = user.discord_username;
        discordId = user.discord_id;
        discordAvatarHash = user.discord_avatar_hash;

        userDisplayName.innerHTML = username;
        userDiscordName.innerHTML = discordUsername;
        var avatarString = 'https://cdn.discordapp.com/avatars/' + discordId + '/' + discordAvatarHash + '.jpg' + '?size=512';
        userProfilePicture.src = avatarString;

        if ( user.country ) {
            var countryElement = document.createElement('img');
            countryElement.src = 'https://flagcdn.com/w20/' + user.country + '.png';
            countryFlag = countryElement;
        } else {
            countryFlag = 'No Country Set';
        }

        userCountryValue.append(countryFlag);

        if ( !user.hide_rank ) {
            eloRating = (Math.round(user.g2_rating * 100) / 100).toFixed(2);
            rank = await GetRank(eloRating);
            userELO.innerHTML = eloRating;
            userRank.src = rank.imageURL;
            userRankInfo.style.display = 'block';
        }
        hideNonUserElements();
    } catch (error) {
        console.log(error);
        window.location.href = '/';
    }
}

async function getMatchHistory() {
    var page = 1;
    var hits = 10;
    var data = {};
    if ( playerID != '' ) {
        data = { userId: playerID, pageNumber: parseInt(page), hitsPerPage: parseInt(hits) };
    } else {
        data = { userId: userId, pageNumber: parseInt(page), hitsPerPage: parseInt(hits) };
    }
    var result = await getData('/matchHistory/GetUserMatchHistory', data);
    return result;
}

async function setMatchHistory() {
    matchList = await getMatchHistory();
    matches = matchList.matchHistory;
    matchUsers = matchList.users;

    for ( let match of matches ) {
        let row = document.createElement('div');
        row.classList.add('match-row');

        let dateCell = document.createElement('div');
        dateCell.classList.add('match-date');
        var matchDate = match.created_at.split('T')[0];
        dateCell.append(matchDate);

        let matchupCell = document.createElement('div');
       // var players = await getMatchUsers( [match.player1_id, match.player2_id] );
        var player1 = getMatchPlayer(matchUsers, match.player1_id);
        var player2 = getMatchPlayer(matchUsers, match.player2_id);
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
                if ( player1[0].id == userId )
                    outcome = 'Victory';
                else
                    outcome = 'Defeat';
                break;
            case 4:
                // player 2 win
                if ( player2[0].id == userId )
                    outcome = 'Victory';
                else
                    outcome = 'Defeat';
                break;
            default:
                outcome = 'No Winner';
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
    var result = await getData('/user/GetUsers', data);
    return result;
}

function getMatchPlayer( matchUsers, playerId ) {
    var player = matchUsers.filter( (user) => user.id === playerId );
    return player;
}

function hideNonUserElements() {
    if ( userId != loggedInUserID ) {
        editDisplayName.style.display = 'none';
        editCountry.style.display = 'none';
        logoutButton.style.display = 'none';
    }
}

async function showAdminBanInfo() {
    if ( loggedInUserInfo.user.role == 2 ) {
        adminContent.style.display = 'block';
        if ( user.banned ) {
            adminBanUserContent.style.display = 'none';
            adminBanUser.style.display = 'none';
            adminUnbanUserContent.style.display = 'block';
        }
    }
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