export interface ILMSStats {
    id: string;
    state: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    cpu_usage: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    cpu_temperature: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    os_lock: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ram_usage: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gpu_usage: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gpu_temperature: number;
}