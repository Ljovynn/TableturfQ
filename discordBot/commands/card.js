import { SlashCommandBuilder } from "discord.js";
import { BuildCardEmbed } from "../embedBuilder.js";
import { GetCardById, GetCardByName, GetCardListByLanguage } from "../../cards/cardManager.js";
import { SanitizeString } from "../../utils/string.js";
import { uniqueCards } from "../../cards/cardManager.js";

export const data = new SlashCommandBuilder()
    .setName('card')
    .setDescription('Get any tableturf card')
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_name')
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
            .setName('by_id')
            .setDescription('Get a card by id')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The id')
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
    const inputName = interaction.options.getString('name');
    const inputId = interaction.options.getInteger('id');
    const level = interaction.options.getInteger('level') ?? 1;

    var card;
    if (inputName){
        card = GetCardByName(inputName, 'en');
    } else{
        card = GetCardById(inputId, 'en');
    }

    await interaction.reply({ embeds: [BuildCardEmbed(card, level)] });
}