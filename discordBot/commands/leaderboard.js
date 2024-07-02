import { SlashCommandBuilder } from "discord.js";
import { GetLeaderboardAtPos } from "../../userListManager.js";
import { embedColor } from '../utils/constants.js';
import { GetRank } from "../../public/constants/rankData.js";
import { SanitizeDiscordLog } from "../../utils/string.js";

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

        const isMember = await interaction.guild.members.fetch(leaderboard[i].discord_id).then(() => true).catch(() => false);
        const tagValue = (isMember) ? `<@${leaderboard[i].discord_id}>` : SanitizeDiscordLog(leaderboard[i].discord_username);
        const countryValue = (leaderboard[i].country !== null) ? `:flag_${leaderboard[i].country}: ` : '';

        leaderboardsFields[0].value += `\n${startPosition + i}. ${countryValue}${tagValue}   <${rank.emoji}> **${Math.floor(leaderboard[i].g2_rating)}**`;
    }
    leaderboardsFields[0].value += '\u200B';
    
    const leaderboardEmbed = {
        color: embedColor,
        title: `🏆 TableturfQ Leaderboard [${startPosition}-${startPosition + leaderboard.length - 1}] 🏆`,
        fields: leaderboardsFields,
        footer: {
        text: `Total ranked players: ${leaderboardData.totalPlayers}`,
        }
    };

    await interaction.reply({ embeds: [leaderboardEmbed] });
}