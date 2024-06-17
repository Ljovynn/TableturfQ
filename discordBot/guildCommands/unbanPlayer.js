import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { GetUserByDiscordId, UnbanUser } from "../../database.js";
import { embedColor } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('qpardon')
    .setDescription('Unban a player from TableturfQ')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(subCommand => 
        subCommand
            .setName('discord')
            .setDescription('Unban a player by their discord user')
            .addUserOption(option =>
                option.setName('user')
                .setDescription('The user')
                .setRequired(true)))
    .addSubcommand(subCommand => 
        subCommand
            .setName('ttbqid')
            .setDescription('Unban a player by their TableturfQ ID')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The ID')
                .setRequired(true)
                .setMinValue(1)))
export async function execute(interaction) { 
    const user = interaction.options.getUser('user');

    var id;
    if (user){
        const DBuser = await GetUserByDiscordId(user.id);
        if (!DBuser){
            const unbanFailedEmbed = {
                color: embedColor,
                title: 'Unban failed',
                fields: [ {
                    name: `Failed to unban user with TableturfQ id ${id}. Error message:`,
                    value: `Discord user <@${user.id}> has no TableturfQ account.`,
                },],
            };

            await interaction.reply({ embeds: [unbanFailedEmbed] });
            return;
        }
        id = DBuser.id;
    } else{
        id = interaction.options.getInteger('id');
    }

    try{
        await UnbanUser(id);
    } catch(error){
        const unbanFailedEmbed = {
            color: embedColor,
            title: 'Unban failed',
            fields: [ {
                name: `Failed to unban user with TableturfQ id ${id}. Error message:`,
                value: error.message,
            },],
        };

        await interaction.reply({embeds: [unbanFailedEmbed] });
    }

    const unbanEmbed = {
        color: embedColor,
        title: 'Unban successful',
        fields: [{
            name: `Successfully unbanned user with TableturfQ id **${id}**.`,
            value: 'Good for them.',
        }],
    };

    await interaction.reply({ embeds: [unbanEmbed] });
}