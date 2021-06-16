#!/usr/bin/env ts-node

import yargs from "yargs";
import readlineSync from "readline-sync";
import MQTTLMSConnector from "./class/MQTTLMSConnector";
import LMSensor from "./class/LMSensor";
import winston from "winston";
import WinstonJournald from "winston-journald3";
import { tools } from "./util/tools";
import assert from "assert";

const journald = new WinstonJournald({ identifier : "mqttlms" });
const transports: winston.transport[] = [journald];

if (process.env.NODE_ENV !== "production") {
    transports.push(new winston.transports.Console({
        consoleWarnLevels : ["warn"],
        stderrLevels : ["error"],
        level : "warn",
        handleExceptions : true,
        format : winston.format.combine(tools.isError(), winston.format.colorize({ all : true }), winston.format.timestamp({
            format : "M/D/YYYY HH:mm:ss.SS ZZ A"
        }), tools.botErrorFormat)
    }));

    transports.push(new winston.transports.File({
        filename : "logs.log",
        level : "error",
        handleExceptions : true,
        format : winston.format.combine(tools.isError(), winston.format.colorize({ all : true }), winston.format.timestamp({
            format : "M/D/YYYY HH:mm:ss.SS ZZ A"
        }), tools.botErrorFormat)
    }));

    transports.push(new winston.transports.Console({
        level : "debug",
        handleExceptions : true,
        format : winston.format.combine(tools.isNotError(), winston.format.colorize({
            message : false,
            level : true
        }), winston.format.timestamp({
            format : "M/D/YYYY HH:mm:ss.SS ZZ A"
        }), tools.botFormat)
    }));
}

const logger = winston.createLogger({
    level : "info",
    format : winston.format.errors({ stack : true }),
    defaultMeta : { service : "mqttlms-service" },
    transports
});

const args = yargs.usage("Usage: $0 -url [mqtt|ws][s]://yourbroker.example.com").example("$0 --url [broker_url]", "Start the sensors, publish to MQTT").options({
    d : {
        alias : "debug",
        describe : "Enable debug logging",
        type : "boolean"
    },
    a : {
        alias : "url",
        describe : "MQTT broker URL",
        type : "string"
    },
    topic : {
        alias : "base-topic",
        describe : "Base topic for MQTT",
        default : "homeassistant",
        type : "string"
    },
    p : {
        alias : "password",
        describe : "Password for MQTT (if not specified as an argument, will prompt for password at startup)",
        type : "string"
    },
    u : {
        alias : "username",
        describe : "Username for MQTT",
        type : "string"
    },
    i : {
        alias : "interval",
        describe : "Minutes interval for device polling (default is random 10 to 20)",
        type : "number",
        default : 0
    }
}).wrap(yargs.terminalWidth()).env("MQTT_LM_");

Promise.resolve(args.argv).then((r) => {
    let mqttPassword = r.p;
    const mqttUrl = r.a;
    const mqttUsername = r.u;
    const poll = r.i;

    if (r.d) {
        logger.level = "debug";
    }

    assert(mqttUrl != null, new Error("No MQTT broker address was provided"));

    if (mqttPassword == null) {
        mqttPassword = readlineSync.question("MQTT Password: ", {
            hideEchoBack : true,
            mask : ""
        });
    }

    let baseTopic = r.topic;
    if (!baseTopic.endsWith("/")) {
        baseTopic = `${baseTopic}/`;
    }

    const sensor = new LMSensor(logger, poll);
    new MQTTLMSConnector(sensor, mqttUrl, baseTopic, logger, mqttUsername, mqttPassword);
}).catch(logger.error);

