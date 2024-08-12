import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { BanUser, GetUserByDiscordId, GetUserData, SetUserRole, SuspendUser, UnbanUser } from "../../database.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { userRoles } from "../../public/constants/userData.js";
import { idSize } from "../../nanoIdManager.js";
import { SanitizeDiscordLog } from "../../utils/string.js";
import { HandleBanUser } from "../../utils/userUtils.js";

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
                        .addChoices(banLengthDiscordOptions))
                    .addStringOption(option =>
                        option.setName('reason')
                        .setDescription('The reason for the ban')
                        .setMaxLength(128)))
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
                    .addStringOption(option =>
                        option.setName('id')
                        .setDescription('The ID')
                        .setRequired(true)
                        .setMinLength(idSize)
                        .setMaxLength(idSize))
                    .addStringOption(option =>
                        option.setName('banlength')
                        .setDescription('The length of the ban')
                        .addChoices(banLengthDiscordOptions))
                    .addStringOption(option =>
                        option.setName('reason')
                        .setDescription('The reason for the ban')
                        .setMaxLength(128)))
            .addSubcommand(subCommand => 
                subCommand
                    .setName('pardon')
                    .setDescription('Unban the user\'s TableturfQ account')
                    .addStringOption(option =>
                        option.setName('id')
                        .setDescription('The ID')
                        .setRequired(true)
                        .setMinLength(idSize)
                        .setMaxLength(idSize))))
export async function execute(interaction) {
    const subCommandGroup = interaction.options.getSubcommandGroup();

    var discordUser;
    var user;
    if (subCommandGroup === 'bydiscord'){
        discordUser = interaction.options.getUser('user');
        user = await GetUserByDiscordId(discordUser.id);
        if (!user){
            const banFailedEmbed = BuildSimpleEmbed('Ban failed', 'Failed to ban user. Error message:', `Discord user <@${discordUser.id}> has no TableturfQ account.`);
            await interaction.reply({ embeds: [banFailedEmbed] });
            return;
        }
    } else{
        user = await GetUserData(interaction.options.getString('id'));
    }

    const subCommand = interaction.options.getSubcommand();
    //ban
    if (subCommand === 'ban'){
        const banLengthObject = interaction.options.get('banlength', false);
        const banLength = (banLengthObject) ? banLengthObject.value : null;
        const reason = interaction.options.getString('reason', false);
        var reasonEmbedText = (reason) ? reason : 'No reason provided.';

        try{
            if (banLengthObject){
                await SuspendUser(user.id, banLengths[banLength], reason);
                await HandleBanUser(user.id);
                const banEmbed = BuildSimpleEmbed('Ban successful', `Successfully suspended user **${SanitizeDiscordLog(user.username)}**`, `The ban lasts for ${banLength}.\nReason: ${reasonEmbedText}`);
                await interaction.reply({ embeds: [banEmbed] });
                return;
            } else{
                await BanUser(user.id, reason);
                await HandleBanUser(user.id);
                const banEmbed = BuildSimpleEmbed('Ban successful', `Successfully banned user **${SanitizeDiscordLog(user.username)}**`, `The ban is permanent.\nReason: ${reasonEmbedText}`);
                await interaction.reply({ embeds: [banEmbed] });
                return;
        }
        } catch(error){
            const banFailedEmbed = BuildSimpleEmbed('Ban failed', `Failed to ban user **${SanitizeDiscordLog(user.username)}**. Error message:`, error.message);
            await interaction.reply({ embeds: [banFailedEmbed] });
            return;
        }
    }

    //unban
    if (subCommand === 'pardon'){
        try{
            await UnbanUser(user.id);

            const unbanEmbed = BuildSimpleEmbed('Unban successful', `Successfully unbanned user **${SanitizeDiscordLog(user.username)}**`, 'Good for them');
            await interaction.reply({ embeds: [unbanEmbed] });
            return;
        } catch(error){
            const unbanFailedEmbed = BuildSimpleEmbed('Unban failed', `Failed to unban user **${SanitizeDiscordLog(user.username)}**. Error message:`, error.message);
            await interaction.reply({embeds: [unbanFailedEmbed] });
            return;
        }
    }

    //set role
    try{
        const newRole = interaction.options.get('role').value;
        await SetUserRole(user.id, newRole);

        const setRoleEmbed = BuildSimpleEmbed('Role set successfully', `Successfully set user **${SanitizeDiscordLog(user.username)}** as role ${roleOptions[newRole - 1].name}`, `Discord user: <@${discordUser.id}>`);
        await interaction.reply({ embeds: [setRoleEmbed] });
        return;
    } catch(error){
        const setRoledFailedEmbed = BuildSimpleEmbed('Set role failed', `Failed to update role of user **${SanitizeDiscordLog(user.username)}**`, `Discord user: <@${discordUser.id}>. Error message: ${error.message}`);
        await interaction.reply({embeds: [setRoledFailedEmbed] });
        return;
    }
}