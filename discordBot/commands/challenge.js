import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { matchModes, setLengths } from "../../public/constants/matchData.js";
import { GetUserByDiscordId } from "../../database.js";
import { FindIfPlayerInMatch, MakeNewMatch } from "../../matchManager.js";
import { RemovePlayerFromAnyQue } from "../../queManager.js";

import dotenv from 'dotenv';

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;

const defaultSetLength = setLengths.bo5;

const setLengthOptions = [
    { name: 'Best of 3', value: setLengths.bo3},
    { name: 'Best of 5', value: setLengths.bo5},
    { name: 'Best of 7 ', value: setLengths.bo7 },
];

export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge another player for a private battle')
    .addUserOption(option =>
		option.setName('player')
			.setDescription('The other player')
            .setRequired(true))
    .addIntegerOption(option =>
		option.setName('setlength')
			.setDescription('The length of the match')
            .addChoices(setLengthOptions))

export async function execute(interaction) { 
    const discordUser = interaction.user;
    const challengedDiscordUser = interaction.options.getUser('player');
    const setLength = interaction.options.getInteger('setlength') ?? defaultSetLength;

    if (discordUser.id === challengedDiscordUser.id){
        const sameUserEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', 'You can\'t challenge yourself.');
        await interaction.reply({ embeds: [sameUserEmbed] });
		return;       
    }
    const user = await GetUserByDiscordId(discordUser.id);
    if (!user){
        const noUserEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${discordUser.id}> has no TableturfQ profile`);
        await interaction.reply({ embeds: [noUserEmbed] });
		return;        
    }

    const challengedUser = await GetUserByDiscordId(challengedDiscordUser.id);
    if (!challengedUser){
        const noUserEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${challengedDiscordUser.id}> has no TableturfQ profile`);
        await interaction.reply({ embeds: [noUserEmbed] });
		return;        
    }

    //create buttons
    const accept = new ButtonBuilder()
		.setCustomId('accept')
		.setLabel('Accept challenge')
		.setStyle(ButtonStyle.Primary);

	const deny = new ButtonBuilder()
		.setCustomId('deny')
		.setLabel('Deny challenge')
		.setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
		.addComponents(accept, deny);

    const challengeEmbed = BuildSimpleEmbed('Challenge player', 
        `${setLengthOptions[setLength - 2].name}`,
        `<@${discordUser.id}> has challenged <@${challengedDiscordUser.id}> for a Tableturf Battle!
        <@${challengedDiscordUser.id}> may accept or deny`);

    const response = await interaction.reply({ embeds: [challengeEmbed], components: [row] });
    const ping = await interaction.followUp({content: `<@${challengedDiscordUser.id}>`});
    await ping.delete();

    const collectorFilter = i => i.user.id === challengedDiscordUser.id;
    try {
	    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

	    if (confirmation.customId === 'accept') {
            
            if (FindIfPlayerInMatch(user.id)){
                const alreadyInMatchEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${discordUser.id}> is already in a match`);
                await confirmation.update({ embeds: [alreadyInMatchEmbed], components: [] });
		        return;      
            } else if (FindIfPlayerInMatch(challengedUser.id)){
                const alreadyInMatchEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${challengedDiscordUser.id}> is already in a match`);
                await confirmation.update({ embeds: [alreadyInMatchEmbed], components: [] });
		        return;        
            }
            RemovePlayerFromAnyQue(user.id);
            RemovePlayerFromAnyQue(challengedUser.id);

            const match = MakeNewMatch(user.id, challengedUser.id, matchModes.ranked, true, setLength);
            const acceptEmbed = BuildSimpleEmbed('Challenge accepted', 
                `${setLengthOptions[setLength - 2].name}`,
                `<@${discordUser.id}> VS <@${challengedDiscordUser.id}>\n[Link](${websiteURL}/game?matchID=${match.id})`);

            await confirmation.update({ embeds: [acceptEmbed], components: [] });
            const confirmPing = await interaction.followUp({content: `<@${discordUser.id}>`});
            await confirmPing.delete();
	    } else if (confirmation.customId === 'deny') {
            const denyEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${challengedDiscordUser.id}> denied the challenge`);
	        await confirmation.update({ embeds: [denyEmbed], components: [] });
	    }
    } catch (error) {
        const timeoutEmbed = BuildSimpleEmbed('Challenge player', 'Challenge failed', `<@${challengedDiscordUser.id}> took too long to respond`);
	    await interaction.editReply({embeds: [timeoutEmbed], components: [] });
    }
}