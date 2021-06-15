import EventEmitter from "events";
import { hostname } from "os";
import { Duration } from "luxon";
import { exec as execCb } from "child_process";
import * as util from "util";
import parser from "fast-xml-parser";
import assert from "assert";
import { cpu, mem } from "node-os-utils";
import type { ILMSStats } from "../interface/ILMSStats";
import type { IGPUStat } from "../interface/IGPUStat";
import type winston from "winston";
import { tools } from "../util/tools";
import { LMSwitchPositions } from "../enums/LMSwitchPositions";
import { LMPCStates } from "../enums/LMPCStates";

const exec = util.promisify(execCb);

export default class LMSensor extends EventEmitter {

    private readonly m_hostname: string;
    private m_stats: ILMSStats = {
        webcamState : LMSwitchPositions.OFF, // eslint-disable-next-line @typescript-eslint/naming-convention
        micState : LMSwitchPositions.OFF,
        id : "",
        state : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
        cpu_usage : 0, // eslint-disable-next-line @typescript-eslint/naming-convention
        cpu_temperature : 0, // eslint-disable-next-line @typescript-eslint/naming-convention
        gpu_usage : 0, // eslint-disable-next-line @typescript-eslint/naming-convention
        gpu_temperature : 0, // eslint-disable-next-line @typescript-eslint/naming-convention
        os_lock : false, // eslint-disable-next-line @typescript-eslint/naming-convention
        ram_usage : 0
    };

    constructor(private readonly m_logger: winston.Logger, poll = 0) {
        super();
        this.m_hostname = hostname();
        setTimeout(this.readData.bind(this), 5000);

        this.m_stats.id = this.m_hostname;
        this.m_stats.state = LMPCStates.ONLINE;

        const interval = Duration.fromObject({ minutes : ((poll > 0) ? poll : tools.randomInt(2, 5)) }).toMillis();

        setInterval(this.readData.bind(this), interval);
    }

    public get hostname(): string {
        return this.m_hostname;
    }

    public get currentState(): ILMSStats {
        return this.m_stats;
    }

    private async readData(): Promise<void> {
        const [gpu, cpuTemperature, ramUsage, isLocked, cpuUsage, micState, webcamState] = await Promise.all([
            this.getGpuStats(),
            this.getCpuTemperature(),
            mem.used().then((u) => {
                const ramUsage: number = Math.round(this.m_stats.ram_usage = (u.usedMemMb / u.totalMemMb) * 100);
                this.m_logger.verbose(`RAM Usage: ${ramUsage}%`);
                return ramUsage;
            }),
            this.getLockState(),
            cpu.usage().then((u) => {
                const cpuUsage: number = Math.round(u);
                this.m_logger.verbose(`CPU Usage: ${cpuUsage}%`);
                return cpuUsage;
            }),
            this.getMicState(),
            this.getWebcamState()
        ]);

        this.m_stats.cpu_temperature = cpuTemperature;
        this.m_stats.cpu_usage = cpuUsage;
        this.m_stats.gpu_temperature = gpu.temperature;
        this.m_stats.gpu_usage = gpu.usage;
        this.m_stats.ram_usage = ramUsage;
        this.m_stats.state = isLocked ? LMPCStates.LOCKED : LMPCStates.ONLINE;
        this.m_stats.micState = micState ? LMSwitchPositions.ON : LMSwitchPositions.OFF;
        this.m_stats.webcamState = webcamState ? LMSwitchPositions.ON : LMSwitchPositions.OFF;

        this.emit("stateChanged", this.currentState);
    }

    private async getMicState(): Promise<boolean> {
        const deviceName = (await exec("pacmd info | grep \"Default source\" | cut -f4 -d\" \"")).stdout.trim();
        this.m_logger.verbose(`Found audio source ${deviceName}`);
        const sourceStatus = (await exec(`pacmd list sources | grep -A 10 ${deviceName} | grep "state" | cut -f2 -d" "`)).stdout.trim();

        switch (sourceStatus) {
            case "IDLE":
            case "SUSPENDED":
                this.m_logger.verbose(`${deviceName} is inactive`);
                return false;
            case "RUNNING":
                this.m_logger.verbose(`${deviceName} is recording`);
                return true;
            default:
                throw new Error(`${deviceName} has an unknown state : "${sourceStatus}"`);
        }
    }
    private async getWebcamState(): Promise<boolean> {
        const state = parseInt((await exec("lsmod | grep \"uvcvideo\\s\" | sed -E s/\\ +/\\ /g | cut -f3 -d\" \"")).stdout.trim()) === 1;
        this.m_logger.verbose(`Webcam is ${state ? LMSwitchPositions.ON : LMSwitchPositions.OFF}`);
        return state;
    }

    private async getCpuTemperature(): Promise<number> {
        const cpuSensors = JSON.parse((await exec("sensors -j")).stdout);
        const isaKey = Object.keys(cpuSensors).find(k => /isa/ig.test(k));
        if (isaKey != null) {
            const sensor = cpuSensors[isaKey];

            const temp: number = Math.round(tools.average(... Object.keys(sensor).filter(k => /core/ig.test(k)).map((sensorKey) => {
                const sensorValue = sensor[sensorKey];
                const sensorTemperatureKey = Object.keys(sensorValue).find(k => /_input/ig.test(k));

                assert(sensorTemperatureKey != null, "Invalid CPU sensor value");

                return sensorValue[sensorTemperatureKey];
            })));

            this.m_logger.verbose(`Average CPU Temp: ${temp}°C`);
            return temp;
        }

        return 0;
    }

    private async getLockState(): Promise<boolean> {
        try {
            const nbOfUser: number = parseInt((await exec("who -q")).stdout.trim().split("\n").pop()?.split(":")?.pop()?.trim() ?? "0");
            this.m_logger.verbose(`${nbOfUser} user(s) connected`);
            const isLocked = nbOfUser <= 0;
            this.m_logger.verbose(isLocked ? "Session is locked" : "Session is unlocked");
            return isLocked;
        } catch (e) {
            this.m_logger.error(e);
            this.m_logger.verbose("Session is unlocked");
            return false;
        }
    }

    private async getGpuStats(): Promise<IGPUStat> {
        const json = parser.parse((await exec("nvidia-smi -q -x")).stdout);
        const gpuStats: IGPUStat = {
            usage : parseFloat(json.nvidia_smi_log.gpu.utilization.gpu_util.slice(0, -2)),
            temperature : parseInt(json.nvidia_smi_log.gpu.temperature.gpu_temp.slice(0, -2))
        };
        this.m_logger.verbose(`GPU Usage: ${gpuStats.usage}%`);
        this.m_logger.verbose(`GPU Temp: ${gpuStats.temperature}°C`);
        return gpuStats;
    }

}