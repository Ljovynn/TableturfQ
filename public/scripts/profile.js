import { GetRank } from "../constants/rankData.js";
import { ratingHistoryOptions } from "../constants/ratingData.js";
import { seasons } from "../constants/seasonData.js";

// User elements
const loadingSection = document.getElementById('page-loading');
const profileContent = document.getElementById('profile-content');
const userInGameName = document.getElementById('user-in-game-name-value');
const userDiscordName = document.getElementById('user-discord-name');
const userDisplayNameContent = document.getElementById('user-in-game-name');
const userDisplayName =  document.getElementById('user-in-game-name-value');
const userProfilePicture = document.getElementById('user-profile-picture');
const userProfilePictureRefresh = document.getElementById('user-profile-picture-refresh');
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

const toggleMatchHistory = document.getElementById('toggle-match-history');
const toggleRatingGraph = document.getElementById('toggle-rating-graph');

const matchInfo = document.getElementById('user-match-info');
const matchHistory = document.getElementById('user-match-history');

const ratingGraph = document.getElementById('user-rating-graph');
const graphTimeframe = document.getElementById('user-rating-graph-timeframe');
const graphSubmit = document.getElementById('user-rating-graph-submit');
var chosenTimeframe;
var chosenSeason;
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
const adminBanReason = document.getElementById('admin-ban-user-reason');

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

var loadingMatches = false;

try {
    const url = window.location.href;
    const searchParams = new URL(url).searchParams;
    const entries = new URLSearchParams(searchParams).entries();
    const entriesArray = Array.from(entries);
    playerID = entriesArray[0][1];
} catch (error) {
    // idk who cares
}


await setUserInfo();
await setMatchHistory();
await setELOGraph();
await setUserBanLength();

await showAdminBanInfo();

await addSeasonSelection();

userProfilePictureRefresh.addEventListener('click', async (e) => {
    let data = { userId: playerID };
    let response = await postData('/api/auth/discord/updateAvatar', data);
    if ( response.code == 200 ) {
        userInfo = await getMatchUsers([playerID]);
        let avatarString = '';
        if ( userInfo[0].discord_avatar_hash ) {
            avatarString = 'https://cdn.discordapp.com/avatars/' + userInfo[0].discord_id + '/' + userInfo[0].discord_avatar_hash + '.jpg' + '?size=512';
        } else {
            avatarString = '/assets/images/chumper.png';
        }
        userProfilePicture.src = avatarString;
    }
});

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


displayNameSubmit.addEventListener('click', async (e) => {
    let newDisplayName = displayNameInput.value;
    // Validate the name update
    if ( validateDisplayName(newDisplayName) ) {

        let data = { username: newDisplayName };
        let response = await postData('/user/SetUsername', data);

        // On successful response
        if ( response.code == 201 ) {
            editDisplayNameForm.classList.toggle('editing');
            userDisplayNameContent.classList.toggle('editing');
            displayNameInput.value = '';
            userDisplayName.textContent = newDisplayName;
        }
    } else {
        alert('The submitted display name is invalid. Please try again.');
    }
});

countrySubmit.addEventListener('click', async (e) => {
    let newCountry = countryInput.value;

    let data = { country: newCountry };
    let response = await postData('/user/SetUserCountry', data);

    // On Success
    if ( response.code == 201 ) {
        editCountryForm.classList.toggle('editing');
        userCountry.classList.toggle('editing');
        if ( newCountry != 'none' ) {
            let countryElement = document.createElement('img');
            countryElement.src = 'https://flagcdn.com/w20/' + newCountry.toLowerCase() + '.png';
            countryFlag = countryElement;
            userCountryValue.innerHTML = '';
            userCountryValue.append(countryFlag);
        } else {
            userCountryValue.innerHTML = 'No Country Set';
        }
    }
});

logoutButton.addEventListener('click', async (e) => {
    let response = await postData('/user/DeleteUserLoginData');
    if ( response.code == 200 ) {
        window.location.href = '/';
    }
});

