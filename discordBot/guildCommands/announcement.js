import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { CheckIfAnnouncementExistsById, DeleteAnnouncementById, SetNewAnnouncement } from "../../announcementManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { embedColor } from "../utils/constants.js";
import { DetailMinute } from "../../utils/date.js";

export const data = new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Add or remove announcement info')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subCommand => 
        subCommand
            .setName('add')
            .setDescription('Add announcement info')
            .addStringOption(option =>
		        option.setName('title')
			        .setDescription('The title')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The description')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('date')
                    .setDescription('The UNIX timestamp date')
                    .setMinValue(1)
                    .setRequired(true))
            .addBooleanOption(option =>
                option.setName('isevent')
                    .setDescription('Is it an event?')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('iconsrc')
                    .setDescription('The URL for the icon source')))
    .addSubcommand(subCommand => 
        subCommand
            .setName('remove')
            .setDescription('Remove announcement info')
            .addIntegerOption(option =>
		        option.setName('id')
			        .setDescription('The announcement ID')
                    .setRequired(true)
                    .setMinValue(1)))
export async function execute(interaction) { 
    const subCommand = interaction.options.getSubcommand();
    
    //remove announcement
    if (subCommand === 'remove'){
        const id = interaction.options.getInteger('id');
        if (!CheckIfAnnouncementExistsById(id)){
            const errorEmbed = BuildSimpleEmbed('Announcement removal failed', 'Error message:', `No Announcement found with id **${id}**`);
            await interaction.reply({ embeds: [errorEmbed] });
            return;
        }
        await DeleteAnnouncementById(id);
        
        const removeEmbed = BuildSimpleEmbed('Successfully removed Announcement', `Removed Announcement with id ${id}`, '\u200B');
        await interaction.reply({ embeds: [removeEmbed] });
        return;
    }

    //add announcement
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const iconSrc = interaction.options.getString('iconsrc', false);
    const date = interaction.options.getInteger('date');
    const isEvent = interaction.options.getBoolean('isevent');

    var newAnnouncementId = await SetNewAnnouncement(title, description, iconSrc, date, isEvent);

    //if error
    if (typeof(newAnnouncementId) === 'string'){
        const errorEmbed = BuildSimpleEmbed('Announcement failed to be added', 'Error message:', newAnnouncementId);
        await interaction.reply({ embeds: [errorEmbed] });
        return;
    }

    const announcmentCalled = (isEvent) ? 'Announcement' : 'Event';

    const embed = {
        color: embedColor,
        title: `${announcmentCalled} ${title} added`,
        fields: [ {
            name: `Announcement ID: ${newAnnouncementId}`,
            value: description,
        },{
            name: 'Date:',
            value: `${DetailMinute(new Date(date * 1000))} UTC`,
        }],
        thumbnail: {
			url: iconSrc,
		},
    };
    await interaction.reply({ embeds: [embed] });
}