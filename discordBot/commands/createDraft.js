import { SlashCommandBuilder } from "discord.js";
import { uniqueCards, unique312s } from "../../cards/cardManager.js";
import { BuildSimpleEmbed } from "../utils/embed.js";

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
    { name: 'Undefined', value: 0 },
    { name: 'Main Street', value: 1 },
    { name: 'Thunder Point', value: 2 },
    { name: 'X Marks the Garden', value: 3 },
    { name: 'Square Squared', value: 4 },
    { name: 'Lakefront Property', value: 5 },
    { name: 'Double Gemini', value: 6 },
    { name: 'River Drift', value: 7 },
    { name: 'Box Seats', value: 8 },
    { name: 'Girder for Battle', value: 9 },
    { name: 'Mask Mansion', value: 10 },
    { name: 'Sticky Thicket', value: 11 },
    { name: 'Cracker Snap', value: 12 },
    { name: 'Two-Lane Splattop', value: 13 },
    { name: 'Pedal to the Metal', value: 14 },
    { name: 'Over the Line', value: 15 },
];

const defaultValues = {
    draftSize: 60,
    minSpecialCards: 4,
    timer: 0,
    stage: 0
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

    var embed;

    //await interaction.deferReply();

    try {
        let result = await MakeRequest({
            player1Name: player1,
            player2Name: player2,
            draftSize: draftSize,
            minSpecials: minSpecialCards,
            timer: timer,
            stage: stage,
            includeUnreleasedCards: false
        });
        console.log(result);
        if (result.status != 201){
            embed = BuildSimpleEmbed('Tableturf Draft', 'Draft creation denied', ' ');
        } else{
            var data = JSON.parse(result.responseText);
            embed = BuildSimpleEmbed('Tableturf Draft', `Draft successfully created: ${player1} VS ${player2}`, `[Link](tableturfdraft.se/draft?id=${result.data})`);
        }
    } catch(error){
        embed = BuildSimpleEmbed('Tableturf Draft', 'Draft creation failed', 'The website is probably down');
    }

    await interaction.reply({ embeds: [embed] });
}

function MakeRequest(data){
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://tableturfdraft.se/GenerateNewDraft", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
    });
}