import { SlashCommandBuilder } from "discord.js";
import { SetQueAvailible } from "../../queEnabled.js";
import { embedColor } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('setqueenabled')
    .setDescription('Enable or disable matchmaking')
    .addBooleanOption(option =>
		option.setName('enable')
			.setDescription('Set enabled'))

export async function execute(interaction) { 
    const setEnabled = interaction.options.getBoolean('enable');

    SetQueAvailible(setEnabled);

    const embed = {
		color: embedColor,
		title: 'Updated matchmaking abailability',
		fields: [ {
			name: `Que enabled: ${setEnabled}`,
            value: '\u200B',
		},],
	};

    await interaction.reply({ embeds: [embed] });
}