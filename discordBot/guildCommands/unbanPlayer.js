import { SlashCommandBuilder } from "discord.js";
import { BuildUnbanEmbed } from "../embedBuilder.js";
import { GetUserByDiscordId, UnbanUser } from "../../database.js";

export const data = new SlashCommandBuilder()
    .setName('qpardon')
    .setDescription('Unban a player from TableturfQ')
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_discord')
            .setDescription('Unban a player by their discord user')
            .addUserOption(option =>
                option.setName('user')
                .setDescription('The user')
                .setRequired(true)))
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_id')
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
            await interaction.reply({ embeds: [BuildUnbanEmbed(id, false, `Discord user <@${user.id}> has no TableturfQ account.`)] });
            return;
        }
        id = DBuser.id;
    } else{
        id = interaction.options.getInteger('id');
    }

    try{
        await UnbanUser(id);
    } catch(error){
        await interaction.reply({ embeds: [BuildUnbanEmbed(id, false, error.message)] });
        return;
    }

    await interaction.reply({ embeds: [BuildUnbanEmbed(id, true)] });
}