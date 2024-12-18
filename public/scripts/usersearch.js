import { GetRank } from "../constants/rankData.js";

const userSearchForm = document.getElementById('user-search-form');
const searchInput = document.getElementById('user-search');
const searchResults = document.getElementById('user-search-results');

userSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let searchValue = searchInput.value;

    if ( validateSeach(searchValue) ) {
        let data = { input: searchValue };
        let response = await postData('/user/SearchUser', data);

        addSearchUser(response.data);
        // If success, recreate the table with the retrieved results
    } else {
        alert('Please enter a valid username to search.');
    }
});

async function addSearchUser(users) {
    refreshSearch();
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
            userLink.innerHTML = sanitizeDisplayName(user.username);
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

function sanitizeDisplayName(s) {
    if ( null == s )
        return;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}