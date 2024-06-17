import mysql from 'mysql2';
import dotenv from 'dotenv';
import { userRoles } from './public/constants/userData.js';
import { FindPlayerPosInMatch } from './utils/matchUtils.js';
import { settings } from './glicko2Manager.js';
import { ConvertJSDateToTimestamp } from './utils/date.js';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

//Get
export async function GetMatch(matchId){
    const [rows] = await pool.query(`SELECT * FROM matches WHERE id = ?`, [matchId]);
    return rows[0];
}

export async function GetUserByDiscordId(discordId){
    const [rows] = await pool.query(`SELECT id, username, role, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_avatar_hash, created_at FROM users u WHERE discord_id = ?`, [discordId]);
    if (rows[0]){
        console.log("databse found user with discord id " + discordId);
        console.log("insert id: " + rows[0].insertId); 
        console.log("id: " + rows[0].id);
        return rows[0]
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

export async function GetMultipleUserDatas(userIdlist){
    const [rows] = await pool.query(`SELECT id, username, role, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_avatar_hash, created_at,
    (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id IN (?)`, [userIdlist]);
    return rows; 
}

export async function GetUserRankData(userId){
    const [rows] = await pool.query(`SELECT id, g2_rating, g2_rd, g2_vol FROM users WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserRole(userId){
    const [rows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [userId]);
    if (rows[0]) return rows[0].role;
}

export async function GetUserBanState(userId){
    const [rows] = await pool.query(`SELECT COUNT(*) AS banned FROM ban_list WHERE user_id = ?`, [userId]);
    if (rows[0]) return rows[0].banned;
}

export async function GetUserBanAndRole(userId){
    await pool.query(`SELECT role, (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserChatData(userIdArr){
    const rows = [];
    for (let i = 0; i < userIdArr.length; i++){
        rows[i] = await pool.query(`SELECT id, username, role, CAST(discord_id AS CHAR) discord_id FROM users WHERE id = ?`, [userIdArr[i]]);
    }
    return rows;
}

export async function GetUserMatchHistory(userId, hitsPerPage, pageNumber)
{
    var offset = (pageNumber - 1) * hitsPerPage;
    const [rows] = await pool.query(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, userId, hitsPerPage, offset]);
    return rows;
}

export async function GetUserMatchCount(userId)
{
    const [count] = await pool.query(`SELECT COUNT(*) AS matchCount FROM matches WHERE player1_id = ? OR player2_id = ?`, [userId, userId]);
    if (count[0]) return count[0].matchCount;
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
    const [rows] = await pool.query (`SELECT id, username, role, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_avatar_hash, created_at FROM users u WHERE NOT EXISTS
    (SELECT * FROM ban_list WHERE user_id = u.id) AND role != 0 ORDER BY g2_rating DESC`);
    return rows;
}

export async function GetFutureEvents(){
    let timeStamp = ConvertJSDateToTimestamp(new Date());
    const [rows] = await pool.query(`SELECT * FROM events WHERE date > ? ORDER BY date ASC`, [timeStamp]);
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
    const result = await pool.query(`INSERT INTO users (username, role, g2_rating, g2_rd, g2_vol, discord_id, discord_access_token, discord_refresh_token, discord_avatar_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [username, userRoles.verified, settings.rating, settings.rd, settings.vol, discordId, discordAccessToken, discordRefreshToken, discordAvatarHash]);
    return result[0].insertId;
}

export async function CreateSession(sessionId, expiresAt, data){
    await pool.query(`INSERT INTO sessions (id, expires_at, data) VALUES (?, ?, ?)`, [sessionId, expiresAt, data]);
}

export async function CreateEvent(name, description, iconSrc, date){
    let timeStamp = ConvertJSDateToTimestamp(new Date(date * 1000));
    var event = await pool.query(`INSERT INTO events (name, description, icon_src, date) VALUES (?, ?, ?, ?)`, [name, description, iconSrc, timeStamp]);
    return event[0].insertId;
}

export async function SuspendUser(userId, banLength){
    const unbanDate = Date.now() + banLength;
    let timeStamp = ConvertJSDateToTimestamp(new Date(unbanDate));
    await pool.query(`INSERT INTO ban_list (user_id, expires_at) VALUES (?, ?)`, [userId, timeStamp]);
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

export async function SetUserRole(userId, role){
    await pool.query(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
}

export async function SetUserRating(userId, rating, rd, vol){
    await pool.query(`UPDATE users SET g2_rating = ?, g2_rd = ?, g2_vol = ? WHERE id = ?`, [rating, rd, vol, userId]);
}

export async function SetUserDiscord(userId, discordId, discordAccessToken, discordRefreshToken, discordAvatarHash){
    await pool.query(`UPDATE users SET discord_id = ?, discord_access_token = ?, discord_refresh_token = ?, discord_avatar_hash = ? WHERE id = ?`, 
    [discordId, discordAccessToken, discordRefreshToken, discordAvatarHash, userId]);
}

export async function SetUserDiscordTokens(userId, discordAccessToken, discordRefreshToken){
    await pool.query(`UPDATE users SET discord_access_token = ?, discord_refresh_token = ? WHERE id = ?`, 
    [discordAccessToken, discordRefreshToken, userId]);
}

//delete

/*export async function DeleteChatMessage(matchId, messageNumber){
    await pool.query(`DELETE FROM chat_messages WHERE match_id = ? AND message_number = ?`, [matchId, messageNumber]);
}*/

export async function DeleteUnfinishedMatches(){
    await pool.query(`DELETE FROM matches WHERE result = 0`);
}

export async function DeleteSession(sessionId){
    await pool.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

export async function DeleteAllUserSessions(userId){
    await pool.query(`DELETE FROM sessions WHERE data = ?`, [userId]);
}

export async function DeleteOldSessions(){
    let timeStamp = ConvertJSDateToTimestamp(new Date());
    await pool.query(`DELETE FROM sessions WHERE expires_at < ?`, [timeStamp]);
}

export async function DeleteOldUnverifiedAccounts(ageThreshold){
    const cutoffDate = Date.now() - ageThreshold;
    let timeStamp = ConvertJSDateToTimestamp(new Date(cutoffDate));
    await pool.query(`DELETE FROM users WHERE role = ? AND created_at < ?`, [userRoles.unverified, timeStamp]);
}

export async function DeleteEvent(eventId){
    await pool.query(`DELETE FROM events WHERE id = ?`, [eventId]);
}

export async function UnbanUser(userId){
    await pool.query(`DELETE FROM ban_list WHERE user_id = ?`, [userId]);

    var role = await GetUserRole(userId);
    if (!role) return;
    if (role === userRoles.mod){
        await SetUserRole(userId, userRoles.verified);
    }
}

export async function DeleteOldSuspensions(){
    let timeStamp = ConvertJSDateToTimestamp(new Date());
    await pool.query(`DELETE FROM ban_list WHERE expires_at < ?`, [timeStamp]);
}