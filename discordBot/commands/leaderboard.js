import { SlashCommandBuilder } from "discord.js";
import { GetLeaderboardAtPos } from "../../userListManager.js";
import { embedColor } from '../utils/constants.js';
import { GetRank } from "../../public/constants/rankData.js";
const hitsPerPage = 15;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Get the current leaderboard, listing ${hitsPerPage} players`)
    .addIntegerOption(option =>
		option.setName('position')
			.setDescription('Starting position')
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
        const rank = GetRank(leaderboard[i].g2_rating);

        var tagValue = leaderboard[i].discord_username;
        const isMember = await interaction.guild.members.fetch(leaderboard[i].discord_id).then(() => true).catch(() => false);
        if (isMember) tagValue = `<@${leaderboard[i].discord_id}>`;

        leaderboardsFields[0].value += `\n${startPosition + i}. <${rank.emoji}> ${tagValue} **${Math.floor(leaderboard[i].g2_rating)}**`;
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