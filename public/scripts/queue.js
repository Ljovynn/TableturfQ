const joinCompetetive = document.getElementById('join-competetive-queue');
const joinCasual = document.getElementById('join-casual-queue');
const casualUsername = document.getElementById('casual-username');
const readyButton = document.getElementById('ranked-match-ready-button');
const queueMatchmaking = document.getElementById('queue-matchmaking');
const matchMakingReady = document.getElementById('ranked-match-ready');

const socket = io();

joinCompetetive.addEventListener('click', async (e) => {
    console.log('User has joined the competetive queue');
    data = { matchMode: 'ranked' }

    // Join the queue
    response = await postData('/PlayerEnterQue', data);
    console.log('Response data: ' + JSON.stringify(response));
    if ( response == 201 ) {
        // Do queue frontend stuff
        alert('Successfully joined the queue!');
        queueMatchmaking.style.display = 'block';
        window.setInterval(updateTimer, 1000);
        // Socket matchfound code
        matchMakingReady.style.display = 'block';
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

readyButton.addEventListener('click', async (e) => {
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

var timer = 0;

function updateTimer() {
    timer += 1;
    time = secondsToHMS(timer);
    document.getElementById('queue-timer').innerHTML = 'Finding Match... ' + time;    
}

function secondsToHMS(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

socket.emit('join', 'queRoom');

socket.on('matchesFound', (matchedPlayersData) => {
    console.log('Socket event match ready');
    console.log(matchedPlayersData);
    window.location.href = '/game';
});