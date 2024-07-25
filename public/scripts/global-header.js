const loggedInLinks = document.getElementsByClassName('index-logged-in-link');
const profileDiv = document.getElementById('index-profile-div');
const profileLink = document.getElementById('profile-link');
const matchDiv = document.getElementById('index-match-div');
const matchLink = document.getElementById('index-match-link');
const logOut = document.getElementById('header-logout-div');

var userInfo;

setUserInfo();

logOut.addEventListener('click', async (e) => {
    var response = await postData('/user/DeleteUserLoginData');
    if ( response == 201 ) {
        window.location.href = '/';
    }
});

async function setUserInfo() {
    userInfo = await getUserInfo();
    console.log(userInfo)
    if ( userInfo.user.id ) {
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

function setLoggedInLinks() {
    for ( let link of loggedInLinks ) {
        link.style.display = 'inline-block';
    }

    if ( !userInfo.user.discord_id ) {
        profileDiv.style.display = 'none';
    } else {
        profileLink.href = '/profile?playerId=' + userInfo.user.id;
    }
}

function setMatchLink(matchId) {
    matchLink.setAttribute('href', '/game?matchId=' + matchId);
    matchDiv.style.display = 'inline-block';
}