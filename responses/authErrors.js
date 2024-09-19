import { ResponseData } from "./ResponseData.js";

export const databaseErrors = Object.freeze({ 
    unverifiedCreateError: new ResponseData(500, 'Database couldn\'t create unverified user'),
    verifiedCreateError: new ResponseData(500, 'Database couldn\'t create verified user'),
});

export const authErrors = Object.freeze({ 
    userLoggedIn: new ResponseData(403, 'User is already logged in'),
    verifiedCreateError: new ResponseData(500, 'Database couldn\'t create verified user'),
    avatarRefreshLimit: new ResponseData(403, 'Avatar refresh limit reached'),
});