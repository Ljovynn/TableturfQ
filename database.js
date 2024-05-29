import mysql from 'mysql2';
import dotenv from 'dotenv';
import { userRoles } from './public/constants/userData.js';
import { FindPlayerPosInMatch } from './utils/matchUtils.js';
import { settings } from './glicko2Manager.js';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

/*
await GetUserByDiscordId(168290358470508544);
var e = await GetUser(1);
if (e){
    console.log(JSON.stringify(e));
}*/

//Get
export async function GetMatch(matchId){
    const [rows] = await pool.query(`SELECT * FROM matches WHERE id = ?`, [matchId]);
    return rows[0];
}

export async function GetUserByDiscordId(discordId){
    const [rows] = await pool.query(`SELECT * FROM users WHERE discord_id = ?`, [discordId]);
    if (rows[0]){
        console.log("databse found user with discord id " + discordId);
        console.log("insert id: " + rows[0].insertId); 
        console.log("id: " + rows[0].id);
        if ( rows[0].id ) {
            console.log('No insert id');
            return rows[0].id;
        } else {
            console.log('Insert id');
            return rows[0].insertId;
        }
    } else {
        console.log("databse did not find user with discord id " + discordId);
        return undefined;
    }
}

export async function GetUserLoginData(userId){
    const [rows] = await pool.query(`SELECT CAST(discord_id AS CHAR) discord_id, discord_access_token, discord_refresh_token FROM users WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserData(userId){
    const [rows] = await pool.query(`SELECT id, username, role, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_avatar_hash, created_at,
    (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserRankData(userId){
    const [rows] = await pool.query(`SELECT id, g2_rating, g2_rd, g2_vol FROM users WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserChatData(userIdArr){
    const rows = [];
    for (let i = 0; i < userIdArr.length; i++){
        rows[i] = await pool.query(`SELECT id, username, role, CAST(discord_id AS CHAR) discord_id FROM users WHERE id = ?`, [userIdArr[i]]);
    }
    return rows;
}

export async function GetUserMatchHistory(userId, pageNumber)
{
    var hitsPerPage = 10;
    var offset = (pageNumber - 1) * hitsPerPage;
    const [rows] = await pool.query(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, userId, hitsPerPage, offset]);
    return rows;
}

export async function GetUserMatchCount(userId)
{
    const [count] = await pool.query(`SELECT COUNT(*) AS matchCount FROM matches WHERE player1_id = ? OR player2_id = ?`, [userId, userId]);
    return count[0].matchCount;
}

export async function GetMatchGames(matchId){
    const [rows] = await pool.query(`SELECT * FROM games WHERE match_id = ? ORDER BY id`, [matchId]);
    return rows;
}

export async function GetStageStrikes(gameId){
    const [rows] = await pool.query(`SELECT * FROM stage_strikes WHERE game_id = ?`, [gameId]);
    return rows;
}

export async function GetChatMessages(matchId){
    const [rows] = await pool.query(`SELECT * FROM chat_messages WHERE match_id = ? ORDER BY message_number`, [matchId]);
    return rows;
}

export async function GetSession(sessionId){
    const [rows] = await pool.query(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
    return rows[0];
}

export async function GetLeaderboard(){
    const [rows] = await pool.query (`SELECT * from users u WHERE NOT EXISTS (SELECT * FROM ban_list WHERE user_id = u.id) order by g2_rating desc`);
    return rows;
}

//Create

export async function CreateMatch(player1Id, player2Id, isRanked){
    const result = await pool.query(`INSERT INTO matches (player1_id, player2_id, ranked) VALUES (?, ?, ?)`, [player1Id, player2Id, isRanked]);
    if (result[0].id){
        console.log("no insert id");
        return result[0].id;
    } else{
        console.log("insert id");
        return result[0].insertId;
    }
}

async function CreateFirstGameStrikes(match){
    var game = match.gamesArr[0];
    var strikePos = FindPlayerPosInMatch(match, game.winnerId);
    const result = await pool.query(`INSERT INTO games (match_id, stage, result) VALUES (?, ?, ?)`, [match.id, game.stage, strikePos]);

    const gameId = result[0].insertId;

    var data = [];
    for (let i = 0; i < game.strikes.length; i++){
        var strikePos;
        if ((i + 1) % 4 < 2){
            strikePos = 1;
        } else{
            strikePos = 2;
        }
        data[i] = [gameId, game.strikes[i], strikePos];
    }

    await pool.query(`INSERT INTO stage_strikes (game_id, stage, strike_owner) VALUES ?`, [data.map(strike => [strike[0], strike[1], strike[2]])]);
}

async function CreateCounterpickGameAndStrikes(match, gameNumber){
    var game = match.gamesArr[gameNumber - 1];
    var winnerPos = FindPlayerPosInMatch(match, game.winnerId);
    const result = await pool.query(`INSERT INTO games (match_id, stage, result) VALUES (?, ?, ?)`, [match.id, game.stage, winnerPos]);

    const gameId = result[0].insertId;
    var data = [];
    for (let i = 0; i < game.strikes.length; i++){
        data[i] = [gameId, game.strikes[i], winnerPos];
    }

    await pool.query(`INSERT INTO stage_strikes (game_id, stage, strike_owner) VALUES ?`, [data.map(strike => [strike[0], strike[1], strike[2]])]);
}

export async function CreateUser(username)
{
    const result = await pool.query(`INSERT INTO users (username, g2_rating, g2_rd, g2_vol) VALUES (?)`, [username, settings.rating, settings.rd, settings.vol]);
    return result[0].insertId;
}

export async function CreateUserWithDiscord(username, discordId, discordAccessToken, discordRefreshToken, discordAvatarHash){
    const result = await pool.query(`INSERT INTO users (username, role, g2_rating, g2_rd, g2_vol, discord_id, discord_access_token, discord_refresh_token, discord_avatar_hash) VALUES (?, ?, ?, ?, ?, ?)`,
    [username, userRoles.verified, settings.rating, settings.rd, settings.vol, discordId, discordAccessToken, discordRefreshToken, discordAvatarHash]);
    return result[0].insertId;
}

export async function CreateSession(sessionId, expiresAt, data){
    await pool.query(`INSERT INTO sessions (id, expires_at, data) VALUES (?, ?, ?)`, [sessionId, expiresAt, data]);
}

export async function SuspendUser(userId, expiresAt){
    await pool.query(`INSERT INTO ban_list (user_id, expires_at) VALUES (?, ?)`, [userId, expiresAt]);
}

export async function BanUser(userId){
    await pool.query(`INSERT INTO ban_list (user_id) VALUES (?)`, [userId]);
}


//Update
export async function SetMatchResult(match){

    const matchResult = match.status;
    await pool.query(`UPDATE matches SET result = ? WHERE id = ?`, [matchResult, match.id]);

    CreateFirstGameStrikes(match);

    for (let i = 1; i < match.gamesArr.length; i++){
        CreateCounterpickGameAndStrikes(match, i + 1);
    }

    var chatData = [];
    for (let i = 0; i < match.chat.length; i++){
        chatData[i] = [match.id, i + 1, match.chat[i].ownerId, match.chat[i].content];
    }

    if (chatData.length == 0) return;
    await pool.query(`INSERT INTO chat_messages (match_id, message_number, owner_id, content) VALUES ?`, [chatData.map(msg => [msg[0], msg[1], msg[2], msg[3]])]);
}

export async function SetUserRating(userId, rating, rd, vol){
    await pool.query(`UPDATE users SET g2_rating = ?, g2_rd = ?, g2_vol = ? WHERE id = ?`, [rating, rd, vol, userId]);
}

export async function SetUserDiscord(userId, discordId, discordAccessToken, discordRefreshToken){
    await pool.query(`UPDATE users SET discord_id = ?, discord_access_token = ?, discord_refresh_token = ? WHERE id = ?`, [discordId, discordAccessToken, discordRefreshToken, userId]);
}

//delete

/*export async function DeleteChatMessage(matchId, messageNumber){
    await pool.query(`DELETE FROM chat_messages WHERE match_id = ? AND message_number = ?`, [matchId, messageNumber]);
}*/

export async function DeleteSession(sessionId){
    await pool.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

export async function DeleteOldSessions(){
    await pool.query(`DELETE FROM sessions WHERE expires_at < ?`, [Date.now()]);
}

export async function DeleteOldUnverifiedAccounts(ageThreshold){
    var cutoffDate = Date.now() - ageThreshold;
    await pool.query(`DELETE FROM users WHERE role = ? AND created_at < ?`, [userRoles.unverified, cutoffDate]);
}

export async function UnbanUser(userId){
    await pool.query(`DELETE FROM ban_list WHERE user_id = ?`, [userId]);
}

export async function DeleteOldSuspensions(){
    await pool.query(`DELETE FROM ban_list WHERE expires_at < ?`, [Date.now()]);
}