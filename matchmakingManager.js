import { matchModes } from "./public/constants/matchData.js";
import { FindIfPlayerInMatch, MakeNewMatch } from "./matchManager.js";

function Que(matchMode){
    this.queArr = [];
    this.matchMode = matchMode;
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

export function AddPlayerToQue(playerId, matchMode){
    for (let i = 0; i < ques.length; i++){
        if (ques[i].matchMode == matchMode) return TryAddPlayerToQue(playerId);
    }
    return false;
}

function TryAddPlayerToQue(que, playerId){
    for (let i = 0; i < ques.length; i++){
        if (ques[i].queArr.includes(playerId)) return false;
    }
    if (FindIfPlayerInMatch(playerId)) return false;

    que.queArr.push(playerId);
    return true;
}

//main matchmaking algorithm. once every X seconds
//X = currently undecided
export async function MatchMakingTick(){
    for (let i = 0; i < ques.length; i++){
        QueTick(ques[i]);
    }
}

//algorithm for any singular que
async function QueTick(queArr, matchMode){

}

//checks if timer has run out for any matchmade players
function CheckMatchmadePlayers(){

}

async function MakeMatch(player1Id, player2Id, matchMode){
    
    switch (matchMode){
        case matchModes.casual:
            RemovePlayersFromQue(ques[0].queArr);
            await MakeNewMatch(player1Id, player2Id, matchMode)
            break;
        case matchModes.ranked:
            RemovePlayersFromQue(ques[1].queArr);
            matchingPlayersList.push(new MatchedPlayers(player1Id, player2Id, matchMode));
            break;
    }
}

function RemovePlayersFromQue(queArr){
    for (let i = 0; i < queArr.length; i++){
        if (queArr[i] == player1Id || queArr[i] == player2Id) queArr.splice(i, 1);
    }
}

async function MatchReady(matchingPlayersIndex){
    var matchingPlayers = matchingPlayersList[matchingPlayersIndex];
    await MakeNewMatch(matchingPlayers.players[0], matchingPlayers.players[1], matchingPlayers.matchMode);

    matchingPlayersList.splice(matchingPlayersIndex, 1);
}

export async function PlayerSentReady(playerId){

}