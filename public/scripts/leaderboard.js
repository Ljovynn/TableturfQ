const leaderBoard = document.getElementById('leader-board');

const searchInput = document.getElementById('leader-board-search');
const searchButton = document.getElementById('leader-board-search-button');
const pageFilter = document.getElementById('leader-board-page-amount');

var leaderBoardData;

// Defaults of startPos 0 and 15 hitcounts
setLeaderBoard(0, 10);

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
    var pageValue = pageFilter.value;

    refreshLeaderBoard(0, pageValue);
});

async function setLeaderBoard(startPos, hitCount) {
    leaderBoardData = await getLeaderBoard(startPos, hitCount);
    users = leaderBoardData.leaderboardData.result;
    console.log('users ' + JSON.stringify(users));
    var placement = 1 + startPos;

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
    leaderBoard.replaceChildren(leaderBoard.firstElementChild);

    setLeaderBoard(startPos, hitCount);
}

async function getLeaderBoard(startPos, hitCount) {
    var data = { startPos: 0, hitCount: 15 }
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