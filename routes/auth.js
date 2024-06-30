import { Router } from 'express';
import { SerializeSession } from '../utils/session.js';

import axios from 'axios';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

import { GetUserByDiscordId, CreateUserWithDiscord, SetUserDiscord, CreateUser, GetUserData, VerifyAccount } from '../database.js';
import { GenerateNanoId } from '../nanoIdManager.js';
import { CheckUserDefined } from '../utils/checkDefined.js';
import { authErrors, databaseErrors } from '../Responses/authErrors.js';
import { SetResponse } from '../Responses/ResponseData.js';
import { userRoles, usernameMaxLength, usernameMinLength } from '../public/constants/userData.js';
import { definitionErrors } from '../Responses/requestErrors.js';
import { HasBadWords } from '../utils/string.js';

const apiRouteOauth2Token = "https://discord.com/api/v10/oauth2/token";
const apiRouteUserInfo = "https://discord.com/api/v10/users/@me";

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

//req: username
router.post("/unverified/login", async (req, res) => {
    if (CheckUserDefined(req)) return SetResponse(res, authErrors.userLoggedIn);

    const username = req.body.username;
    if (typeof(username) !== 'string') return SetResponse(res, definitionErrors.usernameUndefined);
    if (username.length < usernameMinLength || username.length > usernameMaxLength) return SetResponse(res, definitionErrors.usernameWrongFormat);
    if (HasBadWords(username)) return SetResponse(res, definitionErrors.usernameContainsBadWord);

    const userId = GenerateNanoId();
    await CreateUser(userId, username);

    await SerializeSession(req, userId);

    res.sendStatus(201);
});

router.get("/discord/redirect", async (req, res) => {
    const { code } = req.query;

    const userId = req.session.user;

    if (!code){
        res.writeHead(301, {
            Location: `${websiteURL}`
        }).end();
        return;
    }

    try{
        const formData = new url.URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `${websiteURL}/api/auth/discord/redirect`,//'http://localhost:8080/api/auth/discord/redirect'
        });
    
        const response = await axios.post(apiRouteOauth2Token,
            formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const {access_token, refresh_token} = response.data;
    
        if (response.data) {

            const newUserId = await StoreUserData(access_token, refresh_token, userId);

            if (!newUserId) return SetResponse(res, databaseErrors.verifiedCreateError);
            await SerializeSession(req, newUserId);
    
            //refresh token
            /*const requestFormData = new url.URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: output.data.refresh_token,
            });
    
            const refresh = await AxiosPost(requestFormData, apiRouteOauth2Token);*/
            
            res.writeHead(301, {
                Location: `${websiteURL}`
            }).end();
            //res.end();
        }
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

export default router;

async function StoreUserData(accessToken, refreshToken, userId){
    const response = await axios.get(apiRouteUserInfo, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    var avatar = null;
    if (response.data.avatar) avatar = HandleAvatarGif(response.data.avatar);

    //If logged in to account, update that account
    if (userId){
        var user = await GetUserData(userId);
        if (user && user.role == userRoles.unverified){
            await VerifyAccount(userId, response.data.id, response.data.username, accessToken, refreshToken, avatar);
            return userId;
        }
    }

    var newUser = await GetUserByDiscordId(response.data.id);
    var newUserId;
    if (!newUser){
        newUserId = GenerateNanoId();

        var username = response.data.global_name;
        if (!username) username = response.data.username;

        await CreateUserWithDiscord(newUserId, username, response.data.id, response.data.username, accessToken, refreshToken, avatar);
    } else {
        newUserId = newUser.id;
        await SetUserDiscord(newUserId, response.data.id, response.data.username, accessToken, refreshToken, avatar); 
    }
    return newUserId;
}

function HandleAvatarGif(avatar){
    if (avatar.slice(0, 2) === 'a_') return avatar.slice(2);
    return avatar;
}