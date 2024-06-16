import { SlashCommandBuilder } from "discord.js";
import { BanUser, GetUserByDiscordId, SuspendUser } from "../../database.js";
import { BuildBanEmbed } from "../embedBuilder.js";

import dotenv from 'dotenv';

dotenv.config();
const adminRole = process.env.DISCORD_ADMIN_ROLL_ID;

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
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_discord')
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
            .setName('by_id')
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
            await interaction.reply({ embeds: [BuildBanEmbed(id, false, `Discord user <@${user.id}> has no TableturfQ account.`)] });
            return;
        }
        id = DBuser.id;
    } else{
        id = interaction.options.getInteger('id');
    }

    try{
        if (banLengthObject){
        await SuspendUser(id, banLengths[banLength]);
        } else{
        await BanUser(id);
    }
    } catch(error){
        await interaction.reply({ embeds: [BuildBanEmbed(id, false, error)] });
        return;
    }

    await interaction.reply({ embeds: [BuildBanEmbed(id, true, banLength)] });
}