import { GetRank } from "../constants/rankData.js";

const userSearchForm = document.getElementById('user-search-form');
const searchInput = document.getElementById('user-search');
const searchResults = document.getElementById('user-search-results');

userSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    var searchValue = searchInput.value;

    if ( validateSeach(searchValue) ) {
        var data = { input: searchValue };
        var response = await getData('/user/SearchUser', data);

        addSearchUser(response);
        // If success, recreate the table with the retrieved results
    } else {
        alert('Please enter a valid username to search.');
    }
});

async function addSearchUser(users) {
    refreshSearch();
    console.log(users);
    if ( users.length != 0 ) {
        for (  let user of users ) {
            let row = document.createElement('div');
            row.classList.add('user-search-row');

            let avatarCell = document.createElement('div');

            let avatarImage = document.createElement('img');
            avatarImage.classList.add('user-search-avatar')
            let avatarString = '';
            if ( user.discord_avatar_hash ) {
                avatarString = 'https://cdn.discordapp.com/avatars/' + user.discord_id + '/' + user.discord_avatar_hash + '.jpg' + '?size=512';
            } else {
                avatarString = '/assets/images/chumper.png';
            }
            avatarImage.src = avatarString;
            avatarCell.append(avatarImage);

            let nameCell = document.createElement('div');
            nameCell.classList.add('user-search-name');

            let userLink = document.createElement('a');
            userLink.href = '/profile?playerId=' + user.id;
            userLink.setAttribute('target', '_blank');
            userLink.append(user.username);
            nameCell.append(userLink);

            row.append(avatarCell);
            row.append(nameCell);
            
            let eloCell = document.createElement('div');
            eloCell.classList.add('user-search-ELO');
            let ratingString = ( user.g2_rating ) ? Math.floor(user.g2_rating) : 'Unranked';
            eloCell.append(ratingString);

            let rankCell = document.createElement('div');
            rankCell.classList.add('user-search-rank');
            let userRank = GetRank(user.g2_rating);
            let rankImage = document.createElement('img');
            rankImage.classList.add('user-search-rank-icon')
            console.log(userRank);
            rankImage.src = userRank.imageURL;
            rankCell.append(rankImage);

            row.append(eloCell);
            row.append(rankCell);

            searchResults.append(row);
        }
    } else {
        let noResultsCell = document.createElement('div');
        noResultsCell.classList.add('user-search-no-results');
        noResultsCell.innerHTML = 'No users found.';
        searchResults.append(noResultsCell);
    }
}

function refreshSearch() {
    searchResults.replaceChildren(searchResults.firstElementChild);
}

function validateSeach(searchValue) {
    if ( searchValue === '' ) {
        return false;
    }

    return true;
}