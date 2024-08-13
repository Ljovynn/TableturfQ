import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { idSize } from "../../nanoIdManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { FindMatch, FinishMatch } from "../../matchManager.js";

export const data = new SlashCommandBuilder()
    .setName('cancelmatch')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Failsafe to cancel a bugged match')
    .addStringOption(option =>
        option.setName('id')
            .setDescription('The match ID')
            .setRequired(true)
            .setMinLength(idSize)
            .setMaxLength(idSize))

export async function execute(interaction) {
    const matchId = interaction.options.getString('id');
    const match = FindMatch(matchId);
    if (!match){
        const noMatchEmbed = BuildSimpleEmbed('Cancel match', 'Failed', `Match with id ${matchId} does not exist`);

        await interaction.reply({ embeds: [noMatchEmbed] });
        return;
    }

    if (!await FinishMatch(match, true)){
        const cantFinishMatch = BuildSimpleEmbed('Cancel match', 'Failed', 'Server error');

        await interaction.reply({ embeds: [cantFinishMatch] });
        return;
    }

    const embed = BuildSimpleEmbed('Cancel match', 'Success', `Match with id ${matchId} has been cancelled`);

    await interaction.reply({ embeds: [embed] });
}