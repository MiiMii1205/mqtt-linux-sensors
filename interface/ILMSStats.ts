export interface ILMSStats {
    id: string
    state: string
    cpu_usage: number
    cpu_temperature: number
    os_lock: boolean
    ram_usage: number
    gpu_usage: number
    gpu_temperature: number
}