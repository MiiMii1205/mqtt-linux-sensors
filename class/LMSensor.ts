import EventEmitter from "events";
import { hostname } from "os";
import { Duration } from "luxon";
import { exec as execCb } from "child_process";
import * as util from "util";
import { cpu, mem } from "node-os-utils";
import { ILMSStats } from "../interface/ILMSStats";
import parser from "fast-xml-parser";
import type { IGPUStat } from "../interface/IGPUStat";
import assert from "assert";
import type winston from "winston";
import { tools } from "../util/tools";

let exec = util.promisify(execCb);



export default class LMSensor extends EventEmitter {
    private m_hostname: string;
    private m_stats: ILMSStats = {
        id : "",
        state : "Online",
        cpu_usage : 0,
        cpu_temperature : 0,
        gpu_usage : 0,
        gpu_temperature : 0,
        os_lock : false,
        ram_usage : 0
    };

    constructor(poll = 0, private m_logger: winston.Logger) {
        super();
        this.m_hostname = hostname();
        setTimeout(this.readData.bind(this), 5000);

        this.m_stats.id = this.m_hostname;
        this.m_stats.state = "Online";

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
        let [
            gpu, cpuTemperature, ramUsage, isLocked, cpuUsage
        ] = await Promise.all([
            this.getGpuStats(), this.getCpuTemperature(), mem.used().then((u) => {
                let ramUsage: number = Math.round(this.m_stats.ram_usage = (u.usedMemMb / u.totalMemMb) * 100);
                this.m_logger.verbose(`RAM Usage: ${ramUsage}%`);
                return ramUsage;
            }), this.getLockState(), cpu.usage().then((u) => {
                let cpuUsage: number = Math.round(u);
                this.m_logger.verbose(`CPU Usage: ${cpuUsage}%`);
                return cpuUsage;
            })
        ]);

        this.m_stats.cpu_temperature = cpuTemperature;
        this.m_stats.cpu_usage = cpuUsage;
        this.m_stats.gpu_temperature = gpu.temperature;
        this.m_stats.gpu_usage = gpu.usage;
        this.m_stats.ram_usage = ramUsage;
        this.m_stats.state = isLocked ? "Locked" : "Online";

        this.emit("stateChanged", this.currentState);
    }

    private async getCpuTemperature(): Promise<number> {
        let cpuSensors = JSON.parse((await exec("sensors -j")).stdout);
        let ISAKey = Object.keys(cpuSensors).find((k) => /isa/ig.test(k));
        if (ISAKey != null) {
            let sensor: any = cpuSensors[ISAKey];

            let temp: number = Math.round(tools.average(...Object.keys(sensor).filter((k) => /core/ig.test(k)).map((sensorKey) => {
                let sensorValue = sensor[sensorKey];
                let sensorTemperatureKey = Object.keys(sensorValue).find((k) => /_input/ig.test(k));

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
            let b: boolean = (await exec("qdbus org.freedesktop.ScreenSaver /ScreenSaver GetActive")).stdout.toLowerCase() == "true";
            this.m_logger.verbose(b ? "Session is locked" : "Session is unlocked");
            return b;
        } catch (e) {
            this.m_logger.verbose("Session is unlocked");
            return false;
        }
    }

    private async getGpuStats(): Promise<IGPUStat> {
        let json = parser.parse((await exec("nvidia-smi -q -x")).stdout);
        let gpuStats: IGPUStat = {
            usage : parseFloat(json.nvidia_smi_log.gpu.utilization.gpu_util.slice(0, -2)),
            temperature : parseInt(json.nvidia_smi_log.gpu.temperature.gpu_temp.slice(0, -2))
        };
        this.m_logger.verbose(`GPU Usage: ${gpuStats.usage}%`);
        this.m_logger.verbose(`GPU Temp: ${gpuStats.temperature}°C`);
        return gpuStats;
    }

}