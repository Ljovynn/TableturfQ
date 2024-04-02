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
  var ranking = new glicko2.Glicko2(settings);

export async function FinishMatch(matchId, matchResult){
  //get player 1 and player 2 from database with the match id.
  var player1 = "temp";
  var player2 = "temp";
  ranking.addResult(player1, player2, matchResult);
  //Update database with new player data and match result
  return true;
}

  // Create players
  var Ryan = ranking.makePlayer();
  var Bob = ranking.makePlayer(1400, 30, 0.06);
  var John = ranking.makePlayer(1550, 100, 0.06);
  var Mary = ranking.makePlayer(1700, 300, 0.06);

  var matches = [];
matches.push([Ryan, Bob, 1]); //Ryan won over Bob
matches.push([Ryan, John, 0]); //Ryan lost against John
matches.push([Ryan, Mary, 0.5]); //A draw between Ryan and Mary
ranking.updateRatings(matches);

console.log("Ryan new rating: " + Ryan.getRating());
console.log("Ryan new rating deviation: " + Ryan.getRd());
console.log("Ryan new volatility: " + Ryan.getVol());

var players = ranking.getPlayers();