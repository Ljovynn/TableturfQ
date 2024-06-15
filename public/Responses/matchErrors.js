export const matchCreatingErrors = Object.freeze({ 
    databaseError: 'Database couldn\'t create match',
});

export const stageStrikeErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    wrongStatus: 'Match is not in stage selection',
    stageAmountIncorrect: 'Wrong amount of stages striked',
    wrongPlayer: 'Other player should be striking stages',
    stageNotInStagelist: 'Stage is not in the stage list',
    stageAlreadyStriked: 'Stage is not already striked',
    DSRunpickable: 'Opponent won on that stage in a previous game',
});

export const stagePickErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    wrongStatus: 'Match is not in stage selection',
    stageNotInStagelist: 'Stage is not in the stage list',
    stageStriked: 'Stage is striked',
    DSRunpickable: 'Player won on that stage in a previous game',
    wrongPlayer: 'Other player should be picking a stage',
    notEnoughStrikes: 'Other player has to strike more stages first',
});

export const gameWinErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    casual: 'Match is casual',
    wrongStatus: 'Match is not in gameplay status',
    databaseError: 'Database error when finishing match'
});

export const casualMatchEndErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    inDispute: 'Match is in dispute',
    notCasual: 'Match isn\'t casual',
    databaseError: 'Database error when finishing match'
});

export const chatMessageErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    matchDoesntExist: 'Match is not active',
    badWords: 'Message includes a blacklisted word',
});

export const disputeErrors = Object.freeze({ 
    noMatch: 'Player isn\'t in any match',
    alreadyDispute: 'Match is already in dispute',

});

export const resolveErrors = Object.freeze({ 
    matchDoesntExist: 'Match is not active',
    notDisputed: 'Match is not in dispute',
    databaseError: 'Database error when finishing match',
    illegalResolveOption: 'Not a viable resolve option'
});