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
    banReasonWrongFormat: new ResponseData(400, 'Ban reason not submitted correctly'),
    banReasonTooLong: new ResponseData(400, 'Ban reason too long'),
    unbannedUserUndefined: new ResponseData(400, 'No user to ubnan submitted'),
    userNotDefined: new ResponseData(404, 'No user account exists with this ID'),
    chatMessageUndefined: new ResponseData(400, 'No chat message submitted'),
    loadedMessageAmountUndefined: new ResponseData(400, 'No loaded chat message amount submitted'),
    winnerUndefined: new ResponseData(400, 'No winner ID submitted'),
    countryUndefined: new ResponseData(400, 'No country submitted'),
    countryWrongFormat: new ResponseData(400, 'Country not submitted correctly'),
    usernameUndefined: new ResponseData(400, 'No username submitted'),
    usernameWrongFormat: new ResponseData(400, 'Username not submitted correctly'),
    usernameContainsBadWord: new ResponseData(400, 'Username contains blacklisted word'),
    ratingHistoryOptionUndefined: new ResponseData(400, 'No rating history option submitted'),
    ratingHistoryOptionWrongFormat: new ResponseData(400, 'Rating history option not submitted correctly'),
});

export const nullErrors = Object.freeze({
    noMatch: new ResponseData(404, 'No match found'),
});