const searchInput = document.getElementById('leader-board-search');
const searchButton = document.getElementById('leader-board-search-button');
const pageFilter = document.getElementById('leader-board-page-amount');

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

    data = { page: pageValue };
    response = postData('/page', data);
});

function validateSeach(searchValue) {
    if ( searchValue === '' ) {
        return false;
    }

    return true;
}