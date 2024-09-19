const messageLimit = 5;
const messageActiveTime = 10 * 1000;

const avatarRefreshTime = 5 * 60 * 1000;

function Message(id){
    this.id = id;
    this.expiresAt = Date.now() + messageActiveTime;
}

function AvatarRefresh(id){
    this.id = id;
    this.expiresAt = Date.now() + avatarRefreshTime;
}

var recentMessagesList = [];
var recentAvatarRefreshList = [];

export function NewMessage(id){
    recentMessagesList.push(new Message(id));
}

export function NewAvatarRefresh(id){
    recentAvatarRefreshList.push(new AvatarRefresh(id));
}

export function CheckChatLimitReached(id){
    let messageAmount = 0;
    let now = Date.now();
    for (let i = 0; i < recentMessagesList.length; i++){
        if (recentMessagesList[i].id == id && recentMessagesList[i].expiresAt > now) messageAmount++;
    }
    if (messageAmount >= messageLimit) return true;
    return false;
}

export function CheckAvatarRefreshLimit(id){
    let now = Date.now();
    for (let i = 0; i < recentAvatarRefreshList.length; i++){
        if (recentAvatarRefreshList[i].id == id && recentAvatarRefreshList[i].expiresAt > now) return true;
    }
    return false;
}

export function CleanupChatRateLimitList(){
    let now = Date.now();
    for (let i = recentMessagesList.length - 1; i >= 0; i--){
        if (recentMessagesList[i].expiresAt > now) recentMessagesList.splice(i, 1);
    }
}

export function CleanupAvatarRefreshList(){
    let now = Date.now();
    for (let i = recentAvatarRefreshList.length - 1; i >= 0; i--){
        if (recentAvatarRefreshList[i].expiresAt > now) recentAvatarRefreshList.splice(i, 1);
    }
}