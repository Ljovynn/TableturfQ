import { SlashCommandBuilder, ChannelType } from "discord.js";
import { SetDisputeLogChannel } from "../discordBotVariables.js";

export const data = new SlashCommandBuilder()
    .setName('setdisputes')
    .setDescription('Sets the channel where disputes are logged')
    .addChannelOption(option =>
		option.setName('channel')
			.setDescription('The channel to set the logging to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true));

export async function execute(interaction) { 
    const channel = interaction.options.getChannel('channel');
    SetDisputeLogChannel(channel.id);
    await interaction.reply(`Set the channel to <#${channel.id}>`);
}