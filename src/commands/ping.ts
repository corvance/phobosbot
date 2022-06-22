import { Command } from '../command'
import { Message, MessageEmbed } from "discord.js";
import { BOT_COLOR } from '../common';

module.exports = {
    name: "ping",
    command: new Command(ping, new MessageEmbed({
        color: BOT_COLOR,
        title: 'ping',
        description: 'Responds with ping latency info.'
    }))
}

async function ping(msg: Message, args: string) : Promise<void> {
    msg.channel.send(`Latency is ${msg.createdTimestamp - msg.createdTimestamp}ms!\nAPI Latency is ${Math.round(msg.client.ws.ping)}ms.`);
}