toggleMatchHistory.addEventListener('click', async (e) => {
    if ( !toggleMatchHistory.classList.contains('active') ) {
        toggleMatchHistory.classList.toggle('active');
        toggleRatingGraph.classList.toggle('active');
        matchInfo.classList.toggle('untoggled');
        ratingGraph.classList.toggle('untoggled');
    }
});

toggleRatingGraph.addEventListener('click', async (e) => {
    if ( !toggleRatingGraph.classList.contains('active') ) {
        toggleMatchHistory.classList.toggle('active');
        toggleRatingGraph.classList.toggle('active');
        matchInfo.classList.toggle('untoggled');
        ratingGraph.classList.toggle('untoggled'); 
    } 
});

graphSubmit.addEventListener('click', async (e) => {
    let seasonId = parseInt(graphTimeframe.options[graphTimeframe.selectedIndex].getAttribute('season-id'));
    await setELOGraph(graphTimeframe.value, seasonId);
});

window.addEventListener('scroll', async (e) => {
    // Only do this when they're on the correct tab
    if ( toggleMatchHistory.classList.contains('active') ) {
        if ( window.scrollY + (screen.height/3) >= matchHistory.offsetHeight - 10 ) {
            if ( !loadingMatches ) {
                loadingMatches = true;
                let hits = document.getElementsByClassName('match-row');
                let page = 1;
                if ( hits.length % 10 == 0 ) {
                    page += hits.length/10;
                    let result = await getMatchHistory(page);
                    await appendMatches(result);
                }
            }
        }
    }
});

// Admin actions
if ( !loggedInUserInfo.error && loggedInUserInfo.user.role== 2 ) {
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
        let data = { bannedUserId: userId, banLength: parseInt(adminBanLength.value), reason: adminBanReason.value };
        let response = await postData('/admin/BanUser', data);

        if ( response.code == 201 ) {
            adminUnbanUserContent.style.display = 'block';
            adminBanUser.style.display = 'none';
            adminBanUserContent.style.display = 'none';
            await setAdminBanLength(userId);
        }
    });

    adminUnbanUserButton.addEventListener('click', async (e) => {
        let data = { unbannedUserId: userId };
        let response = await postData('/admin/UnbanUser', data);

        if ( response.code == 201 ) {
            adminUnbanUserContent.style.display = 'none';
            banDetails.style.display = 'none';
            adminBanUser.style.display = 'block';
        }
    });
}

async function getUserInfo() {
    try {
        let data = {};
        let result = await getData('/user/GetUserInfo');
        return result.data;
    } catch (error) {
        return null;
    }
}

async function setUserInfo() {
    try {
        loggedInUserInfo = await getUserInfo();
        if ( loggedInUserInfo && !loggedInUserInfo.error ) {
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

        userDisplayName.innerHTML = sanitizeDisplayName(username);
        userDiscordName.innerHTML = sanitizeDisplayName(discordUsername);
        let avatarString = '';
        if ( discordAvatarHash ) {
            avatarString = 'https://cdn.discordapp.com/avatars/' + discordId + '/' + discordAvatarHash + '.jpg' + '?size=512';
        } else {
            avatarString = '/assets/images/chumper.png';
        }
        userProfilePicture.src = avatarString;

        if ( user.country ) {
            let countryElement = document.createElement('img');
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
        //window.location.href = '/';
    }
}

async function getMatchHistory(page = 1, hits = 10) {
    let data = {};
    if ( playerID != '' ) {
        data = { userId: playerID, pageNumber: parseInt(page), hitsPerPage: parseInt(hits) };
    } else {
        data = { userId: userId, pageNumber: parseInt(page), hitsPerPage: parseInt(hits) };
    }
    let result = await postData('/matchHistory/GetUserMatchHistory', data);
    loadingMatches = false;
    return result.data;
}

async function setMatchHistory() {
    matchList = await getMatchHistory();
    if ( matchList.matchHistory.length > 0 ) {
        await appendMatches(matchList);
    } else {
        let emptyCell = document.createElement('div');
        emptyCell.classList.add('match-history-empty');
        emptyCell.innerHTML = 'User has no recent matches';
        matchHistory.append(emptyCell);
    }
}

async function appendMatches(matchList) {
    matches = matchList.matchHistory;
    matchUsers = matchList.users;
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
            let readableTime = getReadableMatchTime(timeElapsed);

            dateCell.append(readableTime);

            let matchupCell = document.createElement('div');
           // let players = await getMatchUsers( [match.player1_id, match.player2_id] );
            let player1 = getMatchPlayer(matchUsers, match.player1_id);
            let player2 = getMatchPlayer(matchUsers, match.player2_id);
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

            player1Name.innerHTML = sanitizeDisplayName( player1[0].username );
            player2Name.innerHTML = sanitizeDisplayName( player2[0].username );

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

            matchHistory.append(row);
        } catch (error) {
        }
    }
}

