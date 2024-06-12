import { SlashCommandBuilder, ChannelType } from "discord.js";
import { GetDiscordAdminRollId, SetDisputeLogChannel } from "../discordBotVariables.js";

export const data = new SlashCommandBuilder()
    .setName('setdisputes')
    .setDescription('Sets the channel where disputes are logged')
    .addChannelOption(option =>
		option.setName('channel')
			.setDescription('The channel to set the logging to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true));

export async function execute(interaction) { 
    //check if admin
    const member = interaction.options.getMember('target');
    if (!member.roles.cache.some(role => role.name === GetDiscordAdminRollId())) return;

    const channel = interaction.options.getChannel('channel');
    SetDisputeLogChannel(channel.id);
    await interaction.reply(`Set the channel to <#${channel.id}>`);
}