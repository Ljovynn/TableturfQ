const embedColor = 8472775;

export function BuildDisputeEmbed(matchDisputes){
	var disputesFields = [];
	var limit = Math.min(matchDisputes.length, 25);

	for (let i = 0; i < limit; i++){
		var dispute = {
			name: `Match ${matchDisputes[i].id}`,
			value: '[Link](https://google.com)',
		}
		disputesFields.push(dispute)
	}

	if (matchDisputes.length == 0) disputesFields.push({name: 'There are currently no disputes.', value: '\u200B'});

	const disputeEmbed = {
		color: embedColor,
		title: 'Current disputes:',
		fields: disputesFields,
		timestamp: new Date().toISOString(),
	};
	return disputeEmbed;
}

export function BuildLeaderboardEmbed(leaderboard, startPosition, leaderboardSize){
    var leaderboardsField = [ {
        name: '\u200B',
        value: ''},{ 
        name: 'Total players', 
        value: `${leaderboardSize}`}
    ];

	for (let i = 0; i < leaderboard.length; i++){
        //Todo: insert rank emoji
		leaderboardsField[0].value += `\n${startPosition + i}. <@${leaderboard[i].discord_id}> **${Math.floor(leaderboard[i].g2_rating)}**`;
	}
    leaderboardsField[0].value += '\u200B';

	const leaderboardEmbed = {
		color: embedColor,
		title: `🏆 TableturfQ Leaderboard [${startPosition}-${startPosition + leaderboard.length - 1}] 🏆`,
		fields: leaderboardsField,
		timestamp: new Date().toISOString(),
	};
	return leaderboardEmbed;
}