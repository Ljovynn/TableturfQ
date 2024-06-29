import { SlashCommandBuilder } from "discord.js";
import { GetCardById, GetCardByName, GetCardListByLanguage } from "../../cards/cardManager.js";
import { SanitizeString } from "../../utils/string.js";
import { uniqueCards } from "../../cards/cardManager.js";
import { embedColor } from '../utils/constants.js';

export const data = new SlashCommandBuilder()
    .setName('card')
    .setDescription('Get any tableturf card')
    .addSubcommand(subCommand => 
        subCommand
            .setName('byname')
            .setDescription('Get a card by name')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('The card')
                .setRequired(true)
                .setAutocomplete(true))
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('The upgrade level')
                .setMinValue(1)
                .setMaxValue(3)))
    .addSubcommand(subCommand => 
        subCommand
            .setName('byid')
            .setDescription('Get a card by id')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The ID')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(uniqueCards))
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('The upgrade level')
                .setMinValue(1)
                .setMaxValue(3)))
export async function autocomplete(interaction){
    const focusedValue = interaction.options.getFocused();
	const choices = GetCardListByLanguage('en');
    var filteredChoices = [];
    for (let i = 0; i < choices.length; i++){
        if (choices[i].sanitizedName.search(SanitizeString(focusedValue)) != -1) filteredChoices.push(choices[i].name);
    }
    if (filteredChoices.length > 25){
        filteredChoices = filteredChoices.splice(0, 25);
    }
	await interaction.respond(
		filteredChoices.map(choice => ({ name: choice, value: choice })),
	);
}

export async function execute(interaction) { 
    var card;

    const subCommand = interaction.options.getSubcommand();
    if (subCommand === 'byname'){
        const inputName = interaction.options.getString('name');
        card = GetCardByName(inputName, 'en');
    } else{
        const inputId = interaction.options.getInteger('id');
        card = GetCardById(inputId, 'en');
    }
    const level = interaction.options.getInteger('level') ?? 1;

    await interaction.reply({ embeds: [BuildCardEmbed(card, level)] });
}

export function BuildCardEmbed(card, level){
	if (!card){
        const noCardEmbed = {
			color: embedColor,
			title: 'Error: Can\'t find card',
		};
		return noCardEmbed;
    }

	var cardTitle = card.name;

	switch (level){
		case 2: cardTitle += ' ★★';
		break;
		case 3: cardTitle += ' ★★★';
		break;
	}

	var tempFooter = null;
	//temp solution for missing JP cards
	if (level == 4 && card.id > 209){
		level = 1;
		tempFooter = {
		text: '日本語カードが見つかりません。代わりに英語カードを表示',
		}
	}

	cardTitle += ` [${card.id}]`;

	const cardEmbed = {
		color: embedColor,
		title: cardTitle,
		image: {
			url: `https://leanny.github.io/splat3/images/tableturf_full/${card.id}-${level}.png`
		},
		footer: tempFooter,
	};
	return cardEmbed;
}