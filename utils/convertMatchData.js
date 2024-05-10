import { matchStatuses, matchResults, Match, Game, MatchRuleset, Player} from "../public/constants/matchData";

export function ConvertMatchStatusToResult(matchStatus){
    switch (matchStatus){
        case matchStatuses.player1Win:
            return matchResults.player1Win;
        case matchStatus.player2Win:
            return matchResults.player2Win;
        default:
            return matchResults.noWinner;
    }
}

export function ConvertMatchDBToMatch(matchData){

}