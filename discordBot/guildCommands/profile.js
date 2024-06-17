import { SlashCommandBuilder } from "discord.js";
import { GetUserByDiscordId, GetUserMatchCount, GetUserMatchHistory } from "../../database.js";
import { GetRank } from "../../public/constants/rankData.js";
import { DetailMinute } from "../../utils/date.js";
import { embedColor } from '../constants.js';

import dotenv from 'dotenv';

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get the profile of any player')
    .addUserOption(option =>
		option.setName('user')
			.setDescription('The user to get the profile from. Leave blank for your own profile.'))

export async function execute(interaction) { 
    const discordUser = interaction.options.getUser('user') ?? interaction.user;

    const user = await GetUserByDiscordId(discordUser.id);

    var matchCount;

    if (!user){
        const noUserEmbed = {
			color: embedColor,
			title: 'TableturfQ Profile',
			fields: [{name: `The selected user has no TableturfQ profile.`, value: '\u200B'}],
		};
        await interaction.reply({ embeds: [noUserEmbed] });
		return;        
    }

    matchCount = await GetUserMatchCount(user.id);
    const matches = await GetUserMatchHistory(user.id, 1, 1);
    if (matches[0]){
        var lastPlayed = matches[0].created_at;
    }

    //buildembed
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

    await interaction.reply({ embeds: [profileEmbed] });
}