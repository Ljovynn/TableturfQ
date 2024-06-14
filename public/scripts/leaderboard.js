const leaderBoard = document.getElementById('leader-board');

const searchInput = document.getElementById('leader-board-search');
const searchButton = document.getElementById('leader-board-search-button');
const pageFilter = document.getElementById('leader-board-page-amount');
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
    console.log('User is searching for the player: ' + searchInput.value);
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
    console.log('Changing the listed amount to ' + pageFilter.value);
    hitCount = pageFilter.value;
    // Reset startPos too?
    refreshLeaderBoard(0, hitCount);
});

for ( let prevButton of prevButtons ) {
    prevButton.addEventListener( 'click', async (e) => {
        if ( page > 0 ) {
            page--;
            console.log('page: ' + page);
            startPos = startPos - hitCount;
            await refreshLeaderBoard(startPos, hitCount);
        }
    });
}

for ( let nextButton of nextButtons ) {
    nextButton.addEventListener( 'click', async (e) => {
        // We have to check against total users and divide by pages
        if ( ( (page+1) * hitCount) + startPos < totalPlayers ) {
            page++;
            console.log('page: ' + page);
            startPos = startPos + hitCount;
            await refreshLeaderBoard(startPos, hitCount);
        }
    });
}

async function setLeaderBoard(startPos, hitCount) {
    result = await getLeaderBoard(startPos, hitCount);
    console.log(result.leaderboardData)
    users = result.leaderboardData.result;
    totalPlayers = result.leaderboardData.totalPlayers;
    console.log('users ' + JSON.stringify(users));
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
    if ( ( (page+1) * hitCount) + startPos > totalPlayers ) {
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
        row.classList.add('leader-board-row');

        let placementCell = document.createElement('div');
        placementCell.classList.add('leader-board-placement');
        placementCell.append(placement);

        let nameCell = document.createElement('div');
        nameCell.classList.add('leader-board-name');
        nameCell.append(user.username);

        let eloCell = document.createElement('div');
        eloCell.classList.add('leader-board-ELO');
        eloCell.append( (Math.round(user.g2_rating * 100) / 100).toFixed(2) );

        row.append(placementCell);
        row.append(nameCell);
        row.append(eloCell);

        leaderBoard.append(row);

        placement++;
    }
}

async function refreshLeaderBoard(startPos, hitCount) {
    console.log('refreshing');
    console.log('startPos: ' + startPos );
    console.log('hitCount: ' + hitCount);
    leaderBoard.replaceChildren(leaderBoard.firstElementChild);
    setLeaderBoard(startPos, hitCount);
}

async function getLeaderBoard(startPos, hitCount) {
    console.log('querying');
    console.log('startPos: ' + startPos );
    console.log('hitCount: ' + hitCount);
    var data = { startPos: startPos, hitCount: hitCount }
    var result = await getData('/leaderboard/GetLeaderboard', data);
    console.log(result);
    return result;
}

function validateSeach(searchValue) {
    if ( searchValue === '' ) {
        return false;
    }

    return true;
}