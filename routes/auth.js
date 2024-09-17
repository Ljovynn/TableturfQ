import { Router } from 'express';
import { SerializeSession } from '../utils/session.js';

import axios from 'axios';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

import { GetUserByDiscordId, CreateUserWithDiscord, SetUserDiscord, CreateUser, GetUserData, VerifyAccount, GetUserLoginData } from '../database.js';
import { GenerateNanoId } from '../nanoIdManager.js';
import { CheckUserDefined } from '../utils/checkDefined.js';
import { authErrors, databaseErrors } from '../responses/authErrors.js';
import { SetErrorResponse } from '../responses/ResponseData.js';
import { userRoles, usernameMaxLength, usernameMinLength } from '../public/constants/userData.js';
import { definitionErrors } from '../responses/requestErrors.js';
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
    if (CheckUserDefined(req)) return SetErrorResponse(res, authErrors.userLoggedIn);

    const username = req.body.username;
    if (typeof(username) !== 'string') return SetErrorResponse(res, definitionErrors.usernameUndefined);
    if (username.length < usernameMinLength || username.length > usernameMaxLength) return SetErrorResponse(res, definitionErrors.usernameWrongFormat);
    if (HasBadWords(username)) return SetErrorResponse(res, definitionErrors.usernameContainsBadWord);

    const userId = GenerateNanoId();

    try{
        await CreateUser(userId, username);

        await SerializeSession(req, userId);
    }catch(error){
        console.log(error);
        res.sendStatus(400);
    }

    res.status(201).send({});
});

//req: userId
router.post("/discord/updateAvatar", async (req, res) => {
    const userId = req.body.userId;
    if (typeof(userId) !== 'string') return SetErrorResponse(res, definitionErrors.userNotDefined);
    try{
        const userData = await GetUserLoginData(userId);
        if (!userData || userData.discord_id == null) return SetErrorResponse(res, definitionErrors.userNotDefined);

        const formData = new url.URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: userData.discord_refresh_token,
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

            await StoreUserData(access_token, refresh_token);
            
            res.status(200).send({});
        }
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
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

            if (!newUserId) return SetErrorResponse(res, databaseErrors.verifiedCreateError);
            await SerializeSession(req, newUserId);
            
            res.writeHead(301, {
                Location: `${websiteURL}`
            }).end();
        }
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

export default router;

async function StoreUserData(accessToken, refreshToken, userId = undefined){
    const response = await axios.get(apiRouteUserInfo, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    let avatar = null;
    if (response.data.avatar) avatar = HandleAvatarGif(response.data.avatar);

    let discordUser = await GetUserByDiscordId(response.data.id);
    if (!discordUser){
        //If logged in to unverified account, update that account
        if (userId){
            let user = await GetUserData(userId);
            if (user){
                await VerifyAccount(userId, response.data.id, response.data.username, accessToken, refreshToken, avatar);
                return userId;
            }
        }

        let newUserId = GenerateNanoId();

        let username = response.data.global_name;
        if (!username) username = response.data.username;

        await CreateUserWithDiscord(newUserId, username, response.data.id, response.data.username, accessToken, refreshToken, avatar);
        return newUserId;
    } else {
        await SetUserDiscord(discordUser.id, response.data.id, response.data.username, accessToken, refreshToken, avatar); 
        return discordUser.id;
    }
}

function HandleAvatarGif(avatar){
    if (avatar.slice(0, 2) === 'a_') return avatar.slice(2);
    return avatar;
}