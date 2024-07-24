import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { GetQueAvailible, SetQueAvailible } from "../../queManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";

export const data = new SlashCommandBuilder()
    .setName('matchmaking')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Enable or disable matchmaking')
    .addSubcommand(subCommand => 
        subCommand
            .setName('enable')
            .setDescription('Enable matchmaking'))
    .addSubcommand(subCommand => 
        subCommand
            .setName('disable')
            .setDescription('Disable matchmaking'))
    .addSubcommand(subCommand => 
        subCommand
            .setName('status')
            .setDescription('Check the status of matchmaking'))

export async function execute(interaction) { 
    const subCommand = interaction.options.getSubcommand();
    var enabled = true;
    if (subCommand === 'status'){
        const statusEmbed = BuildSimpleEmbed('Matchmaking status:', `Enabled: ${GetQueAvailible()}`, '\u200B');

        await interaction.reply({ embeds: [statusEmbed] });
        return;
    }
    if (subCommand === 'disable'){
        enabled = false;
    }
    SetQueAvailible(enabled);

    const embed = BuildSimpleEmbed('Updated matchmaking abailability', `Queue enabled: ${enabled}`, '\u200B');

    await interaction.reply({ embeds: [embed] });
}