import { disputeResolveOptions } from "../../constants/matchData.js";
import { stageIdToName } from "../../constants/stageData.js";

export function MatchStartChatMessage(){
    let result = 'Match started.';
    return result;
}

//takes stages number id, not actual stage names
export function StrikeStagesChatMessage(userId, stagesArray){
    let result = `<${userId}> striked `;
    for (let i = 0; i < stagesArray.length; i++){
        result += stageIdToName[stagesArray[i]];
        let addStr = (i == stagesArray.length - 1) ? '.' : ', ';
        result += addStr;
    }
    return result;
}

//also takes stage id
export function ChooseStageChatMessage(userId, stage){
    let result = `<${userId}> chose to play on ${stageIdToName[stage]}.`;
    return result;
}

export function GamePlayerConfirmMessage(userId, winnerId){
    let result = `<${userId}> marked <${winnerId}> as the winner.`;
    return result;
}

export function GameWinChatMessage(winUserId, gameNumber){
    let result = `<${winUserId}> won game ${gameNumber}.`;
    return result;
}

export function MatchWinChatMessage(winUserId){
    let result = `<${winUserId}> won the match.`;
    return result;
}

export function CasualMatchEndChatMessage(userId){
    let result = `<${userId}> has chosen to end the session.`;
    return result;
}

export function ForfeitChatMessage(forfeitUserId){
    let result = `<${forfeitUserId}> forfeit the match.`;
    return result;
}

export function DisputeChatMessage(){
    let result = 'The match is in dispute.';
    return result;
}

export function CasualDisputeChatMessage(){
    let result = 'Moderators have been called for help.';
    return result;
}

export function ResolveDisputeChatMessage(player1Id, player2Id, resolveOption){
    let result = 'Dispute has been resolved. Resolve option: ';
    switch (resolveOption){
        case disputeResolveOptions.noChanges:
            result += 'no changes.'
            break;
        case disputeResolveOptions.resetCurrentGame:
            result += 'reset current game.'
            break;
        case disputeResolveOptions.restartMatch:
            result += 'restart match.'
            break;
        case disputeResolveOptions.cancelMatch:
            result += 'cancel match.'
            break;
        case disputeResolveOptions.gameWinPlayer1:
            result += `<${player1Id}> wins the game.`
            break;
        case disputeResolveOptions.gameWinPlayer2:
            result += `<${player2Id}> wins the game.`
            break;
        case disputeResolveOptions.matchWinPlayer1:
            result += `<${player1Id}> wins the match.`
            break;
        case disputeResolveOptions.matchWinPlayer2:
            result += `<${player2Id}> wins the match.`
            break;
        default:
            result += 'no resolve option found (error).'
            break;
    }
    return result;
}