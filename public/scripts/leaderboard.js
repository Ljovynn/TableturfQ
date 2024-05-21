const searchInput = document.getElementById('leader-board-search');
const searchButton = document.getElementById('leader-board-search-button');
const pageFilter = document.getElementById('leader-board-page-amount');

searchButton.addEventListener('click', (e) => {
    console.log('User is searching for the player: ' + searchInput.value);
});

pageFilter.addEventListener('change', (e) => {
    console.log('Changing the listed amount to ' + pageFilter.value);
});