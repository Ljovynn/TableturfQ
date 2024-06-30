import glicko2 from "glicko2";
import { GetUserRankData, SetUserRating } from "./database.js";
import { matchStatuses } from "./public/constants/matchData.js";

export const placementMatchCount = 5;

export var settings = {
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    //      be tested to decide which value results in greatest predictive accuracy."
    tau : 0.5,
    // rating : default rating
    rating : 1400,
    //rd : Default rating deviation 
    //     small number = good confidence on the rating accuracy
    rd : 130,
    //vol : Default volatility (expected fluctation on the player rating)
    vol : 0.06
  };

//returns newPlayer1Rating, newPlayer2Rating
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

  var newPlayer1Rating = player1.getRating();
  var newPlayer2Rating = player2.getRating();

  //update database
  await SetUserRating(match.players[0].id, newPlayer1Rating, player1.getRd(), player1.getVol());
  await SetUserRating(match.players[1].id, newPlayer2Rating, player2.getRd(), player2.getVol());

  if (player1Data.hide_rank) newPlayer1Rating = null;
  if (player2Data.hide_rank) newPlayer2Rating = null;

  var data = {
    newPlayer1Rating,
    newPlayer2Rating
  }

  return data;
}