async function getMatchUsers(users) {
    let data = { userIdList: users };
    let result = await postData('/user/GetUsers', data);
    return result.data;
}

async function addSeasonSelection() {
    for ( let season of seasons ) {
        let seasonOption = document.createElement('option');
        seasonOption.value = 'season';
        seasonOption.setAttribute('season-id', season.id);
        seasonOption.innerHTML = 'Season ' + season.id;
        graphTimeframe.prepend(seasonOption);
    }
}

async function getELOGraph(timeframe, seasonId = null) {
    let data = { userId: userId, ratingHistoryOption: ratingHistoryOptions[timeframe], seasonId: seasonId };
    let result = await postData('/user/GetUserRatingHistory', data);
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
    return result.data;
}

async function setELOGraph(timeframe = 'month', seasonId = null) {
    chosenTimeframe = timeframe;
    chosenSeason = seasonId;
    graphData = await getELOGraph(timeframe, seasonId);

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawELOChart);

    // Other stuff
}

function GetChartOptions(timeframe){
    let result = {
        width: 750,
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

    let testData = [
        {unix_date: 1719835276, old_rating: 1458, new_rating: 1479 },
        {unix_date: 1719975276, old_rating: 1479, new_rating: 1485 },
        {unix_date: 1720440076, old_rating: 1463, new_rating: 1491 },
        {unix_date: 1720454006, old_rating: 1491, new_rating: 1503 },
        {unix_date: 1720461676, old_rating: 1472, new_rating: 1463 },
        {unix_date: 1720463596, old_rating: 1463, new_rating: 1475 }
    ];

    /*let dataArray = [
        ['Date', 'Match Rating', 'Rating Decay/Manual Adjustments']
    ];*/
    let dataArray = [];

    let currentMatch;
    let previousMatch;
    for ( let match of graphData ) {
        let matchDate = new Date(match.unix_date*1000);
        if ( match == graphData[0] ) {
            dataArray.push([matchDate, match.new_rating, null, null]);
        } else {
            dataArray.push([matchDate, match.new_rating, null, null]);
        }
        /*currentMatch = match;
        if ( !previousMatch || currentMatch.old_rating == previousMatch.new_rating ) {
            let matchDate = new Date(match.unix_date*1000);
            //dateString = getMatchDateString(matchDate);
            dataArray.push([matchDate, match.new_rating, null, null, null]);
        } else {
            // Set up the rating decay graph
            let startDate = new Date(previousMatch.unix_date*1000);
            //dateString = getMatchDateString(startDate);
            dataArray.push([startDate, null, null, null, previousMatch.new_rating]);

            let endDate = new Date(currentMatch.unix_date*1000);
            //dateString = getMatchDateString(endDate);
            dataArray.push([endDate, null, null, null, currentMatch.old_rating]);
            dataArray.push([endDate, currentMatch.old_rating, null, null, null]);
            dataArray.push([endDate, currentMatch.new_rating, null, null, null]);
        }
        previousMatch = match;*/
    }
    if (graphData.length > 0){
        if ( chosenTimeframe != 'season' ) {
            dataArray.unshift([new Date(Date.now() - ratingHistoryOptions[chosenTimeframe]), graphData[0].old_rating,
            'point { size: 0; visible: false; }', `Start rating: ${graphData[0].old_rating}`]);
            //dataArray.push([new Date(Date.now()), graphData[graphData.length - 1].new_rating, null, 'point {visible: false; }']);
        } else {
            dataArray.unshift([ new Date(seasons[chosenSeason].startDate), graphData[0].old_rating,
            'point { size: 0; visible: false; }', `Start rating: ${graphData[0].old_rating}`]);
        }
    }

    let data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Match Rating');
    data.addColumn({'type': 'string', 'role': 'style'});
    data.addColumn({'type': 'string', 'role': 'tooltip'});
    //data.addColumn('number', 'Rating Decay/Manual adjustments');
    data.addRows(dataArray);

    let options = GetChartOptions(chosenTimeframe);

    //series[0] = {visibleInLegend: false, pointsVisible: false};
    //series[graphData.length - 1] = {visibleInLegend: false, pointsVisible: false, color: 'd3d3d3'};

    let chart = new google.visualization.LineChart(document.getElementById('user-graph'));

    chart.draw(data, options);
}

/* we probably don't need this function but I'll keep it handy for a bit
function getMatchDateString(matchDate) {
    return matchDate.getFullYear() + '-' + matchDate.getMonth() + '-' + matchDate.getDate() + ' ' + ( '0' + matchDate.getHours() ).slice(-2) + ':' + ( '0' + matchDate.getMinutes() ).slice(-2);
}
*/

async function setUserBanLength() {
    if ( user.banned && user.id == loggedInUserID ) {
        let banInfo = await getUserBanLength();
        if ( banInfo.banned ) {
            if ( banInfo.banLength ) {
                let banLength = banInfo.banLength
                let currentTime = new Date().getTime() / 1000;
                let remainingTime = banLength - currentTime;
                let readableLength = getReadableTime(remainingTime);

                banDetails.innerHTML = 'You are suspened from using TableturfQ until ' + new Date(banLength*1000) + `<br />` + 'Which is ' + readableLength + ' from now.' + `<br />` + 'Reason: ' + banInfo.reason;
                banDetails.style.display = 'block';
            } else {
                banDetails.innerHTML = 'You are banned from using TableturfQ.' + `<br />` + 'Reason: ' + banInfo.reason;
                banDetails.style.display = 'block';
            }
        }
    }
}

async function getUserBanLength() {
    //let data = { user: userID };
    let result = await getData('/user/GetUserBanInfo');
    return result.data;
}

async function setAdminBanLength(userID) {
    let banInfo = await getAdminBanLength(userID);
    if ( banInfo.banned ) {
        if ( banInfo.banLength ) {

            let banLength = banInfo.banLength
            let currentTime = new Date().getTime() / 1000;
            let remainingTime = banLength - currentTime;
            let readableLength = getReadableTime(remainingTime);

            banDetails.innerHTML = 'User is suspended from using TableturfQ until ' + new Date(banLength*1000) + `<br />` + 'Which is ' + readableLength + ' from now.' + `<br />` + 'Reason: ' + banInfo.reason;
            banDetails.style.display = 'block';
        } else {
            banDetails.innerHTML = 'User is banned from using TableturfQ.' + `<br />` + 'Reason: ' + banInfo.reason;
            banDetails.style.display = 'block';
        }
    }
}

async function getAdminBanLength(userID) {
    let data = { userId: userID };
    let result = await postData('/admin/GetUserBanInfo', data);
    return result.data;
}

function getMatchPlayer( matchUsers, playerId ) {
    let player = matchUsers.filter( (user) => user.id === playerId );
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
    if ( !loggedInUserInfo.error && loggedInUserInfo.user.role == 2 ) {
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
    let d = Math.floor(time / (3600*24));
    let h = Math.floor(time % (3600*24) / 3600);
    let m = Math.floor(time % 3600 / 60);
    let s = Math.floor(time % 60);

    let dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    let hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

function getReadableMatchTime(time) {
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

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
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