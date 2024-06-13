const userDiscordName = document.getElementById('user-discord-name');
const userDisplayNameContent = document.getElementById('user-in-game-name');
const userDisplayName =  document.getElementById('user-in-game-name-value');
const userProfilePicture = document.getElementById('user-profile-picture');
const editDisplayName = document.getElementById('user-profile-edit-name');
const editDisplayNameForm = document.getElementById('user-profile-edit-name-form');
const displayNameInput = document.getElementById('user-profile-name-input');
const displayNameSubmit = document.getElementById('user-profile-name-submit');
const editDisplayNameClose = document.getElementById('user-profile-edit-close');

var user;
var userId;
var discordId;
var discordAvatarHash;
var username;
var userInfo;

setUserInfo();


editDisplayName.addEventListener('click', (e) => {
    console.log('User clicked the display name edit button');
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

editDisplayNameClose.addEventListener('click', (e) => {
    console.log('User clicked the edit display name close button');
    editDisplayNameForm.classList.toggle('editing');
    userDisplayNameContent.classList.toggle('editing');
});

displayNameSubmit.addEventListener('click', (e) => {
    newDisplayName = displayNameInput.value;
    console.log('User submitted display name edit: ' + newDisplayName);
    // Validate the name update
    if ( validateDisplayName(newDisplayName) ) {

        data = { userDisplayName: newDisplayName };
        response = postData('/user/EditInGameName', data);

        // On successful response
        editDisplayNameForm.classList.toggle('editing');
        userDisplayNameContent.classList.toggle('editing');
        displayNameInput.value = '';
        userDisplayName.textContent = newDisplayName;
    } else {
        alert('The submitted display name is invalid. Please try again.');
    }
});

async function getUserInfo() {
    var data = {};
    var result = await fetchData('/user/GetUserInfo');
    return result;
}

async function setUserInfo() {
    userInfo = await getUserInfo();
    console.log(userInfo);

    user = userInfo.user;
    username = user.username;
    discordId = user.discord_id;
    discordAvatarHash = user.discord_avatar_hash;

    userDiscordName.innerHTML = username;
    avatarString = 'https://cdn.discordapp.com/avatars/' + discordId + '/' + discordAvatarHash + '.jpg';
    userProfilePicture.src = avatarString;

}

function validateDisplayName(newDisplayName) {
    // Just validate the name isn't empty for now
    if ( newDisplayName === '' ) {
        return false;
    }

    return true;
}