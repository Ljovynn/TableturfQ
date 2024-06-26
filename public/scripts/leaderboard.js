const leaderBoard = document.getElementById('leaderboard');

const searchInput = document.getElementById('leaderboard-search');
const searchButton = document.getElementById('leaderboard-search-button');
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

searchButton.addEventListener('click', (e) => {
    var searchValue = searchInput.value;

    if ( validateSeach(searchValue) ) {
        data = { search: searchValue };
        response = postData('/search', data);

        // If success, recreate the table with the retrieved results
    } else {
        alert('Please enter a valid username to search.');
    }
});

pageFilter.addEventListener('change', (e) => {
    hitCount = pageFilter.value;
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
    result = await getLeaderBoard(startPos, hitCount);
    users = result.result;
    totalPlayers = result.totalPlayers;
    var placement = 1 + startPos;

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
        placementCell.append(placement);

        let nameCell = document.createElement('div');
        nameCell.classList.add('leaderboard-name');

        let userLink = document.createElement('a');
        userLink.href = '/profile?playerId=' + user.id;
        userLink.setAttribute('target', '_blank');
        userLink.append(user.username);
        nameCell.append(userLink);

        let eloCell = document.createElement('div');
        eloCell.classList.add('leaderboard-ELO');
        eloCell.append( (Math.round(user.g2_rating * 100) / 100).toFixed(2) );

        row.append(placementCell);
        row.append(nameCell);
        row.append(eloCell);

        leaderBoard.append(row);

        placement++;
    }
}

async function refreshLeaderBoard(startPos, hitCount) {
    leaderBoard.replaceChildren(leaderBoard.firstElementChild);
    setLeaderBoard(startPos, hitCount);
}

async function getLeaderBoard(startPos, hitCount) {
    var data = { startPos: startPos, hitCount: hitCount }
    var result = await getData('/leaderboard/GetLeaderboard', data);
    return result;
}

function validateSeach(searchValue) {
    if ( searchValue === '' ) {
        return false;
    }

    return true;
}