import { SlashCommandBuilder } from "discord.js";
import { BuildProfileEmbed } from "../embedBuilder.js";
import { GetUserByDiscordId, GetUserMatchCount, GetUserMatchHistory } from "../../database.js";
const hitsPerPage = 15;

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

    if (user){
        matchCount = await GetUserMatchCount(user.id);
        const matches = await GetUserMatchHistory(user.id, 1, 1);
        if (matches[0]){
            var lastPlayed = matches[0].created_at;
        }
    }

    await interaction.reply({ embeds: [BuildProfileEmbed(user, matchCount, lastPlayed)] });
}