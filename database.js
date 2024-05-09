import mysql from 'mysql2';
import dotenv from 'dotenv';
import { json } from 'express';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

//Get
export async function GetMatch(matchId){
    const [rows] = await pool.query(`SELECT *, SUBSTRING(DATE_FORMAT(\`created_at\`, '%Y-%m-%d %T.%f'),1,21) as formatted_created_at FROM matches WHERE id = ?`, [matchId]);
    return rows[0];
}

export async function GetPlayer(playerId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE id = ?`, [playerId]);
    return rows[0];
}

export async function GetPlayerByDiscordId(discordId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE discord_id = ?`, [discordId]);
    if (rows[0]){
        console.log("databse did find player with discord id " + discordId);
        return rows[0].id;
    } else {
        console.log("databse did not find player with discord id " + discordId);
        return null;
    }
}

export async function GetPlayerLoginData(playerId){
    const [rows] = await pool.query(`SELECT discord_verified, discord_access_token, discord_refresh_token FROM players WHERE id = ?`, [playerId]);
    return rows[0];
}

export async function GetPlayerData(playerId){
    const [rows] = await pool.query(`SELECT username, role, g2_rating, discord_verified, created_at FROM players WHERE id = ?`, [playerId]);
    return rows[0];
}

export async function GetPlayerRankData(playedId){
    const [rows] = await pool.query(`SELECT id, g2_rating, g2_rd, g2_vol FROM players WHERE id = ?`, [playerId]);
    return rows[0];
}

export async function GetPlayerMatchHistory(playerId)
{
    const [rows] = await pool.query(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY id DESC`, [playerId, playerId]);
    return rows;
}

export async function GetPlayerMatchCount(playerId)
{
    const [count] = await pool.query(`SELECT COUNT(*) AS matchCount FROM matches WHERE player1_id = ? OR player2_id = ?`, [playerId, playerId]);
    return count[0].matchCount;
}

export async function GetMatchGames(matchId){
    const [rows] = await pool.query(`SELECT * FROM games WHERE match_id = ? ORDER BY game_number`, [matchId])
    return rows;
}

export async function GetStageStrikes(gameId){
    const [rows] = await pool.query(`SELECT * FROM stage_strikes WHERE game_id = ?`, [gameId])
    return rows;
}

export async function GetRulesetStages(rulesetId){
    const [rows] = await pool.query(`SELECT * FROM ruleset_stages WHERE ruleset_id = ?`, [rulesetId])
    return rows;
}

export async function GetRulesetStarterStages(rulesetId){
    const [rows] = await pool.query(`SELECT * FROM ruleset_stages WHERE ruleset_id = ? AND starter = true`, [rulesetId])
    return rows;
}

export async function GetChatMessages(matchId){
    const [rows] = await pool.query(`SELECT * FROM chat_messages WHERE match_id = ? ORDER BY message_number`, [matchId])
    return rows;
}

export async function GetChatCount(matchId){
    const [count] = await pool.query(`SELECT COUNT(*) AS chatCount FROM chat_messages WHERE match_id = ?`, [matchId])
    return count[0].chatCount;
}

export async function GetSession(sessionId){
    const [rows] = await pool.query(`SELECT * FROM sessions WHERE id = ?`, [sessionId])
    return rows[0];
}

//Create
export async function CreateMatch(player1Id, player2Id, ranked, rulesetId)
{
    const result = await pool.query(`INSERT INTO matches (player1_id, player2_id, ranked, ruleset_id) VALUES (?, ?, ?, ?)`, [player1Id, player2Id, ranked, rulesetId])
    return JSON.stringify(result[0].id);
}

export async function CreatePlayer(username)
{
    const result = await pool.query(`INSERT INTO players (username) VALUES (?)`, [username]);
    return JSON.stringify(result[0].id);
}

export async function CreatePlayerWithDiscord(username, discordId, discordAccessToken, discordRefreshToken){
    const result = await pool.query(`INSERT INTO players (username, discord_id, discord_access_token, discord_refresh_token) VALUES (?, ?, ?, ?)`,
    [username, discordId, discordAccessToken, discordRefreshToken]);
    return JSON.stringify(result[0].id);
}

export async function CreateGame(matchId, gameNumber, stage)
{
    const result = await pool.query(`INSERT INTO games (match_id, game_number, stage) VALUES (?, ?, ?)`, [matchId, gameNumber, stage]);
    return JSON.stringify(result[0].id);
}

export async function CreateStageStrike(gameId, stage, strikeOwner)
{
    await pool.query(`INSERT INTO games (game_id, stage, strike_owner) VALUES (?, ?, ?)`, [gameId, stage, strikeOwner]);
}

export async function CreateChatMessage(matchId, messageOwner, content)
{
    const messageNumber = await GetChatCount(matchId) + 1;
    await pool.query(`INSERT INTO games (match_id, message_number, message_owner, content) VALUES (?, ?, ?, ?)`, [matchId, messageNumber, messageOwner, content]);
}

export async function CreateSession(sessionId, expiresAt, data){
    await pool.query(`INSERT INTO sessions (id, expires_at, data) VALUES (?, ?, ?)`, [sessionId, expiresAt, data]);
}

//Update
export async function SetMatchResult(matchId, result){
    await pool.query(`UPDATE matches SET result = ? WHERE id = ?`, [result, matchId]);
}

export async function DeleteMessage(matchId, messageNumber){
    await pool.query(`DELETE FROM chat_messages WHERE match_id = ? AND message_number = ?`, [matchId, messageNumber]);
}

export async function SetGameStage(gameId, stage){
    await pool.query(`UPDATE games SET stage = ? WHERE id = ?`, [stage, gameId]);
}

export async function SetGameResult(gameId, result){
    await pool.query(`UPDATE games SET result = ? WHERE id = ?`, [result, gameId]);
}

export async function SetPlayerRating(playerId, rating, rd, vol){
    await pool.query(`UPDATE players SET g2_rating = ?, g2_rd = ?, g2_vol = ? WHERE id = ?`, [rating, rd, vol, playerId]);
}

export async function SetPlayerDiscord(playerId, discordId, discordAccessToken, discordRefreshToken){
    await pool.query(`UPDATE players SET discord_id = ?, discord_access_token = ?, discord_refresh_token = ? WHERE id = ?`, [discordId, discordAccessToken, discordRefreshToken, playerId]);
}

export async function DeleteSession(sessionId){
    await pool.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

//set only access token / refresh token?