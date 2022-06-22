import { config } from 'dotenv'; config();
import { Client, Intents, Message, MessageEmbed, PartialMessage } from 'discord.js';
import * as fs from 'fs';
import { db } from './db';
import { Command } from './command';
import { BOT_COLOR, dateToUNIXTimestamp, getEmoji } from './common';

export const client: Client = new Client(
    {
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES],
        partials: ['USER', 'REACTION', 'MESSAGE']
    }
);

client.on('ready', async e => {
    console.log(`PhobosBot connected!`);
});

db.initialiser.on('complete', async _ => {
    client.login(process.env.PHOBOSBOT_TOKEN).catch(err => {
        console.error(err);
        process.exit()
    });
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

// React to messages.
client.on('messageCreate',
    async function (msg) {
        const prefixedCommand: string = msg.content.split(' ')[0];
        let commandName: string = prefixedCommand.toLowerCase().split('p/')[1];

        // If this is a testing instance
        if (client.user && client.user.username.endsWith('-Testing'))
            commandName = prefixedCommand.toLowerCase().split('pt/')[1];

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

client.on('messageReactionAdd',
    async function (reaction, user) {
        let reactionId: string;
        let channelId: string;
        let threshold: number;

        // May be a PartialMessage, so fetch it to get the missing data.
        const msg: Message | void = await reaction.message.fetch().catch(_ => { return; });
        if (!msg) return;

        try {
            let guild = await db.get(`SELECT channel_id, emoji, threshold FROM guilds WHERE guild_id = ${msg.guildId}`);
            reactionId = guild.emoji;
            channelId = guild.channel_id;
            threshold = guild.threshold;
        }
        catch {
            console.log('Failed to load configuration from database.');
            return;
        }

        if (reaction.emoji.name !== reactionId || !msg.guild || msg.author.id === user.id) return;

        const starboardChannel = msg.guild.channels.cache.get(channelId);
        if (!starboardChannel || !starboardChannel.isText()) return;

        let res = msg.reactions.cache.get(reactionId);
        if (!res) return;

        let numStars = res.count;

        if (numStars >= threshold && msg.channel.isText() && msg.channel.type !== 'DM') {
            let author: string = `${msg.author.username}  •  #${msg.channel.name}`;
            let footer = `${getEmoji(client, reactionId)} ${numStars}  •  ${msg.id}  •  `
                + `${msg.createdAt.toISOString().replace(/-/g, '-').replace(/T/g, ' ').slice(0, 16)}`;

            // Message may have already made starboard.
            let starredMsg = await db.get(`SELECT starboard_msg_id FROM starredmessages WHERE guild_id = ${msg.guildId} AND msg_id = ${msg.id}`)
                                    .catch(_ => { return; });
            if (starredMsg) {
                let starboardEmbedMsg = starboardChannel.messages.cache.get(starredMsg.starboard_msg_id);
                if (starboardEmbedMsg) {
                    let embeds = starboardEmbedMsg.embeds;
                    embeds[0].footer = { text: footer };
                    starboardEmbedMsg.edit({ embeds: embeds });
                    return;
                }
            }

            let starboardMessage;
            // Message isn't already on starboard, so add it.
            if (msg.attachments.size === 0) {
                let starboardEmbed: MessageEmbed = new MessageEmbed({
                    author: { name: author, iconURL: `${msg.author.avatarURL()}` },
                    title: 'Jump!',
                    url: msg.url,
                    description: `${msg.content}`,
                    color: BOT_COLOR,
                    footer: { text: footer }
                });

                starboardMessage = await starboardChannel.send({ embeds: [starboardEmbed] }).catch();
            }
            else {
                // Desktop client aggregates embeds with the same URL, allowing multiple images in one embed.
                // Mobile discards all but the first, which would happen anyway.
                let embeds: MessageEmbed[] = [];

                msg.attachments.forEach(attachment => {
                    embeds.push(new MessageEmbed({
                        author: { name: author, iconURL: `${msg.author.avatarURL()}` },
                        title: 'Jump!',
                        url: msg.url,
                        description: `${msg.content}`,
                        image: { url: attachment.url },
                        color: BOT_COLOR,
                        footer: { text: footer }
                    }));
                });

                starboardMessage = await starboardChannel.send({ embeds: embeds }).catch();
            }

            await db.run(`INSERT INTO starredmessages VALUES (${msg.guildId}, ${msg.id}, ${starboardMessage.id})`).catch();
        }
    });
