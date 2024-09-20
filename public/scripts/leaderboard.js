import { GetRank } from "../constants/rankData.js";

const leaderBoard = document.getElementById('leaderboard');
//const leaderBoardForm = document.getElementById('leaderboard-form');

//const searchInput = document.getElementById('leaderboard-search');
//const searchButton = document.getElementById('leaderboard-search-button');
const pageFilter = document.getElementById('leaderboard-page-amount');
const prevButtons = document.getElementsByClassName('page-prev');
const nextButtons = document.getElementsByClassName('page-next');

var leaderBoardData;
var startPos = 0;
var hitCount = 10;
var page = 0;
var totalPlayers;

// Defaults of startPos 0 and 15 hitcounts
setLeaderBoard(startPos, hitCount);

/*leaderBoardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    var searchValue = searchInput.value;

    if ( validateSeach(searchValue) ) {
        data = { input: searchValue };
        response = await getData('/leaderboard/SearchLeaderboard', data);

        addSearchedUser(response);
        // If success, recreate the table with the retrieved results
    } else {
        alert('Please enter a valid username to search.');
    }
});

searchInput.addEventListener('input', async (e) => {
    if ( searchInput.value == '' ) {
        refreshLeaderBoard(startPos, hitCount);
        setLeaderBoard(startPos, hitCount);
    }
});*/

pageFilter.addEventListener('change', (e) => {
    hitCount = parseInt(pageFilter.value);
    // Reset startPos too?
    refreshLeaderBoard(0, hitCount);
});

for ( let prevButton of prevButtons ) {
    prevButton.addEventListener( 'click', async (e) => {
        if ( page > 0 ) {
            page--;
            startPos = startPos - hitCount;
            await refreshLeaderBoard(startPos, hitCount);
        }
    });
}

for ( let nextButton of nextButtons ) {
    nextButton.addEventListener( 'click', async (e) => {
        if ( hitCount + startPos <= totalPlayers ) {
            page++;
            startPos = startPos + hitCount;
            await refreshLeaderBoard(startPos, hitCount);
        }
    });
}

async function setLeaderBoard(startPos, hitCount) {
    let result = await getLeaderBoard(startPos, hitCount);
    let users = result.result;
    let placement = 1 + startPos;

    totalPlayers = result.totalPlayers;

    // If the current page is 0, hide the prev button, otherwise show it
    if ( page == 0 ) {
        for ( let prevButton of prevButtons ) {
            prevButton.style.display = 'none';
        }
    } else {
        for ( let prevButton of prevButtons ) {
            prevButton.style.display = 'inline-block';
        }
    }

    // If the startPos of the next page would be more than the totalPlayers, hide the next button
    // Otherwise show it
    if ( hitCount + startPos >= totalPlayers ) {
        for ( let nextButton of nextButtons ) {
            nextButton.style.display = 'none';
        }
    } else {
        for ( let nextButton of nextButtons ) {
            nextButton.style.display = 'inline-block';
        }
    }


    for ( let user of users ) {
        let row = document.createElement('div');
        row.classList.add('leaderboard-row');

        let placementCell = document.createElement('div');
        placementCell.classList.add('leaderboard-placement');
        
        let placementDiv = document.createElement('div');
        placementDiv.append(placement);

        placementCell.append(placementDiv);

        let nameCell = document.createElement('div');
        nameCell.classList.add('leaderboard-name');

        let userLink = document.createElement('a');
        userLink.href = '/profile?playerId=' + user.id;
        userLink.setAttribute('target', '_blank');

        if ( user.country ) {
            let countryElement = document.createElement('img');
            countryElement.src = 'https://flagcdn.com/w20/' + user.country + '.png';
            userLink.append(countryElement);
            let flagSpace = document.createTextNode("\u00A0");
            userLink.append(flagSpace);
        }

        userLink.innerHTML = userLink.innerHTML + sanitizeDisplayName( user.username );
        nameCell.append(userLink);

        let eloCell = document.createElement('div');
        eloCell.classList.add('leaderboard-ELO');

        let userRank = GetRank(user.g2_rating);
        let rankImage = document.createElement('img');
        rankImage.src = userRank.imageURL;
        rankImage.setAttribute('id', 'user-rank');

        let eloDiv = document.createElement('div');
        eloDiv.append( Math.floor(user.g2_rating) );

        eloCell.append(rankImage);
        eloCell.append(eloDiv);

        row.append(placementCell);
        row.append(nameCell);
        row.append(eloCell);

        leaderBoard.append(row);

        placement++;
    }
}

function addSearchedUser(users) {
    refreshLeaderBoard(0,0);
    for ( let user of users ) {

        let row = document.createElement('div');
        row.classList.add('leaderboard-row');

        let placementCell = document.createElement('div');
        placementCell.classList.add('leaderboard-placement');
        
        let placementDiv = document.createElement('div');
        placementDiv.append(user.position);

        placementCell.append(placementDiv);

        let nameCell = document.createElement('div');
        nameCell.classList.add('leaderboard-name');

        let userLink = document.createElement('a');
        userLink.href = '/profile?playerId=' + user.user.id;
        userLink.setAttribute('target', '_blank');

        if ( user.user.country ) {
            let countryElement = document.createElement('img');
            countryElement.src = 'https://flagcdn.com/w20/' + user.user.country + '.png';
            userLink.append(countryElement);
            flagSpace = document.createTextNode("\u00A0");
            userLink.append(flagSpace);
        }

        userLink.innerHTML = sanitizeDisplayName( user.user.username );
        nameCell.append(userLink);

        let eloCell = document.createElement('div');
        eloCell.classList.add('leaderboard-ELO');

        let eloDiv = document.createElement('div');
        eloDiv.append( (Math.round(user.user.g2_rating * 100) / 100).toFixed(2) );

        eloCell.append( eloDiv );

        row.append(placementCell);
        row.append(nameCell);
        row.append(eloCell);

        leaderBoard.append(row);
    }
}

async function refreshLeaderBoard(startPos, hitCount) {
    leaderBoard.replaceChildren(leaderBoard.firstElementChild);
    if ( startPos != 0 || hitCount != 0 ) {
        await setLeaderBoard(startPos, hitCount);
    }
}

async function getLeaderBoard(startPos, hitCount) {
    let data = { startPos: startPos, hitCount: hitCount }
    let result = await postData('/leaderboard/GetLeaderboard', data);
    return result.data;
}

function validateSeach(searchValue) {
    if ( searchValue === '' ) {
        return false;
    }

    return true;
}

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}