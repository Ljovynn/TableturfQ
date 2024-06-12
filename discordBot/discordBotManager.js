import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'path';
import { GetDisputeLogChannel } from './discordBotVariables.js';
import { connect } from 'http2';

dotenv.config();

const token = process.env.TOKEN;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const folderPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(folderPath);

for (const file of commandFolder) {
	//const filePath = path.join(folderPath, file);
    const filePath = `./commands/${file}`;
	let command = await import (filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, readyClient => {
    //const channel = client.channels.cache.get('1219280066316337182');
    //channel.send('content');
	console.log(`Discord bot logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

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
});

export function StartDiscordBot(){
    client.login(token);
}

export async function SendDisputeMessage(match){
	try {
		var channelId = GetDisputeLogChannel();
		if (!channelId) return;
		const channel = await client.channels.fetch(channelId);

		channel.send(`new dispute in match ${match.id}`);
	} catch (error){
		console.log(error);
	}
}