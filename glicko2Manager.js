var glicko2 = require("glicko2");

var settings = {
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    //      be tested to decide which value results in greatest predictive accuracy."
    tau : 0.5,
    // rating : default rating
    rating : 1500,
    //rd : Default rating deviation 
    //     small number = good confidence on the rating accuracy
    rd : 200,
    //vol : Default volatility (expected fluctation on the player rating)
    vol : 0.06
  };

async function FinishMatch(matchId, matchResult){
  //get playerDatas from database with the match id. it need player ranks, rating deviations, and volatility.
  var playerDatas;
  var player1Data = playerDatas.player1;
  var player2Data = playerDatas.player2;

  var ranking = new glicko2.Glicko2(settings);
  var player1 = ranking.makePlayer(player1Data.rating, player1Data.rd, player1Data.vol);
  var player2 = ranking.makePlayer(player2Data.rating, player2Data.rd, player2Data.vol);

  ranking.addResult(player1, player2, matchResult);
  ranking.calculatePlayersRatings();
  //Update database with new player data and match result
  return true;
}

// Testing glick2 functionality
var ranking = new glicko2.Glicko2(settings);

var Ryan = ranking.makePlayer();
var Mary = ranking.makePlayer(1700, 300, 0.06);

var matches = [];
ranking.addResult(Ryan, Mary, 0);
ranking.calculatePlayersRatings();

console.log("Ryan new rating: " + Ryan.getRating());
console.log("Ryan new rating deviation: " + Ryan.getRd());
console.log("Ryan new volatility: " + Ryan.getVol());

var players = ranking.getPlayers();