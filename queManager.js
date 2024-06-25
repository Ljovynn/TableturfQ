import { matchModes } from "./public/constants/matchData.js";
import { FindIfPlayerInMatch, MakeNewMatch } from "./matchManager.js";
import { GetUserData } from "./database.js";
import { userRoles } from "./public/constants/userData.js";
import { SendSocketMessage } from "./socketManager.js";
import { ResponseData } from "./Responses/ResponseData.js";
import { enterQueErrors, readyUpErrors } from "./Responses/queErrors.js";
import { GetQueAvailible } from "./queEnabled.js";

const readyTimerGracePeriod = 1000 * 3;
const alreadyMatchedPlayersTime = 1000 * 60 * 20;

function Que(matchMode){
    this.queArr = [];
    this.matchMode = matchMode;
}

function PlayerInQue(id, baseSearchElo){
    this.id = id;
    this.baseSearchElo = baseSearchElo;
    this.startedQue = Date.now();
    this.eloSearchRange = 0;
}

function MatchmadePlayer(id){
    this.id = id;
    this.ready = false;
}

function MatchedPlayers(player1Id, player2Id, matchMode){
    this.players = [new MatchmadePlayer(player1Id), new MatchmadePlayer(player2Id)];
    this.matchMode = matchMode;
    this.createdAt = Date.now();
}

var ques = [
    new Que(matchModes.casual),
    new Que(matchModes.ranked)
]

var matchingPlayersList = [];

//also uses MathedPlayers function
var recentlyMatchedPlayersList = [];

export async function AddPlayerToQue(playerId, matchMode){
    if (!GetQueAvailible()) return enterQueErrors.queUnavailible;
    for (let i = 0; i < ques.length; i++){
        if (ques[i].matchMode == matchMode) return await TryAddPlayerToQue(ques[i], playerId);
    }
    return enterQueErrors.illegalMatchMode;
}

async function TryAddPlayerToQue(que, playerId){
    if (FindIfPlayerInQue(playerId)) return enterQueErrors.inQue;
    if (FindIfPlayerInMatch(playerId)) return enterQueErrors.inMatch; 

    var user = await GetUserData(playerId);
    if (!user) return enterQueErrors.noUser;
    if (user.banned == 1) return enterQueErrors.banned;
    if (que.matchMode == matchModes.ranked){
        if (user.role == userRoles.unverified) return enterQueErrors.unverified;
    }

    var baseSearchElo = Math.max(user.g2_rating, que.matchMode.queData.minEloStart);
    baseSearchElo = Math.min(user.g2_rating, que.matchMode.queData.maxEloStart);

    que.queArr.push(new PlayerInQue(playerId, baseSearchElo));
    return new ResponseData(201);
}

//main matchmaking algorithm. once every n seconds
export async function MatchMakingTick(){
    //CheckMatchmadePlayers();
    CheckRecentlyMatchedPlayers();
    
    var newlyMatchedPlayers = [];
    for (let i = 0; i < ques.length; i++){
        var matchedPlayers = await QueTick(ques[i]);
        if (matchedPlayers) newlyMatchedPlayers.push(matchedPlayers);
    }

    //set up match
    for (let i = 0; i < newlyMatchedPlayers.length; i++){
        if (newlyMatchedPlayers[i].matchMode == matchModes.casual){
            RemovePlayersFromQue(ques[0].queArr, newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1]);
            var match = await MakeNewMatch(newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1], newlyMatchedPlayers[i].matchMode);

            //GET RID OF THIS IF NEW SOCKETS ROOMS WORK
            var matchedPlayersData = {
                matchId: match.id,
                player1Id: match.players[0].id,
                player2Id: match.players[1].id
            }
            var player1Room = "queRoom" + match.players[0].id.toString();
            var player2Room = "queRoom" + match.players[1].id.toString();
            SendSocketMessage(player1Room, "matchReady", matchedPlayersData);
            SendSocketMessage(player2Room, "matchReady", matchedPlayersData);
        } else{
            RemovePlayersFromQue(ques[1].queArr, newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1]);
            matchingPlayersList.push(new MatchedPlayers(newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1], newlyMatchedPlayers[i].matchMode));

            var player1Room = "queRoom" + newlyMatchedPlayers[i].players[0].toString();
            var player2Room = "queRoom" + newlyMatchedPlayers[i].players[1].toString();
            SendSocketMessage(player1Room, "matchesFound", newlyMatchedPlayers[i]);
            SendSocketMessage(player2Room, "matchesFound", newlyMatchedPlayers[i]);
        }
    }
}

//algorithm for any singular que
//Finds only one match per tick per que rn
async function QueTick(que){
    //set all players search range
    for (let i = 0; i < que.queArr.length; i++){
        var secondsPlayerWaited = (Date.now() - que.queArr[i].startedQue) / 1000;
        que.queArr[i].eloSearchRange = Math.min(que.matchMode.queData.baseEloRange + (secondsPlayerWaited * que.matchMode.queData.eloGrowthPerSecond), que.matchMode.queData.maxEloRange);
    }

    return FindPlayersToMatch(que);
}

