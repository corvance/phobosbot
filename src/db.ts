import * as sql from 'sqlite3';
import { EventEmitter } from 'events';

export class BotDatabase {
    db: sql.Database;
    initialiser: EventEmitter;

    constructor(dbFilePath: string) {
        this.db = new sql.Database(dbFilePath, (err) => {
            if (err) {
                console.log('Could not connect to DB.');
            }
            else {
                console.log('Connected to DB.');
            }
        });

        this.initialiser = new EventEmitter();
    }

    run(sql: string, params = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.log('Error running sql ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve({ id: this.lastID })
                }
            });
        });
    }

    get(sql: string, params = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        });
    }

    all(sql: string, params = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(rows)
                }
            });
        });
    }
}

export const db: BotDatabase = new BotDatabase('../db.sqlite3');

async function initDatabase(): Promise<void> {
    try {
        // Setup DB.
        await db.run('CREATE TABLE IF NOT EXISTS starredmessages (guild_id TEXT NOT NULL, msg_id TEXT NOT NULL, starboard_msg_id TEXT NOT NULL, PRIMARY KEY(guild_id, msg_id))');
        await db.run('CREATE TABLE IF NOT EXISTS guilds (guild_id TEXT NOT NULL PRIMARY KEY, channel_id TEXT NOT NULL, emoji TEXT NOT NULL, threshold INTEGER NOT NULL)');
    }
    catch (e: any) {
        return Promise.reject('Database setup failed.');
    }
}
initDatabase().then(_ => db.initialiser.emit('complete')).catch(err => {
    console.error(err);
    process.exit()
});
