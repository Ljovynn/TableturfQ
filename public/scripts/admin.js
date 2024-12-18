const loading = document.getElementById('admin-loading');
const disputedMatchContent = document.getElementById('admin-disputed-matches');
const disputedMatchesList = document.getElementById('admin-disputed-matches-list');

const resolveButtons = document.getElementsByClassName('admin-dispute-resolve');

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
	getDisputedMatches();
}

/*for (let resolutionButton of resolveButtons ) {
    resolutionButton.addEventListener('click', async (e) => {
    	var matchId = resolutionButton.value;
    	var resolveOption = document.getElementById('match-resolve-' + matchId);

        var data = { matchId: matchId, resolveOption: parseInt(resolveOption) };
        var response = await postData('/admin/ResolveDispute', data);
        
    });
}*/

async function checkUserAdmin() {
    let data = {};
    let result = await fetchData('/user/GetUserInfo');
    if ( result.user.role == 2 ) {
    	isAdmin = true;
    	loading.style.display = 'none';
    	disputedMatchContent.style.display = 'block';
    }
}

async function getDisputedMatches() {
	let data = {};
    let result = await fetchData('/admin/GetDisputedMatchesList', data);
    let disputedMatches = result;

    for ( let match of disputedMatches ) {
    	let players = await getMatchUsers( [match.players[0].id, match.players[1].id] );
    	await addDisputedMatch(match, players);
    }
}

async function addDisputedMatch(match, players) {
	let scores = [];
	scores[players[0].id] = 0;
	scores[players[1].id] = 0;

	for ( let game of match.gamesArr ) {
		if ( game.winnerId != 0 )
			scores[game.winnerId]++;
	}

	let row = document.createElement('div');
    row.classList.add('disputed-match-row');
    row.setAttribute('id', 'disputed-match-row-' + match.id);

    let playersCell = document.createElement('div');
    playersCell.classList.add('admin-disputed-match-players');
    let playersString = sanitizeDisplayName( players[0].username ) + ' ' + scores[players[0].id] + ' vs ' + sanitizeDisplayName( players[1].username ) + ' ' + scores[players[1].id]
    playersCell.append(playersString);

    let actionCell = document.createElement('div');
    actionCell.classList.add('admin-disputed-match-action');

    let selectOption = document.createElement('select');
    selectOption.classList.add('admin-dispute-options');
    selectOption.setAttribute('id', 'match-action-' + match.id);

    for ( let i=0; i <= 7; i++ ) {
    	let optionValue = document.createElement('option');
    	optionValue.setAttribute('value', i);
    	optionValue.append(disputeOptions[i]);
    	selectOption.append(optionValue);
    }

    let submitButton = document.createElement('button');
	submitButton.classList.add('admin-dispute-resolve');
	submitButton.setAttribute('id', 'match-resolve-' + match.id);
	submitButton.setAttribute('value', match.id);
	submitButton.append('Resolve Dispute');

    actionCell.append(selectOption);
    actionCell.append(submitButton);

    row.append(playersCell);
    row.append(actionCell);
    disputedMatchesList.append(row);

    await setListeners();
}

async function getMatchUsers(users) {
    let data = { userIdList: users };
    let result = await getData('/user/GetUsers', data);
    return result;
}

async function setListeners() {
	for (let resolutionButton of resolveButtons ) {
	    resolutionButton.addEventListener('click', async (e) => {
		    	let matchId = resolutionButton.value;
		    	let resolveOption = document.getElementById('match-action-' + matchId);

		        let data = { matchId: matchId, resolveOption: parseInt(resolveOption.value) };
		        let response = await postData('/admin/ResolveDispute', data);
		        if ( response == 201 ) {
		        	let disputedRow = document.getElementById('disputed-match-row-' + matchId);
		        	disputedRow.remove();
		        }
	    });
	}
}

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}