function FindPlayersToMatch(que){
    for (let i = 0; i < que.queArr.length - 1; i++){
        for (let j = i + 1; j < que.queArr.length; j++){

            //check if elo search ranges overlap
            if (que.queArr[i].baseSearchElo - que.queArr[i].eloSearchRange > que.queArr[j].baseSearchElo + que.queArr[j].eloSearchRange) continue;
            if (que.queArr[j].baseSearchElo - que.queArr[j].eloSearchRange > que.queArr[i].baseSearchElo + que.queArr[i].eloSearchRange) continue;

            //check if players didn't match recently
            var index = SearchMatchedPlayersList(recentlyMatchedPlayersList, que.queArr[i].id);
            if (index != -1){
                if (recentlyMatchedPlayersList[index].players[0] == que.queArr[j].id || recentlyMatchedPlayersList[index].players[1] == que.queArr[j].id) continue;
            }
            var data = {
                players: [que.queArr[i].id, que.queArr[j].id],
                matchMode: que.matchMode,
                matchId: 0
            }
            return data;
        }
    }
    return undefined;
}

//checks if timer has run out for any matchmade players
export function CheckMatchmadePlayers(){
    for (let i = matchingPlayersList.length - 1; i >= 0; i--){
        if (Date.now - matchingPlayersList[i].createdAt > matchingPlayersList[i].matchMode.queData.readyTimer + readyTimerGracePeriod){
            matchingPlayersList.splice(i, 1);
        }
    }
}

//Checks if timer has run out for recently matched players
function CheckRecentlyMatchedPlayers(){
    for (let i = alreadyMatchedPlayersTime.length - 1; i >= 0; i--){
        if (Date.now - alreadyMatchedPlayersTime[i].createdAt >  alreadyMatchedPlayersTime){
            alreadyMatchedPlayersTime.splice(i, 1);
        }
    }
}

export function FindIfPlayerInQue(playerId){
    for (let i = 0; i < ques.length; i++){
        for (let j = 0; j < ques[i].queArr.length; j++){
            if (ques[i].queArr[j].id == playerId){
                var data = [ques[i].matchMode, ques[i].queArr[j].startedQue];
                return data;
            }
        }
    }
    return undefined;
}

export function FindIfPlayerWaitingForReady(playerId){
    var inWaiting = false;
    var ready = false;
    var timeWaitingStarted;

    for (let i = 0; i < matchingPlayersList.length; i++){
        if (matchingPlayersList[i].players[0] == playerId){
            inWaiting = true;
            ready = matchingPlayersList[i].players[0].ready;
            timeWaitingStarted = matchingPlayersList[i].createdAt;
            break;
        }
        else if (matchingPlayersList[i].players[1] == playerId){
            inWaiting = true;
            ready = matchingPlayersList[i].players[1].ready;
            timeWaitingStarted = matchingPlayersList[i].createdAt;
            break;
        }
    }

    return {inWaiting, ready, timeWaitingStarted};
}

export function RemovePlayerFromQue(playerId, matchMode){
    for (let i = 0; i < ques.length; i++){
        // Stringify both objects to check for equality
        if (ques[i].matchMode != matchMode) continue;

        for (let j = 0; j < ques[i].queArr.length; i++){
            if (ques[i].queArr[j].id == playerId){
                ques[i].queArr.splice(j, 1);
                return true;
            }
        }
    }
    return false;
}

export function RemovePlayerFromAnyQue(playerId){
    for (let i = 0; i < ques.length; i++){
        for (let j = 0; j < ques[i].queArr.length; i++){
            if (ques[i].queArr[j].id == playerId){
                ques[i].queArr.splice(j, 1);
                return true;
            }
        }
    }
    return false;
}

export function AddRecentlyMatchedPlayers(player1Id, player2Id, matchMode){
    //delete older data
    var index = SearchMatchedPlayersList(recentlyMatchedPlayersList, player1Id);
    if (index != -1) recentlyMatchedPlayersList.splice(index, 1);
    index = SearchMatchedPlayersList(recentlyMatchedPlayersList, player2Id);
    if (index != -1) recentlyMatchedPlayersList.splice(index, 1);

    recentlyMatchedPlayersList.push(new MatchedPlayers(player1Id, player2Id, matchMode));
}

function RemovePlayersFromQue(queArr, player1Id, player2Id){
    for (let i = queArr.length - 1; i >= 0; i--){
        if (queArr[i].id == player1Id || queArr[i].id == player2Id) queArr.splice(i, 1);
    }
}

export async function PlayerSentReady(playerId){
    var index = SearchMatchedPlayersList(matchingPlayersList, playerId);
    if (index == -1) return readyUpErrors.notMatched;
    var playerPos = FindPlayerPositionInMatchedPlayers(matchingPlayersList[index], playerId);
    matchingPlayersList[index].players[playerPos - 1].ready = true;
    var match = await CheckIfBothPlayersReady(index)
    return new ResponseData(201, match);
}

async function CheckIfBothPlayersReady(matchingPlayersListIndex){
    var matchingPlayers = matchingPlayersList[matchingPlayersListIndex];
    if (matchingPlayers.players[0].ready && matchingPlayers.players[1].ready){
        var match = await MakeNewMatch(matchingPlayers.players[0].id, matchingPlayers.players[1].id, matchingPlayers.matchMode);
        matchingPlayersList.splice(matchingPlayersListIndex, 1);
        return match;
    }
    return undefined;
}

function FindPlayerPositionInMatchedPlayers(matchedPlayers, playerId){
    if (matchedPlayers.players[0].id == playerId) return 1;
    return 2;
}

function SearchMatchedPlayersList(arr, playerId){
    for (let i = 0; i < arr.length; i++){
        if (arr[i].players[0].id == playerId || arr[i].players[1].id == playerId) return i;
    }
    return -1;
}