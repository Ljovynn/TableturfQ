import axios from 'axios';
import { embedColor } from '../constants.js';
import { SlashCommandBuilder } from "discord.js";
import { uniqueCards, unique312s } from "../../cards/cardManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";
import { stages, stageImageSources } from '../../public/constants/stageData.js';

import dotenv from 'dotenv';

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;

const timerOptions = [
    { name: 'None', value: 0 },
    { name: '10 seconds', value: 10 },
    { name: '20 seconds', value: 20 },
    { name: '30 seconds', value: 30 },
    { name: '40 seconds', value: 40 },
    { name: '50 seconds', value: 50 },
    { name: '1 minute', value: 60 },
    { name: '2 minutes', value: 120 },
];

const stageOptions= [
    { name: 'Undefined', value: stages.unpicked },
    { name: 'Main Street', value: stages.mainStreet },
    { name: 'Thunder Point', value: stages.thunderPoint },
    { name: 'X Marks the Garden', value: stages.xMarksTheGarden },
    { name: 'Square Squared', value: stages.squareSquared },
    { name: 'Lakefront Property', value: stages.lakefrontProperty },
    { name: 'Double Gemini', value: stages.doubleGemini },
    { name: 'River Drift', value: stages.riverDrift },
    { name: 'Box Seats', value: stages.boxSeats },
    { name: 'Girder for Battle', value: stages.girderForBattle },
    { name: 'Mask Mansion', value: stages.maskMansion },
    { name: 'Sticky Thicket', value: stages.stickyThicket },
    { name: 'Cracker Snap', value: stages.crackerSnap },
    { name: 'Two-Lane Splattop', value: stages.twoLaneSplattop },
    { name: 'Pedal to the Metal', value: stages.pedalToTheMedal },
    { name: 'Over the Line', value: stages.overTheLine },
];

const defaultValues = {
    draftSize: 60,
    minSpecialCards: 4,
    timer: 0,
    stage: stages.unpicked
}

export const data = new SlashCommandBuilder()
    .setName('createdraft')
    .setDescription(`Create a draft on www.tableturfdraft.se`)
    .addStringOption(option =>
		option.setName('player1')
			.setDescription('Player 1\s name')
            .setRequired(true)
            .setMaxLength(32))
    .addStringOption(option =>
		option.setName('player2')
			.setDescription('Player 2\s name')
            .setRequired(true)
            .setMaxLength(32))
    .addIntegerOption(option =>
		option.setName('draftsize')
			.setDescription('The draft size')
            .setMinValue(30)
            .setMaxValue(uniqueCards))
    .addIntegerOption(option =>
		option.setName('312s')
			.setDescription('The minimum amount of 3-12s')
            .setMinValue(0)
            .setMaxValue(unique312s))
    .addIntegerOption(option =>
		option.setName('timer')
			.setDescription('The timer length')
            .addChoices(timerOptions))
    .addIntegerOption(option =>
		option.setName('stage')
			.setDescription('The stage')
            .addChoices(stageOptions))

export async function execute(interaction) { 
    const player1 = interaction.options.getString('player1');
    const player2 = interaction.options.getString('player2');
    const draftSize = interaction.options.getInteger('draftsize') ?? defaultValues.draftSize;
    const minSpecialCards = interaction.options.getInteger('312s') ?? defaultValues.minSpecialCards;
    const timer = interaction.options.getInteger('timer') ?? defaultValues.timer;
    const stage = interaction.options.getInteger('stage') ?? defaultValues.stage;

    await interaction.deferReply();

    try {
        const formData = {
            player1Name: player1,
            player2Name: player2,
            draftSize: draftSize,
            minSpecials: minSpecialCards,
            timer: timer,
            stage: stage,
            includeUnreleasedCards: false
        }
        const response = await axios.post('http://tableturfdraft.se/GenerateNewDraft',
            formData, {
                timeout: 5 * 1000,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        console.log(response);
        if (response.status != 201){
            const deniedEmbed = BuildSimpleEmbed('Tableturf Draft', 'Draft creation denied', ' ');
            await interaction.editReply({ embeds: [deniedEmbed] });
            return;
        } else{
            const embedFields = [
                {
                    name: `Draft successfully created: ${player1} VS ${player2}`,
                    value: `[Link](http://tableturfdraft.se/draft?id=${response.data})`,
                    inline: false
                },
                {
                    name: 'Draft size',
                    value: draftSize,
                    inline: true
                },
                {
                    name: 'Min 3-12s',
                    value: minSpecialCards,
                    inline: true
                },
                {
                    name: 'Timer',
                    value: `${timer} seconds`,
                    inline: true
                },
            ]

            const embed = {
                color: embedColor,
                title: 'Tableturf Draft',
                author: {
                    name: `${user.username}`,
                    icon_url: `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar_hash}.png`,
                    url: `${websiteURL}/profile?playerId=${user.id}`,
                },
                thumbnail: {
                    url: `${websiteURL}/assets/images/${stageImageSources[stage]}`,
                },
                fields: embedFields,
            };
            await interaction.editReply({ embeds: [embed] });
            return;
        }
    } catch(error){
        const errorEmbed = BuildSimpleEmbed('Tableturf Draft', 'Draft creation failed', 'The website is probably down');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}