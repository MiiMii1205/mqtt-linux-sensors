import type { LMSwitchPositions } from "../enums/LMSwitchPositions";
import type { LMPCStates } from "../enums/LMPCStates";
import type { ILMNotification } from "./ILMNotification";

export interface ILMSStats {
    id: string;
    state: LMPCStates;
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
    micState: LMSwitchPositions;
    webcamState: LMSwitchPositions;
    notification: ILMNotification;
}