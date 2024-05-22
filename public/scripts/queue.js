const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const casualUsername = document.getElementById('casual-username');
const competetiveReady = document.getElementById('ready-for-match');

joinCompetetive.addEventListener('click', (e) => {
    console.log('User has joined the competetive queue');

    // Join the queue
    response = postData('/PlayerEnterQue');
});

joinCasual.addEventListener('click', (e) => {
    console.log('User has joined the casual queue');
    console.log('Submitted user name: ' + casualUsername.value);
    displayName = casualUsername.value;

    // Check that there is a username entered
    if (validateDisplayname(displayName)) {
        // Join the queue
        response = postData('/PlayerEnterQue');
    } else {
        alert('Please enter a valid display name.');
    }
});

competetiveReady.addEventListener('click', (e) => {
    console.log('User is ready for competetive match.')

    // Not sure if we need to send any data but we can leave it blank for now
    data = {};

    response = postData('/PlayerReady', data);

    // Redirect to the game room once the game is created
});

function validateDisplayname(displayName) {
    if ( displayName === '' ) {
        return false;
    }

    return true;
}