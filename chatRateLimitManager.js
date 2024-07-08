const messageLimit = 5;
const messageActiveTime = 10 * 1000;

function Message(id){
    this.id = id;
    this.expiresAt = Date.now() + messageActiveTime;
}

var recentMessagesList = [];

export function NewMessage(id){
    recentMessagesList.push(new Message(id));
}

export function CheckChatLimitReached(id){
    var messageAmount = 0;
    var now = Date.now();
    for (let i = 0; i < recentMessagesList.length; i++){
        if (recentMessagesList[i].id == id && recentMessagesList[i].expiresAt > now) messageAmount++;
    }
    if (messageAmount >= messageLimit) return true;
    return false;
}

export function CleanupChatRateLimitList(){
    var now = Date.now();
    for (let i = recentMessagesList.length - 1; i >= 0; i--){
        if (recentMessagesList[i].expiresAt > now) recentMessagesList.splice(i, 1);
    }
}