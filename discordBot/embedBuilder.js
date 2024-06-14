const embedColor = 8472775;

import dotenv from 'dotenv';
import { DetailMinute } from '../utils/date.js';
import { GetRank } from '../public/constants/rankData.js';

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;

//Todo: clickable links: dispute, profile
//Todo: insert rank emojis on leaderboard, profile

export function BuildDisputeEmbed(matchDisputes){
	var disputesFields = [];
	var limit = Math.min(matchDisputes.length, 25);

	for (let i = 0; i < limit; i++){
		var dispute = {
			name: `Match ${matchDisputes[i].id}`,
			value: `[Link](${websiteURL}: ${port}/user)`,
		}
		disputesFields.push(dispute)
	}

	if (matchDisputes.length == 0) disputesFields.push({name: 'There are currently no disputes.', value: '\u200B'});

	const disputeEmbed = {
		color: embedColor,
		title: 'Current disputes:',
		fields: disputesFields,
		timestamp: new Date().toDateString(),
	};
	return disputeEmbed;
}

export function BuildLeaderboardEmbed(leaderboard, startPosition, leaderboardSize){
    var leaderboardsFields = [ 
	{
        name: '\u200B',
        value: ''},{ 
        name: 'Total players', 
        value: `${leaderboardSize}`
		}
    ];

	for (let i = 0; i < leaderboard.length; i++){
        //Todo: insert rank emoji
		leaderboardsFields[0].value += `\n${startPosition + i}. <@${leaderboard[i].discord_id}> **${Math.floor(leaderboard[i].g2_rating)}**`;
	}
    leaderboardsFields[0].value += '\u200B';

	const leaderboardEmbed = {
		color: embedColor,
		title: `🏆 TableturfQ Leaderboard [${startPosition}-${startPosition + leaderboard.length - 1}] 🏆`,
		fields: leaderboardsFields,
	};
	return leaderboardEmbed;
}

export function BuildProfileEmbed(user, matchCount, lastPlayed){
	if (!user){
        const noUserEmbed = {
			color: embedColor,
			title: 'TableturfQ Profile',
			fields: [{name: `The selected user has no TableturfQ profile.`, value: '\u200B'}],
		};
		return noUserEmbed;
    }

	var lastPlayedValue = 'Never';
	if (lastPlayed){
		lastPlayedValue = DetailMinute(lastPlayed);
	}

	var rank = GetRank(user.g2_rating);

    var profileFields = [ 
	{
        name: 'Rating',
        value: `${Math.floor(user.g2_rating)}`,
		inline: true
		},
	{
        name: 'Rank',
        value: `${rank.name}`,
		inline: true
		},
	{
        name: ' ',
        value: ' ',
		inline: false
		},
	{ 
        name: 'Match count', 
        value: `${matchCount}`,
		inline: true
		},
	{
		name: 'Last played',
		value: lastPlayedValue,
		inline: true
		},
    ];

	const profileEmbed = {
		color: embedColor,
		title: 'TableturfQ Profile',
		author: {
			name: `${user.username}`,
			icon_url: `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar_hash}.png`,
			url: `${websiteURL}:${port}/user`,
		},
		thumbnail: {
			url: `${rank.imageURL}`,
		},
		fields: profileFields,
	};
	return profileEmbed;
}

export function BuildCardEmbed(card, level){
	if (!card){
        const noCardEmbed = {
			color: embedColor,
			title: 'Error: Can\'t find card',
		};
		return noCardEmbed;
    }

	var cardTitle = card.name;

	switch (level){
		case 2: cardTitle += ' ★★';
		break;
		case 3: cardTitle += ' ★★★';
		break;
	}

	cardTitle += ` [${card.id}]`;

	const cardEmbed = {
		color: embedColor,
		title: cardTitle,
		image: {
			url: `https://leanny.github.io/splat3/images/tableturf_full/${card.id}-${level}.png`
		},
	};
	return cardEmbed;
}