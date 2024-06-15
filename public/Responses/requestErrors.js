export const userErrors = Object.freeze({ 
    notLoggedIn: 'User isn\'t logged in',
    notAdmin: 'User is not an admin',
    banned: 'User is banned',
    unverified: 'User is not discord verified',
    noAccess: 'User has no access',
});

export const definitionErrors = Object.freeze({ 
    stageUndefined: 'No stage submitted',
    stagesUndefined: 'No stages submitted',
    matchUndefined: 'No match id submitted',
    matchModeUndefined: 'No match mode submitted',
    resolveOptionUndefined: 'No resolve option submitted',
    bannedUserUndefined: 'No user to ban submitted',
    unbannedUserUndefined: 'No user to ubnan submitted',
    userNotDefined: 'No user account exists with this ID',
    chatMessageUndefined: 'No chat message submitted',
    winnerUndefined: 'No winner ID submitted',
});

export const nullErrors = Object.freeze({
    noMatch: 'No match found',
});