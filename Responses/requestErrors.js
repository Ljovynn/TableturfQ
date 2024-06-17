import { ResponseData } from "./ResponseData.js";

export const userErrors = Object.freeze({ 
    notLoggedIn: new ResponseData(401, 'User not logged in'),
    notAdmin: new ResponseData(403, 'User is not an admin'),
    banned: new ResponseData(403, 'User is banned'),
    unverified: new ResponseData(403, 'User is not discord verified'),
    noAccess: new ResponseData(403, 'User has no access'),
});

export const definitionErrors = Object.freeze({ 
    stageUndefined: new ResponseData(400, 'No stage submitted'),
    stagesUndefined: new ResponseData(400, 'No stages submitted'),
    matchUndefined: new ResponseData(400, 'No match id submitted'),
    matchModeUndefined: new ResponseData(400, 'No match mode submitted'),
    resolveOptionUndefined: new ResponseData(400, 'No resolve option submitted'),
    bannedUserUndefined: new ResponseData(400, 'No user to ban submitted'),
    banLengthWrongFormat: new ResponseData(400, 'Ban length not submitted correctly'),
    unbannedUserUndefined: new ResponseData(400, 'No user to ubnan submitted'),
    userNotDefined: new ResponseData(404, 'No user account exists with this ID'),
    chatMessageUndefined: new ResponseData(400, 'No chat message submitted'),
    winnerUndefined: new ResponseData(400, 'No winner ID submitted'),
});

export const nullErrors = Object.freeze({
    noMatch: new ResponseData(404, 'No match found'),
});