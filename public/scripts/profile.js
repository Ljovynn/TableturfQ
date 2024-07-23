import { GetRank } from "../constants/rankData.js";
import { ratingHistoryOptions } from "../constants/ratingData.js";

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
const banDetails = document.getElementById('user-ban-details');

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

const graphTimeframe = document.getElementById('user-rating-graph-timeframe');
const graphSubmit = document.getElementById('user-rating-graph-submit');
var chosenTimeframe;
const chartEndpointsOffset = 1300;

// Logout
const logoutButton = document.getElementById('logout-button');

// Admin
const adminContent = document.getElementById('admin-profile');
const adminBanUser = document.getElementById('admin-ban-user');
const adminBanUserContent = document.getElementById('admin-ban-user-content');
const adminBanUserButton = document.getElementById('admin-ban-user-button');
const adminUnbanUserContent = document.getElementById('admin-unban-user-content');
const adminUnbanUserButton = document.getElementById('admin-unban-user-button');
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

var graphData;

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
await setELOGraph();
await setUserBanLength();

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
    var response = await postData('/user/DeleteUserLoginData');
    if ( response == 201 ) {
        window.location.href = '/';
    }
});

graphSubmit.addEventListener('click', async (e) => {
    await setELOGraph(graphTimeframe.value);
});

