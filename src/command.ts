import { MessageEmbed } from "discord.js";

export class Command {
    fn: CallableFunction;
    help: MessageEmbed;

    constructor(fn: CallableFunction, help: MessageEmbed) {
        this.fn = fn;
        this.help = help;
    }
}