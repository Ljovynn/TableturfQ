import { SlashCommandBuilder } from "discord.js";
import { GetLeaderboardAtPos } from "../../leaderboardManager.js";
import { embedColor } from '../constants.js';
const hitsPerPage = 15;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Get the current leaderboard, listing ${hitsPerPage} players`)
    .addIntegerOption(option =>
		option.setName('position')
			.setDescription('Where to start listing players')
            .setMinValue(1))

export async function execute(interaction) { 
    const startPosition = interaction.options.getInteger('position') ?? 1;
    var leaderboardData = GetLeaderboardAtPos(startPosition - 1, hitsPerPage);
    var leaderboard = leaderboardData.result;

    var leaderboardsFields = [ 
        {
            name: '\u200B',
            value: ''},
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
            footer: {
            text: `Total players: ${leaderboardData.totalPlayers}`,
            }
        };

    await interaction.reply({ embeds: [leaderboardEmbed] });
}