import Discord from "discord.js";
import { Pool } from "pg";

import { Level } from "../Models/Level";


export class DB {
    private static readonly pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });

    public static async createSchema() {
        const client = await DB.pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS Levels (
                userID text,
                guildID text,
                level text not null,
                PRIMARY KEY (userID, guildID)
            );
        `);
    }

    readonly level = {
        add: (level: Level) => {
            DB.pool.query(`
                INSERT INTO Levels (userID, guildID, level)
                VALUES ($1::text, $2::text, $3::text)
                ON CONFLICT (userID, guildID)
                    DO UPDATE SET level = Levels.level + EXCLUDED.level;`,
                [level.userID, level.guildID, level.level]
            );
        },

        get: async (guildID: Discord.Snowflake, userID: Discord.Snowflake) => {
            DB.pool.query(`
                SELECT level
                FROM Levels
                WHERE userID = $1::text
                  AND guildID = $2::text`,
                [userID, guildID]
            );
        },
    };
}