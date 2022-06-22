# SungBot

PhobosBot is a TWRP-themed starboard bot created for the [Ladyworld Discord server](https://discord.gg/NZGZJ2C), originally to replace existing 3rd party bots that began working with NFTs, cryptocurrency and other blockchain technology. TWRP is a Canadian band most recongisable for their costumed personas, concealing their real identities. You should check them out!

## Features

- Starboard message posting.

## Roadmap

- Leaderboard of stars received, stars given and top starred posts.

## Usage

To run the bot, install the dependencies, compile the TypeScript to JavaScript with `tsc`, enter the `dist` directory and run `node bot.js` with the environment PHOBOSBOT_TOKEN set to your bot token.

```bash
git clone https://www.github.com/corvance/sungbot
cd sungbot

npm i --save-dev typescript dotenv discord.js

export PHOBOSBOT_TOKEN=1234567890_abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ_12345
npm run compile && npm run start
```

You can run a testing instance of the bot using a Discord application bot with a username ending in '-Testing', changing the prefix from s/ to st/.

## Dependencies

- `discord.js` - The Discord bot development library.
- `dotenv` - For loading the bot token from .env files in local development.

## License

This repository is subject to the terms of the MIT License, available at the LICENSE file in the root directory.
