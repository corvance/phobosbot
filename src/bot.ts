import { config } from 'dotenv'; config();
import { Client, Intents, MessageEmbed } from 'discord.js';
import * as fs from 'fs';
import { Command } from './command';
import { BOT_COLOR } from './common';

export const client: Client = new Client(
    {
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES]
    }
);

client.on('ready', async e => {
    console.log(`SungBot connected!`);
});

client.login(process.env.SUNGBOT_TOKEN).catch(err => {
    console.error(err);
    process.exit()
});

// Facilitate uptime monitors.
import { createServer, IncomingMessage, ServerResponse } from 'http';
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200);
    res.end('ok');
});
server.listen(3000);

// Fill a commands object with commands accessible
// by key via their command name/prefix.
let commands: Map<string, Command | undefined> = new Map<string, Command>();

// Populate commands map.
const jsFiles: string[] = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
jsFiles.forEach(commandFile => {
    const commandModule = require(`./commands/${commandFile}`);
    if (commandModule.name && commandModule.command)
        commands.set(commandModule.name, commandModule.command);
});

let helpEmbed: MessageEmbed = new MessageEmbed({
    color: BOT_COLOR,
    title: 'PhobosBot- A TWRP-themed starboard bot for the Ladyworld Discord server.',
    description: 'Use p/help [command] for more detailed help. Note that this is a starboard bot and so has few actual commands.\n',
    fields: [{ name: 'Commands', value: '`' + Array.from(commands.keys()).join('`\n`') + '`', inline: false }]
});


client.on('messageReactionAdd',
    async function (msg) {

    });

// React to messages.
client.on('messageCreate',
    async function (msg) {
        const prefixedCommand: string = msg.content.split(' ')[0];
        let commandName: string = prefixedCommand.toLowerCase().split('p/')[1];

        // If this is a testing instance
        if (client.user && client.user.username.endsWith('-Testing'))
            commandName = prefixedCommand.toLowerCase().split('p/')[1];

        // Everything following the first space.
        let args: string = msg.content.split(/ (.*)/s)[1];
        args = (args === undefined) ? '' : args;

        if (commandName === 'help') {
            // No argument - main help.
            if (!args) {
                msg.channel.send({ embeds: [helpEmbed] });
            }
            else {
                const command: Command | undefined = commands.get(args);
                if (command)
                    msg.channel.send({ embeds: [command.help] });
            }

            return;
        }

        const command: Command | undefined = commands.get(commandName);

        // Filter out invalid commands and bot senders.
        if (command && !msg.author.bot) {
            try {
                await command.fn(msg, args);
            }
            catch (errEmbed) {
                if (errEmbed instanceof MessageEmbed)
                    msg.channel.send({ embeds: [errEmbed] });
            }
        }
    });