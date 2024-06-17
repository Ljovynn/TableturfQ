import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { SetQueAvailible } from "../../queEnabled.js";
import { BuildSimpleEmbed } from "../utils/embed.js";

export const data = new SlashCommandBuilder()
    .setName('matchmaking')
    .setDescription('Enable or disable matchmaking')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subCommand => 
        subCommand
            .setName('enable')
            .setDescription('Enable matchmaking'))
    .addSubcommand(subCommand => 
        subCommand
            .setName('disable')
            .setDescription('Disable matchmaking'))

export async function execute(interaction) { 
    const subCommand = interaction.options.getSubcommand();
    var enabled = true;
    if (subCommand === 'disable'){
        enabled = false;
    }
    SetQueAvailible(enabled);

    const embed = BuildSimpleEmbed('Updated matchmaking abailability', `Que enabled: ${enabled}`, '\u200B');

    await interaction.reply({ embeds: [embed] });
}