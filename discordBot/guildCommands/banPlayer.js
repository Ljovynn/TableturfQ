import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { BanUser, GetUserByDiscordId, SuspendUser } from "../../database.js";
import { embedColor } from '../constants.js';

const banLengths = {
    '1 day': 24 * 60 * 60 * 1000,
    '1 week': 7 * 24 * 60 * 60 * 1000,
    '1 month': 30 * 24 * 60 * 60 * 1000,
    '3 months': 91 * 60 * 60 * 1000,
    '6 months': 182 * 60 * 60 * 1000,
    '1 year': 365 * 60 * 60 * 1000,
}

export const data = new SlashCommandBuilder()
    .setName('qban')
    .setDescription('Ban a player from TableturfQ')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(subCommand => 
        subCommand
            .setName('discord')
            .setDescription('Ban a player by their discord user')
            .addUserOption(option =>
                option.setName('user')
                .setDescription('The user')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('ban_length')
                .setDescription('The length of the ban')
                .addChoices(
				{ name: '1 day', value: '1 day' },
				{ name: '1 week', value: '1 week' },
				{ name: '1 month', value: '1 month' },
                { name: '3 months', value: '3 months' },
                { name: '6 months', value: '6 months' },
                { name: '1 year', value: '1 year' },
		    )))
    .addSubcommand(subCommand => 
        subCommand
            .setName('ttbqid')
            .setDescription('Ban a player by their TableturfQ ID')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The ID')
                .setRequired(true)
                .setMinValue(1))
            .addStringOption(option =>
                option.setName('ban_length')
                .setDescription('The length of the ban')
                .addChoices(
				{ name: '1 day', value: '1 day' },
				{ name: '1 week', value: '1 week' },
				{ name: '1 month', value: '1 month' },
                { name: '3 months', value: '3 months' },
                { name: '6 months', value: '6 months' },
                { name: '1 year', value: '1 year' },
		    )))
export async function execute(interaction) { 
    const user = interaction.options.getUser('user');
    const banLengthObject = interaction.options.get('ban_length', false);
    var banLength = null;
    if (banLengthObject) banLength = banLengthObject.value;

    var id;
    if (user){
        const DBuser = await GetUserByDiscordId(user.id);
        if (!DBuser){
            const banFailedEmbed = {
                color: embedColor,
                title: 'Ban failed',
                fields: [ {
                    name: `Failed to ban user. Error message:`,
                    value: `Discord user <@${user.id}> has no TableturfQ account.`,
                },],
            };
            await interaction.reply({ embeds: [banFailedEmbed] });
            return;
        }
        id = DBuser.id;
    } else{
        id = interaction.options.getInteger('id');
    }

    try{
        if (banLengthObject){
            await SuspendUser(id, banLengths[banLength]);
            const banEmbed = {
		        color: embedColor,
		        title: 'Ban successful',
		        fields: [ {
                    name: `Successfully suspended user with TableturfQ id **${id}**.`,
                    value: `The ban lasts for ${banLength}.`,
                }],
	        };
            await interaction.reply({ embeds: [banEmbed] });
        } else{
            await BanUser(id);
            const banEmbed = {
		        color: embedColor,
		        title: 'Ban successful',
		        fields: [ {
                    name: `Successfully banned user with TableturfQ id **${id}**.`,
                    value: 'The ban is permanent.',
                }],
	        };
            await interaction.reply({ embeds: [banEmbed] });
    }
    } catch(error){
        const banFailedEmbed = {
            color: embedColor,
            title: 'Ban failed',
            fields: [ {
                name: `Failed to ban user with TableturfQ id ${id}. Error message:`,
                value: error.message,
            },],
        };
        await interaction.reply({ embeds: [banFailedEmbed] });
        return;
    }
}