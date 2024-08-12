import { SlashCommandBuilder } from "discord.js";
import { embedColor } from '../utils/constants.js';
import { GetRank } from "../../public/constants/rankData.js";
import { SanitizeDiscordLog } from "../../utils/string.js";
import { GetLeaderboard } from "../../database.js";
import { GetLeaderboardSize } from "../../cache/leaderboardSize.js";

const limit = 10;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription(`Get the current leaderboard, listing ${limit} players`)
    .addIntegerOption(option =>
		option.setName('position')
			.setDescription('Starting position')
            .setMinValue(1))

export async function execute(interaction) { 
    const startPosition = interaction.options.getInteger('position') ?? 1;
    const leaderboard = await GetLeaderboard(startPosition - 1, limit);

    var leaderboardsFields = [ 
    {
        name: '\u200B',
        value: ''},
    ];

    const userIds = leaderboard.map((x) => x.discord_id.toString());
    const guildMembers = await interaction.guild.members.fetch({ user: userIds, withPresences: false });

    for (let i = 0; i < leaderboard.length; i++){
        let rank = GetRank(leaderboard[i].g2_rating);

        let isMember = guildMembers.find(discordUser => (discordUser.user.id === leaderboard[i].discord_id));

        let tagValue = (isMember) ? `<@${leaderboard[i].discord_id}>` : SanitizeDiscordLog(leaderboard[i].discord_username);
        let countryValue = (leaderboard[i].country !== null) ? `:flag_${leaderboard[i].country}:` : ':earth_africa:';

        leaderboardsFields[0].value += `\n${startPosition + i}. ${countryValue} ${rank.emoji} **${Math.floor(leaderboard[i].g2_rating)}** ${tagValue}`;
    }
    leaderboardsFields[0].value += '\u200B';
    
    const leaderboardEmbed = {
        color: embedColor,
        title: `🏆 TableturfQ Leaderboard [${startPosition}-${startPosition + leaderboard.length - 1}] 🏆`,
        fields: leaderboardsFields,
        footer: {
        text: `Total ranked players: ${GetLeaderboardSize()}`,
        }
    };

    await interaction.reply({ embeds: [leaderboardEmbed] });
}