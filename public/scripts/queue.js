 const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const casualUsername = document.getElementById('casual-username');
const competetiveReady = document.getElementById('ready-for-match');

joinCompetetive.addEventListener('click', (e) => {
    console.log('User has joined the competetive queue');

    // Join the queue
});

joinCasual.addEventListener('click', (e) => {
    console.log('User has joined the casual queue');
    console.log('Submitted user name: ' + casualUsername.value);

    // Check that there is a username entered
    // Join the queue
});

competetiveReady.addEventListener('click', (e) => {
    console.log('User is ready for competetive match.')

    // Redirect to the game room once the game is created
});