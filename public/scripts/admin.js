const loading = document.getElementById('admin-loading');
const disputedMatchContent = document.getElementById('admin-disputed-matches');
const disputedMatchesList = document.getElementById('admin-disputed-matches-list');

var isAdmin = false;
var disputeOptions = {
	0: 'No Change',
	1: 'Reset Current Game',
	2: 'Restart Match',
	3: 'Cancel Match',
	4: 'Player 1 Wins Current Game',
	5: 'Player 2 Wins Current Game',
	6: 'Player 1 Wins Match',
	7: 'Player 2 Wins Match'
}


await checkUserAdmin();

if ( isAdmin ) {
	console.log('user is admin!');
	getDisputedMatches();
}

async function checkUserAdmin() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    console.log(result);
    if ( result.user.role == 2 ) {
    	isAdmin = true;
    	loading.style.display = 'none';
    	disputedMatchContent.style.display = 'block';
    }
}

async function getDisputedMatches() {
	var data = {};
    console.log(data);
    var result = await fetchData('/admin/GetDisputedMatchesList', data);
    var disputedMatches = result;

    console.log(disputedMatches);
    for ( let match of disputedMatches ) {
    	var players = await getMatchUsers( [match.players[0].id, match.players[1].id] );
    	addDisputedMatch(match, players);
    }
}

function addDisputedMatch(match, players) {
	console.log(players);
	var scores = [];
	scores[players[0].id] = 0;
	scores[players[1].id] = 0;

	for ( let game of match.gamesArr ) {
		if ( game.winnerId != 0 )
			scores[game.winnerId]++;
	}

	console.log(scores);
	let row = document.createElement('div');
    row.classList.add('disputed-match-row');

    let playersCell = document.createElement('div');
    playersCell.classList.add('admin-disputed-match-players');
    let playersString = players[0].username + ' ' + scores[players[0].id] + ' vs ' + players[1].username + ' ' + scores[players[1].id]
    playersCell.append(playersString);

    let actionCell = document.createElement('div');
    actionCell.classList.add('admin-disputed-match-action');

    let selectOption = document.createElement('select');
    selectOption.classList.add('admin-dispute-options');
    selectOption.setAttribute('id', 'match-action-' + match.id);

    for ( var i=0; i <= 7; i++ ) {
    	console.log('Appending ' + disputeOptions[i]);
    	let optionValue = document.createElement('option');
    	optionValue.setAttribute('value', i);
    	optionValue.append(disputeOptions[i]);
    	selectOption.append(optionValue);
    }

    let submitButton = document.createElement('button');
	submitButton.classList.add('admin-dispute-resolve');
	submitButton.setAttribute('id', 'match-resolve-' + match.id);
	submitButton.append('Resolve Dispute');

    actionCell.append(selectOption);
    actionCell.append(submitButton);

    row.append(playersCell);
    row.append(actionCell);
    disputedMatchesList.append(row);
}

async function getMatchUsers(users) {
    var data = { userIdList: users };
    console.log(data);
    var result = await getData('/user/GetUsers', data);
    return result;
}