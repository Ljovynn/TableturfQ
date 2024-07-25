const loginContent = document.getElementById('login-content');
const loggedInLinks = document.getElementsByClassName('index-logged-in-link');
const profileDiv = document.getElementById('index-profile-div');
const profileLink = document.getElementById('profile-link');
const matchDiv = document.getElementById('index-match-div');
const matchLink = document.getElementById('index-match-link');

const guestName = document.getElementById('guest-login-name');
const guestSubmit = document.getElementById('guest-login-button');

const nextAnnouncement = document.getElementById('next-announcement');
const upcomingAnnouncements = document.getElementById('upcoming-announcements');

var userInfo;
var matchInfo;
var isGuest;

setUserInfo();
setAnnouncements();

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

async function setAnnouncements() {
    try {
        var announcement = await getNextAnnouncement();
        console.log(announcement);
        if ( announcement ) {
            console.log('adding');
            addNextAnnouncement(announcement);
            nextAnnouncement.style.display = 'block';

            // If there's no next announcement, there can't be any upcoming ones right?
            var announcements = await getUpcomingAnnouncements();
            console.log(announcements);
            if ( announcements ) {
                upcomingAnnouncements.style.display = 'block';
                addUpcomingAnnouncements(announcements);
            }
        }
    } catch (error) {
        //
        console.log(error);
    }
}

async function getNextAnnouncement() {
    var result = await fetchData('/announcementInfo/GetNextAnnouncement');
    return result;
}

function addNextAnnouncement(announcement) {
    let announcementDiv = document.createElement('div');
    let announcementTitle = document.createElement('h4');
    announcementTitle.innerHTML = announcement.title;

    let announcementIcon = document.createElement('img');
    announcementIcon.classList.add('announcement-icon');
    announcementIcon.src = announcement.iconSrc;

    let announcementDate = document.createElement('div');
    announcementDate.classList.add('announcement-date');
    announcementDate.innerHTML = new Date(announcement.date*1000).toLocaleString();

    let announcementDescription = document.createElement('p');
    announcementDescription.innerHTML = announcement.description;

    announcementDiv.append(announcementTitle);
    announcementDiv.append(announcementIcon);
    announcementDiv.append(announcementDate);
    announcementDiv.append(announcementDescription);

    nextAnnouncement.append(announcementDiv);
}

async function getUpcomingAnnouncements() {
    var result = await fetchData('/announcementInfo/GetUpcomingAnnouncements');
    return result;
}

function addUpcomingAnnouncements(announcements) {
    // Get rid of the first one since we already displayed it as the next announcement
    announcements.shift();
    for( let announcement of announcements ) {
        let upcomingAnnouncement = document.createElement('div');
        upcomingAnnouncement.classList.add('upcoming-announcement');

        let upcomingTitle = document.createElement('h4');
        upcomingTitle.innerHTML = announcement.title;

        let upcomingIcon = document.createElement('img');
        upcomingIcon.classList.add('announcement-icon');
        upcomingIcon.src = announcement.iconSrc;

        var upcomingDate = document.createElement('div');
        upcomingDate.classList.add('announcement-date');
        upcomingDate.innerHTML = new Date(announcement.date*1000).toLocaleString();

        let upcomingDescription = document.createElement('p');
        upcomingDescription.innerHTML = announcement.description;

        upcomingAnnouncement.append(upcomingTitle);
        upcomingAnnouncement.append(upcomingIcon);
        upcomingAnnouncement.append(upcomingDate);
        upcomingAnnouncement.append(upcomingDescription);

        upcomingAnnouncements.append(upcomingAnnouncement);
    }
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