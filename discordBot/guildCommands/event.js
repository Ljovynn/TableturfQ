import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { CheckIfEventExistsById, DeleteEventById, SetNewEvent } from "../../eventInfoManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { embedColor } from "../constants.js";
import { DetailMinute } from "../../utils/date.js";

export const data = new SlashCommandBuilder()
    .setName('event')
    .setDescription('Add or remove event info')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subCommand => 
        subCommand
            .setName('add')
            .setDescription('Add event info')
            .addStringOption(option =>
		        option.setName('name')
			        .setDescription('The name')
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
            .addStringOption(option =>
                option.setName('iconsrc')
                    .setDescription('The URL for the icon source')))
    .addSubcommand(subCommand => 
        subCommand
            .setName('remove')
            .setDescription('Remove event info')
            .addIntegerOption(option =>
		        option.setName('id')
			        .setDescription('The event ID')
                    .setRequired(true)
                    .setMinValue(1)))
export async function execute(interaction) { 
    const subCommand = interaction.options.getSubcommand();

    //remove event
    if (subCommand === 'remove'){
        const id = interaction.options.getInteger('id');
        if (!CheckIfEventExistsById(id)){
            const errorEmbed = BuildSimpleEmbed('Event removal failed', 'Error message:', `No event found with id **${id}**`);
            await interaction.reply({ embeds: [errorEmbed] });
            return;
        }
        await DeleteEventById(id);
        
        const removeEmbed = BuildSimpleEmbed('Successfully removed event', `Removed event with id ${id}`, '\u200B');
        await interaction.reply({ embeds: [removeEmbed] });
        return;
    }

    //add event
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const iconSrc = interaction.options.getString('iconsrc', false);
    const date = interaction.options.getInteger('date');

    var newEventId = await SetNewEvent(name, description, iconSrc, date);

    //if error
    if (typeof(newEventId) === 'string'){
        const errorEmbed = BuildSimpleEmbed('Event failed to be added', 'Error message:', newEventId);
        await interaction.reply({ embeds: [errorEmbed] });
        return;
    }

    const embed = {
        color: embedColor,
        title: `Event ${name} added`,
        fields: [ {
            name: `Event ID: ${newEventId}`,
            value: description,
        },{
            name: 'Date:',
            value: DetailMinute(new Date(date * 1000)),
        }],
        thumbnail: {
			url: iconSrc,
		},
    };
    await interaction.reply({ embeds: [embed] });
}