import { SlashCommandBuilder } from "discord.js";
import { GetLeaderboardAtPos } from "../../leaderboardManager.js";
import { BuildLeaderboardEmbed } from "../embedBuilder.js";
const hitsPerPage = 15;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Get the current leaderboard, listing ${hitsPerPage} players`)
    .addIntegerOption(option =>
		option.setName('start_position')
			.setDescription('Where to start listing players')
            .setMinValue(1))

export async function execute(interaction) { 
    const startPosition = interaction.options.getInteger('start_position') ?? 1;
    var leaderboardData = GetLeaderboardAtPos(startPosition - 1, hitsPerPage);

    await interaction.reply({ embeds: [BuildLeaderboardEmbed(leaderboardData.result, startPosition, leaderboardData.totalPlayers )] });
}