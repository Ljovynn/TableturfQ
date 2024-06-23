const loggedInLinks = document.getElementsByClassName('index-logged-in-link');
const matchDiv = document.getElementById('index-match-div');
const matchLink = document.getElementById('index-match-link');

var userInfo;
var matchInfo;

setUserInfo();

async function setUserInfo() {
    userInfo = await getUserInfo();
    console.log(userInfo);
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
        link.style.display = 'block';
    }
}

function setMatchLink(matchId) {
    matchLink.setAttribute('href', '/game?matchId=' + matchId);
    matchDiv.style.display = 'block';
}