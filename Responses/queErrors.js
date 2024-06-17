import { ResponseData } from "./ResponseData.js";

export const enterQueErrors = Object.freeze({ 
    inQue: new ResponseData(403, 'Player is already in que'),
    inMatch: new ResponseData(403, 'Player is currently in a match'),
    noUser: new ResponseData(404, 'Can\'t find user'),
    banned: new ResponseData(403, 'User is banned'),
    unverified: new ResponseData(403, 'User is unverified'),
    illagelMatchMode: new ResponseData(400, 'Not a viable match mode'),
    queUnavailible: new ResponseData(403, 'Que is unavailible'),
});

export const readyUpErrors = Object.freeze({ 
    notMatched: new ResponseData(403, 'Player isn\'t put in a match'),
});