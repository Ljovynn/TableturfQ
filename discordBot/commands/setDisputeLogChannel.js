import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('setdisputes')
    .setDescription('Sets the channel where disputes are logged');

export async function execute(interaction) { 
    await interaction.reply('Implementation not set');
}