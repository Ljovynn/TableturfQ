import { Client, Collection, Events, EmbedBuilder, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'path';
import { BuildDisputeEmbed } from './embedBuilder.js';

dotenv.config();

const token = process.env.TOKEN;
const disputeChannelId = process.env.DISPUTE_CHANNEL_ID

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

var folderPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(folderPath);
folderPath = path.join(__dirname, 'devCommands');
const devCommandFolder = fs.readdirSync(folderPath);

var previousDisputeMessageId;

for (const file of commandFolder) {
    const filePath = `./commands/${file}`;
	let command = await import (filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

for (const file of devCommandFolder) {
    const filePath = `./devCommands/${file}`;
	let command = await import (filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Discord bot logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()){
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	} else if (interaction.isAutocomplete()){
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});

export function StartDiscordBot(){
    client.login(token);
}

export async function SendDisputeMessage(matchDisputes, sendNewMessage){
	try {
		var channelId = disputeChannelId;
		if (!channelId) return;
		const channel = await client.channels.fetch(channelId);
		if (!channel) return;

		if (!previousDisputeMessageId){
			const message = await channel.send({ embeds: [BuildDisputeEmbed(matchDisputes)] });
			previousDisputeMessageId = message.id;
		} else if (sendNewMessage){
			const previousMessage = await channel.messages.fetch(previousDisputeMessageId);
			if (previousMessage) previousMessage.delete();
			const message = await channel.send({ embeds: [BuildDisputeEmbed(matchDisputes)] });
			previousDisputeMessageId = message.id;
		} else{
			const previousMessage = await channel.messages.fetch(previousDisputeMessageId);
			if (previousMessage) previousMessage.edit({ embeds: [BuildDisputeEmbed(matchDisputes)] });
		}
	} catch (error){
		console.log(error);
	}
}