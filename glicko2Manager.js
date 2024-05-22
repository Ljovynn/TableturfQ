import glicko2 from "glicko2";
import { GetUserRankData, SetUserRating } from "./database.js";
import { matchStatuses } from "./public/constants/matchData.js";

var settings = {
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    //      be tested to decide which value results in greatest predictive accuracy."
    tau : 0.5,
    // rating : default rating
    rating : 1500,
    //rd : Default rating deviation 
    //     small number = good confidence on the rating accuracy
    rd : 100,
    //vol : Default volatility (expected fluctation on the player rating)
    vol : 0.06
  };

export async function ApplyMatchEloResults(match){

  //get rank data
  var player1Data = await GetUserRankData(match.players[0].id);
  var player2Data = await GetUserRankData(match.players[1].id);
  if (!player1Data || !player2Data) return false;

  //initialize g2 player rankings
  var ranking = new glicko2.Glicko2(settings);
  var player1 = ranking.makePlayer(player1Data.g2_rating, player1Data.g2_rd, player1Data.g2_vol);
  var player2 = ranking.makePlayer(player2Data.g2_rating, player2Data.g2_rd, player2Data.g2_vol);

  var matchResult;
  switch (match.status){
    case matchStatuses.player1Win:
      matchResult = 1;
      break;
    case matchStatuses.player2Win:
      matchResult = 0;
      break;
    default:
      return false;
  }

  ranking.addResult(player1, player2, matchResult);
  ranking.calculatePlayersRatings();

  //update database
  await SetUserRating(match.players[0].id, player1.getRating(), player1.getRd(), player1.getVol());
  await SetUserRating(match.players[1].id, player2.getRating(), player2.getRd(), player2.getVol());

  return true;
}