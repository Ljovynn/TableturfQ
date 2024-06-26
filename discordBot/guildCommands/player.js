import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { BanUser, GetUserByDiscordId, SetUserRole, SuspendUser, UnbanUser } from "../../database.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { userRoles } from "../../public/constants/userData.js";

const banLengths = {
    '1 day': 24 * 60 * 60 * 1000,
    '1 week': 7 * 24 * 60 * 60 * 1000,
    '1 month': 30 * 24 * 60 * 60 * 1000,
    '3 months': 91 * 24 * 60 * 60 * 1000,
    '6 months': 182 * 24 * 60 * 60 * 1000,
    '1 year': 365 * 24 * 60 * 60 * 1000,
}

const banLengthDiscordOptions = [
    { name: '1 day', value: '1 day' },
    { name: '1 week', value: '1 week' },
    { name: '1 month', value: '1 month' },
    { name: '3 months', value: '3 months' },
    { name: '6 months', value: '6 months' },
    { name: '1 year', value: '1 year' },
];

const roleOptions = [
    { name: 'Regular user', value: userRoles.verified },
    { name: 'Moderator', value: userRoles.mod },
];

export const data = new SlashCommandBuilder()
    .setName('ttbqplayer')
    .setDescription('Set a player\'s status')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommandGroup(subCommandGroup =>
        subCommandGroup
            .setName('bydiscord')
            .setDescription('Get a player by their discord user')
            .addSubcommand(subCommand => 
                subCommand
                    .setName('ban')
                    .setDescription('Ban the user\'s TableturfQ account')
                    .addUserOption(option =>
                        option.setName('user')
                        .setDescription('The user')
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName('banlength')
                        .setDescription('The length of the ban')
                        .addChoices(banLengthDiscordOptions)))
            .addSubcommand(subCommand => 
                subCommand
                    .setName('pardon')
                    .setDescription('Unban the user\'s TableturfQ account')
                    .addUserOption(option =>
                        option.setName('user')
                        .setDescription('The user')
                        .setRequired(true)))
            .addSubcommand(subCommand => 
                subCommand
                    .setName('setrole')
                    .setDescription('Set the user\'s TableturfQ account role')
                    .addUserOption(option =>
                        option.setName('user')
                        .setDescription('The user')
                        .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('role')
                        .setDescription('The new role')
                        .addChoices(roleOptions))))
    .addSubcommandGroup(subCommandGroup =>
        subCommandGroup
            .setName('byid')
            .setDescription('Get a player by their TableturfQ ID')
            .addSubcommand(subCommand => 
                subCommand
                    .setName('ban')
                    .setDescription('Ban the user\'s TableturfQ account')
                    .addIntegerOption(option =>
                        option.setName('id')
                        .setDescription('The ID')
                        .setRequired(true)
                        .setMinValue(1))
                    .addStringOption(option =>
                        option.setName('banlength')
                        .setDescription('The length of the ban')
                        .addChoices(banLengthDiscordOptions)))
            .addSubcommand(subCommand => 
                subCommand
                    .setName('pardon')
                    .setDescription('Unban the user\'s TableturfQ account')
                    .addIntegerOption(option =>
                        option.setName('id')
                        .setDescription('The ID')
                        .setRequired(true)
                        .setMinValue(1))))
export async function execute(interaction) {
    const subCommandGroup = interaction.options.getSubcommandGroup();

    var discordUser;
    var id;
    if (subCommandGroup === 'bydiscord'){
        discordUser = interaction.options.getUser('user');
        const DBuser = await GetUserByDiscordId(discordUser.id);
        if (!DBuser){
            const banFailedEmbed = BuildSimpleEmbed('Ban failed', 'Failed to ban user. Error message:', `Discord user <@${discordUser.id}> has no TableturfQ account.`);
            await interaction.reply({ embeds: [banFailedEmbed] });
            return;
        }
        id = DBuser.id;
    } else{
        id = interaction.options.getInteger('id');
    }

    const subCommand = interaction.options.getSubcommand();
    //ban
    if (subCommand === 'ban'){
        const banLengthObject = interaction.options.get('banlength', false);
        var banLength = null;
        if (banLengthObject) banLength = banLengthObject.value;

        console.log("ban length: " + banLength);
        try{
            if (banLengthObject){
                await SuspendUser(id, banLengths[banLength]);
                const banEmbed = BuildSimpleEmbed('Ban successful', `Successfully suspended user with TableturfQ id **${id}**.`, `The ban lasts for ${banLength}.`);
                await interaction.reply({ embeds: [banEmbed] });
                return;
            } else{
                await BanUser(id);
                const banEmbed = BuildSimpleEmbed('Ban successful', `Successfully banned user with TableturfQ id **${id}**.`, 'The ban is permanent.');
                await interaction.reply({ embeds: [banEmbed] });
                return;
        }
        } catch(error){
            const banFailedEmbed = BuildSimpleEmbed('Ban failed', `Failed to ban user with TableturfQ id **${id}**. Error message:`, error.message);
            await interaction.reply({ embeds: [banFailedEmbed] });
            return;
        }
    }

    //unban
    if (subCommand === 'pardon'){
        try{
            await UnbanUser(id);

            const unbanEmbed = BuildSimpleEmbed('Unban successful', `Successfully unbanned user with TableturfQ id **${id}**.`, 'Good for them.');
            await interaction.reply({ embeds: [unbanEmbed] });
            return;
        } catch(error){
            const unbanFailedEmbed = BuildSimpleEmbed('Unban failed', `Failed to unban user with TableturfQ id ${id}. Error message:`, error.message);
            await interaction.reply({embeds: [unbanFailedEmbed] });
            return;
        }
    }

    //set role
    try{
        const newRole = interaction.options.get('role');
        await SetUserRole(id, newRole.value);

        const setRoleEmbed = BuildSimpleEmbed('Role set successfully', `Successfully set Discord user's TableturfQ account <@${discordUser.id}> as ${newRole.name}.`, ' ');
        await interaction.reply({ embeds: [setRoleEmbed] });
        return;
    } catch(error){
        const setRoledFailedEmbed = BuildSimpleEmbed('Set role failed', `Failed to set update role of Discord user <@${discordUser.id}>'s TableturfQ account. Error message:`, error.message);
        await interaction.reply({embeds: [setRoledFailedEmbed] });
        return;
    }
}