import { Client, GuildEmoji, MessageEmbed } from "discord.js";

export const BOT_COLOR: number = 0xf30a2d;
export const ERROR_EMBED: MessageEmbed = new MessageEmbed({
    color: BOT_COLOR,
    title: 'Action Failed',
    description: '❌ Error!'
});

export function getEmoji(client: Client, emojiNameID: string) : GuildEmoji | string {
    let emoji: GuildEmoji | undefined = client.emojis.cache.get(emojiNameID);
    return (emoji) ? emoji : emojiNameID;
}

export function setTimeoutSeconds(callback: Function, seconds: number) : void {
    // 1000 ms in a second.
    let msInSecond = 1000;

    let secondCount = 0;
    let timer = setInterval(function() {
        secondCount++;  // A second has passed.

        if (secondCount === seconds) {
           clearInterval(timer);
           // @ts-ignore
           callback.apply(this, []);
        }
    }, msInSecond);
}

export function dateToUNIXTimestamp(date: Date) : string {
    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}
