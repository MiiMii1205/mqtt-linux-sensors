import { DateTime } from "luxon";
import { LogLevels } from "../enums/LogLevels";
import winston from "winston";
import colors from "colors/safe";
import type { LogLevelStrings } from "../types/mqttlms-typings";

const isProd = process.env.NODE_ENV === "production";

export const tools = {
    isError : winston.format(info => LogLevels[info.level.toLocaleUpperCase() as LogLevelStrings] > LogLevels.WARN ? false : info),

    isNotError : winston.format(info => LogLevels[info.level.toLocaleUpperCase() as LogLevelStrings] <= LogLevels.WARN ? false : info),

    timestampFormat(): string {
        return DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    },

    botFormat : winston.format.printf(({
        level,
        message,
        timestamp
    }) => `[${timestamp}] ${level}: ${message}`),
    botHerokuFormat : winston.format.printf(({
        level,
        message
    }) => `${level}: ${message}`),

    botErrorFormat : winston.format.printf(({
        level,
        message,
        timestamp,
        stack
    }) => {
        if (stack) {
            return `[${timestamp}] ${level}: ${isProd ? stack : (LogLevels[colors.strip(level).toLocaleUpperCase() as LogLevelStrings] === LogLevels.ERROR ? colors.red : colors.yellow)(stack)}`;
        }

        return `[${timestamp}] ${level}: ${message}`;
    }),
    botErrorHerokuFormat : winston.format.printf(({
        level,
        message,
        stack
    }) => {
        if (stack) {
            return `${level}: ${isProd ? stack : (LogLevels[colors.strip(level).toLocaleUpperCase() as LogLevelStrings] === LogLevels.ERROR ? colors.red : colors.yellow)(stack)}`;
        }

        return `${level}: ${message}`;
    }),

    format(template: string, props: Record<string, unknown>): string {
        return template.replace(/%[^\s%]+%/gi, v => `${props[v.slice(1, v.length - 1)]}`);
    },

    average(... nbs: number[]): number {
        return nbs.reduce((a, c) => a += c, 0) / nbs.length;
    },

    randomInt(min: number, max: number): number {
        return (Math.floor(Math.random() * (max - min + 1) + min));
    }
};