// Admin actions
if ( loggedInUserInfo.user.role== 2 ) {
    adminBanUser.addEventListener('click', async (e) => {
        adminBanUserContent.style.display = 'block';
    });

    adminBanLength.addEventListener('change', async (e) => {
        if ( adminBanLength.value != 0 ) {
            adminBanUserButton.innerHTML = 'Suspend User';
        } else {
            adminBanUserButton.innerHTML = 'Ban User';
        }
    });

    adminBanUserButton.addEventListener('click', async (e) => {
        var data = { bannedUserId: userId, banLength: parseInt(adminBanLength.value) };
        var response = await postData('/admin/BanUser', data);

        console.log(response);
        if ( response == 201 ) {
            adminUnbanUserContent.style.display = 'block';
            adminBanUser.style.display = 'none';
            adminBanUserContent.style.display = 'none';
            await setAdminBanLength(userId);
        }
    });

    adminUnbanUserButton.addEventListener('click', async (e) => {
        var data = { unbannedUserId: userId };
        var response = await postData('/admin/UnbanUser', data);

        console.log(response);
        if ( response == 201 ) {
            adminUnbanUserContent.style.display = 'none';
            banDetails.style.display = 'none';
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
        var avatarString = '';
        if ( discordAvatarHash ) {
            avatarString = 'https://cdn.discordapp.com/avatars/' + discordId + '/' + discordAvatarHash + '.jpg' + '?size=512';
        } else {
            avatarString = '/assets/images/chumper.png';
        }
        userProfilePicture.src = avatarString;

        if ( user.country ) {
            var countryElement = document.createElement('img');
            countryElement.src = 'https://flagcdn.com/w20/' + user.country + '.png';
            countryFlag = countryElement;
        } else {
            countryFlag = 'No Country Set';
        }

        userCountryValue.append(countryFlag);
        rank = GetRank(user.g2_rating);
        userELO.innerHTML = (user.g2_rating) ? Math.floor(user.g2_rating) : 'N/A';
        userRank.src = rank.imageURL;
        userRankInfo.style.display = 'block';
        userRank.parentElement.innerHTML += rank.name;

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

    if ( matches ) {
        for ( let match of matches ) {
            console.log(match);
            let row = document.createElement('div');
            row.classList.add('match-row');

            let dateCell = document.createElement('div');
            dateCell.classList.add('match-date');
            var matchDate = new Date( match.unix_created_at * 1000 ).toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"}) ;
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
}

async function getMatchUsers(users) {
    var data = { userIdList: users };
    var result = await getData('/user/GetUsers', data);
    return result;
}

async function getELOGraph(timeframe) {
    var data = { userId: userId, ratingHistoryOption: ratingHistoryOptions[timeframe] };
    var result = await getData('/user/GetUserRatingHistory', data);
    /*if (result.length > 0){
        result.unshift({
            match_id: null,
            old_rating: result[0].old_rating,
            new_rating: result[0].old_rating,
            unix_date: Math.round(((Date.now() - ratingHistoryOptions[timeframe]) / 1000))
        });
        result.push({
            match_id: null,
            old_rating: result[result.length - 1].new_rating,
            new_rating: result[result.length - 1].new_rating,
            unix_date: Math.round((Date.now() / 1000))
        });
    }*/
    console.log(result);
    return result;
}

async function setELOGraph(timeframe = 'month') {
    chosenTimeframe = timeframe;
    graphData = await getELOGraph(timeframe);

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawELOChart);

    // Other stuff
}

function GetChartOptions(timeframe){
    var result = {
        legend: { position: 'bottom' },
        lineWidth: 4,
        dataOpacity: 0.6,
        pointSize: 5,
        colors: ['#739FEE', '#E68888'],
        chartArea: {
            backgroundColor: {
                stroke: 'A79100',
                strokeWidth: 2
            }
        },
        backgroundColor:{
            stroke: 'A79100',
            strokeWidth: 3
        },
        series: {
            0: {},
            1: {}
        }
    }
    switch (timeframe){
        case 'day':
        result.title = 'Rating History (1 day)',
        result.hAxis = {
            viewWindow: {
                min: new Date(Date.now() - ratingHistoryOptions[timeframe]),
                max: new Date(Date.now())
            },
            gridlines: {
                count: 8,
                units: {
                    hours: {format: ['HH:mm']},
                }
            },
            minorGridlines: {
                count: 0
            }
        }
        break;
        case 'week':
        result.title = 'Rating History (1 week)',
        result.hAxis = {
            viewWindow: {
                min: new Date(Date.now() - ratingHistoryOptions[timeframe]),
                max: new Date(Date.now())
            },
            gridlines: {
                count: 7,
                units: {
                    days: {format: ['MMM dd']},
                }
            },
            minorGridlines: {
                count: 0
            }
        }
        break;
        case 'month':
        default:
        result.title = 'Rating History (1 month)',
        result.hAxis = { 
            viewWindow: {
                min: new Date(Date.now() - ratingHistoryOptions[timeframe]),
                max: new Date(Date.now())
            },
            gridlines: {
                count: 15,
                units: {
                    days: {format: ['MMM dd']},
                }
            },
            minorGridlines: {
                count: 0
            }
        }
        break;
        case 'season':
        break;
    }
    return result;
}

function drawELOChart() {

    var testData = [
        {unix_date: 1719835276, old_rating: 1458, new_rating: 1479 },
        {unix_date: 1719975276, old_rating: 1479, new_rating: 1485 },
        {unix_date: 1720440076, old_rating: 1463, new_rating: 1491 },
        {unix_date: 1720454006, old_rating: 1491, new_rating: 1503 },
        {unix_date: 1720461676, old_rating: 1472, new_rating: 1463 },
        {unix_date: 1720463596, old_rating: 1463, new_rating: 1475 }
    ];

    /*var dataArray = [
        ['Date', 'Match Rating', 'Rating Decay/Manual Adjustments']
    ];*/
    var dataArray = [];

    var currentMatch;
    var previousMatch;
    for ( let match of graphData ) {
        currentMatch = match;
        if ( !previousMatch || currentMatch.old_rating == previousMatch.new_rating ) {
            var matchDate = new Date(match.unix_date*1000);
            //dateString = getMatchDateString(matchDate);
            dataArray.push([matchDate, match.new_rating, null, null, null]);
        } else {
            // Set up the rating decay graph
            var startDate = new Date(previousMatch.unix_date*1000);
            //dateString = getMatchDateString(startDate);
            dataArray.push([startDate, null, null, null, previousMatch.new_rating]);

            var endDate = new Date(currentMatch.unix_date*1000);
            //dateString = getMatchDateString(endDate);
            dataArray.push([endDate, null, null, null, currentMatch.old_rating]);
            dataArray.push([endDate, currentMatch.old_rating, null, null, null]);
            dataArray.push([endDate, currentMatch.new_rating, null, null, null]);
        }
        previousMatch = match;
    }
    if (graphData.length > 0){
        dataArray.unshift([new Date(Date.now() - ratingHistoryOptions[chosenTimeframe]), graphData[0].old_rating,
        'point { size: 0; visible: false; }', `Start rating: ${graphData[0].old_rating}`, null]);
        //dataArray.push([new Date(Date.now()), graphData[graphData.length - 1].new_rating, null, 'point {visible: false; }']);
    }

    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Match Rating');
    data.addColumn({'type': 'string', 'role': 'style'});
    data.addColumn({'type': 'string', 'role': 'tooltip'});
    data.addColumn('number', 'Rating Decay/Manual adjustments');
    data.addRows(dataArray);

    var options = GetChartOptions(chosenTimeframe);

    //series[0] = {visibleInLegend: false, pointsVisible: false};
    //series[graphData.length - 1] = {visibleInLegend: false, pointsVisible: false, color: 'd3d3d3'};

    var chart = new google.visualization.LineChart(document.getElementById('user-graph'));

    chart.draw(data, options);
}

/* we probably don't need this function but I'll keep it handy for a bit
function getMatchDateString(matchDate) {
    return matchDate.getFullYear() + '-' + matchDate.getMonth() + '-' + matchDate.getDate() + ' ' + ( '0' + matchDate.getHours() ).slice(-2) + ':' + ( '0' + matchDate.getMinutes() ).slice(-2);
}
*/

async function setUserBanLength() {
    if ( user.banned && user.id == loggedInUserID ) {
        var banInfo = await getUserBanLength();
        if ( banInfo.banned ) {
            if ( banInfo.banLength ) {
                var banLength = banInfo.banLength
                var currentTime = new Date().getTime() / 1000;
                var remainingTime = banLength - currentTime;
                var readableLength = getReadableTime(remainingTime);

                banDetails.innerHTML = 'You are suspened from using TableturfQ until ' + new Date(banLength*1000) + `<br />` + 'Which is ' + readableLength + ' from now';
                banDetails.style.display = 'block';
            } else {
                banDetails.innerHTML = 'You are banned from using TableturfQ';
                banDetails.style.display = 'block';
            }
        }
    }
}

async function getUserBanLength() {
    //var data = { user: userID };
    var result = await fetchData('/user/GetUserBanInfo');
    console.log(result);
    return result;
}

async function setAdminBanLength(userID) {
    var banInfo = await getAdminBanLength(userID);
    if ( banInfo.banned ) {
        if ( banInfo.banLength ) {

            var banLength = banInfo.banLength
            var currentTime = new Date().getTime() / 1000;
            var remainingTime = banLength - currentTime;
            var readableLength = getReadableTime(remainingTime);

            banDetails.innerHTML = 'User is suspended from using TableturfQ until ' + new Date(banLength*1000) + `<br />` + 'Which is ' + readableLength + ' from now';
            banDetails.style.display = 'block';
        } else {
            banDetails.innerHTML = 'User is banned from using TableturfQ';
            banDetails.style.display = 'block';
        }
    }
}

async function getAdminBanLength(userID) {
    console.log(userID);
    var data = { userId: userID };
    var result = await getData('/admin/GetUserBanInfo', data);
    console.log(result);
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

            await setAdminBanLength(user.id);
        }
    }
}

function getReadableTime(time) {
    time = Number(time);
    var d = Math.floor(time / (3600*24));
    var h = Math.floor(time % (3600*24) / 3600);
    var m = Math.floor(time % 3600 / 60);
    var s = Math.floor(time % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
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