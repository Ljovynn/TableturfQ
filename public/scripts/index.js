const loginContent = document.getElementById('login-content');
const loggedInLinks = document.getElementsByClassName('index-logged-in-link');
const profileLink = document.getElementById('profile-link');
const matchDiv = document.getElementById('index-match-div');
const matchLink = document.getElementById('index-match-link');

const guestName = document.getElementById('guest-login-name');
const guestSubmit = document.getElementById('guest-login-button');

var userInfo;
var matchInfo;
var isGuest;

setUserInfo();

guestSubmit.addEventListener('click', async (e) => {
    if ( validateDisplayname(guestName.value) ) {
        var data = { username: guestName.value };
        var response = await postData('/api/auth/unverified/login', data);
        console.log(response);
        if ( response == 201 ) {
            window.location.href = '/queue';
        }
    }
});

async function setUserInfo() {
    userInfo = await getUserInfo();
    console.log(userInfo);
    if ( userInfo.user.id ) {
        hideLogInOptions();
        setLoggedInLinks();
    }

    if ( userInfo.matchId ) {
        setMatchLink(userInfo.matchId.id);
    }
}

async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}

function hideLogInOptions() {
    loginContent.style.display = 'none';
}

function setLoggedInLinks() {
    for ( let link of loggedInLinks ) {
        link.style.display = 'block';
    }

    if ( !userInfo.user.discord_id ) {
        profileLink.style.display = 'none';
    }
}

function setMatchLink(matchId) {
    matchLink.setAttribute('href', '/game?matchId=' + matchId);
    matchDiv.style.display = 'block';
}

function validateDisplayname(displayName) {
    if ( displayName === '' ) {
        return false;
    }

    if (displayName.length < 2 || displayName.length > 32) {
        return false;
    }

    return true;
}