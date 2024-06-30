import { ResponseData } from "./ResponseData.js";

export const nullErrors = Object.freeze({ 
    noMatch: new ResponseData(403, 'Player isn\'t in any match'),
    matchDoesntExist: new ResponseData(404, 'Match is not active or doesnt\'t exist'),
});

export const databaseErrors = Object.freeze({ 
    matchCreateError: new ResponseData(500, 'Database couldn\'t create match'),
    matchFinishError: new ResponseData(500, 'Database couldn\'t finish match'),
});

export const stageStrikeErrors = Object.freeze({ 
    wrongStatus: new ResponseData(403, 'Match is not in stage selection'),
    stageAmountIncorrect: new ResponseData(403, 'Wrong amount of stages striked'),
    wrongPlayer: new ResponseData(403, 'Other player should be striking stages'),
    stageNotInStagelist: new ResponseData(403, 'Stage is not in the stage list'),
    stageAlreadyStriked: new ResponseData(403, 'Stage is not already striked'),
    DSRunpickable: new ResponseData(403, 'Opponent won on that stage in a previous game'),
});

export const stagePickErrors = Object.freeze({ 
    wrongStatus: new ResponseData(403, 'Match is not in stage selection'),
    stageNotInStagelist: new ResponseData(403, 'Stage is not in the stage list'),
    stageStriked: new ResponseData(403, 'Stage is striked'),
    DSRunpickable: new ResponseData(403, 'Player won on that stage in a previous game'),
    wrongPlayer: new ResponseData(403, 'Other player should be picking a stage'),
    notEnoughStrikes: new ResponseData(403, 'Other player has to strike more stages first'),
});

export const gameWinErrors = Object.freeze({ 
    casual: new ResponseData(403, 'Match is casual'),
    wrongStatus: new ResponseData(403, 'Match is not in gameplay status'),
});

export const casualMatchEndErrors = Object.freeze({ 
    inDispute: new ResponseData(403, 'Match is in dispute'),
    notCasual: new ResponseData(403, 'Match isn\'t casual'),
});

export const chatMessageErrors = Object.freeze({ 
    badWords: new ResponseData(403, 'Message includes a blacklisted word'),
    notInMatch: new ResponseData(403, 'User is not a player in that match'),
});

export const disputeErrors = Object.freeze({ 
    alreadyDispute: new ResponseData(403, 'Match is already in dispute'),
    privateBattle: new ResponseData(403, 'Match is a private battle'),
});

export const forfeitErrors = Object.freeze({ 
    casual: new ResponseData(403, 'Match is casual'),
});


export const resolveErrors = Object.freeze({ 
    notDisputed: new ResponseData(403, 'Match is not in dispute'),
    alreadyConfirmed: new ResponseData(403, 'Player has already sent a resolve confirmation'),
    illegalResolveOption: new ResponseData(400, 'Not a viable resolve option'),
});