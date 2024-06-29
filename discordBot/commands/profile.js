import { SlashCommandBuilder } from "discord.js";
import { GetUserByDiscordId, GetUserMatchCount, GetUserMatchHistory } from "../../database.js";
import { GetRank, unranked } from "../../public/constants/rankData.js";
import { DetailMinute } from "../../utils/date.js";
import { embedColor } from '../utils/constants.js';
import { BuildSimpleEmbed } from "../utils/embed.js";
import { GetPlayerLeaderboardPosition } from "../../userListManager.js";

import dotenv from 'dotenv';

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get the profile of any player')
    .addUserOption(option =>
		option.setName('user')
			.setDescription('The user'))

export async function execute(interaction) { 
    const discordUser = interaction.options.getUser('user') ?? interaction.user;

    const user = await GetUserByDiscordId(discordUser.id);

    if (!user){
        const noUserEmbed = BuildSimpleEmbed('TableturfQ Profile', ' ', `<@${discordUser.id}> has no TableturfQ profile.`);
        await interaction.reply({ embeds: [noUserEmbed] });
		return;        
    }

	var matchCount = await GetUserMatchCount(user.id);
	var leaderboardPosition = GetPlayerLeaderboardPosition(user.id);
	if (leaderboardPosition == 0) leaderboardPosition = 'N/A';
    const matches = await GetUserMatchHistory(user.id, 1, 1);
    if (matches[0]){
        var lastPlayed = matches[0].created_at;
    }

    //buildembed
	var lastPlayedValue = 'Never';
	if (lastPlayed){
		lastPlayedValue = DetailMinute(lastPlayed);
	}

	var rank = unranked;
	var ratingValue = 'N/A';
	if (!user.hide_rank) {
		rank = GetRank(user.g2_rating);
		ratingValue = Math.floor(user.g2_rating);
	}

    var profileFields = [ 
	{
        name: 'Rating',
        value: ratingValue,
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
		name: 'Leaderboard position', 
		value: `${leaderboardPosition}`,
		inline: true
		},
	{
        name: 'Match count', 
        value: `${matchCount}`,
		inline: true
		},
	{ 
		name: 'Last played',
		value: lastPlayedValue,
		inline: false
		},
    ];

	const profileEmbed = {
		color: embedColor,
		title: 'TableturfQ Profile',
		author: {
			name: `${user.username}`,
			icon_url: `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar_hash}.png`,
			url: `${websiteURL}/profile?playerId=${user.id}`,
		},
		thumbnail: {
			url: `${rank.imageURL}`,
		},
		fields: profileFields,
	};

    await interaction.reply({ embeds: [profileEmbed] });
}