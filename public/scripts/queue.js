const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const casualUsername = document.getElementById('casual-username');
const competetiveReady = document.getElementById('ready-for-match');

joinCompetetive.addEventListener('click', async (e) => {
    console.log('User has joined the competetive queue');
    data = { matchMode: 'ranked' }

    // Join the queue
    response = await postData('/PlayerEnterQue', data);
    console.log('Response data: ' + JSON.stringify(response));
    if ( response == 201 ) {
        // Do queue frontend stuff
        alert('Successfully joined the queue!');
    } else {
        alert('There was a problem joining the queue. Please refresh and try again');
    }
});

joinCasual.addEventListener('click', async (e) => {
    console.log('User has joined the casual queue');
    console.log('Submitted user name: ' + casualUsername.value);
    displayName = casualUsername.value;

    // Check that there is a username entered
    if (validateDisplayname(displayName)) {
        data = { matchMode: 'casual' }
        // Join the queue
        response = await postData('/PlayerEnterQue', data);
    } else {
        alert('Please enter a valid display name.');
    }
});

competetiveReady.addEventListener('click', async (e) => {
    console.log('User is ready for competetive match.')

    // Not sure if we need to send any data but we can leave it blank for now

    response = await postData('/PlayerReady');

    // Redirect to the game room once the game is created
});

function validateDisplayname(displayName) {
    if ( displayName === '' ) {
        return false;
    }

    return true;
}