import mqtt from "mqtt";
import type LMSensor from "./LMSensor";
import type winston from "winston";
import { LMPCStates } from "../enums/LMPCStates";
import { LMSwitchPositions } from "../enums/LMSwitchPositions";

export default class MQTTLMSConnector {

    private static readonly SENSOR_TOPIC = "sensor/";

    constructor(private readonly m_lmSensor: LMSensor, private readonly m_url: string, private readonly m_baseTopic: string, private readonly m_logger: winston.Logger, private readonly m_username: string | undefined, private readonly m_password: string | undefined) {
        const hn = this.m_lmSensor.hostname;

        const mqttClient = mqtt.connect(this.m_url, {
            will : {
                topic : `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}/connection`,
                payload : "Offline",
                qos : 0,
                retain : true
            },
            username : this.m_username,
            password : this.m_password
        });

        const deviceTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}`;

        const gpuTemperatureTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_gpu_temperature`;
        const gpuUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_gpu_usage`;
        const cpuTemperatureTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_cpu_temperature`;
        const cpuUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_cpu_usage`;
        const ramUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_ram_usage`;
        const micTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_mic`;
        const webcamTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}lm_${hn}_webcam`;

        const deviceInfo = {
            identifiers : `lm_${hn}`,
            name : hn,
            manufacturer : "Linux"
        };

        const lmConfig = {
            name : hn, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['state']}}",
            device : deviceInfo
        };

        const gpuTemperatureConfig = {
            name : `${hn} GPU Temperature`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_gpu_temperature_sensor`,
            device : deviceInfo, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['gpu_temperature']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            device_class : "temperature", // eslint-disable-next-line @typescript-eslint/naming-convention
            unit_of_measurement : "°C"
        };

        const gpuUsageConfig = {
            name : `${hn} GPU Usage`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_gpu_usage_sensor`,
            icon : "mdi:expansion-card",
            device : deviceInfo, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['gpu_usage']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            unit_of_measurement : "%"
        };
        const cpuTemperatureConfig = {
            name : `${hn} CPU Temperature`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_cpu_temperature_sensor`,
            device : deviceInfo, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['cpu_temperature']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            device_class : "temperature", // eslint-disable-next-line @typescript-eslint/naming-convention
            unit_of_measurement : "°C"
        };

        const cpuUsageConfig = {
            name : `${hn} CPU Usage`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_cpu_usage_sensor`,
            device : deviceInfo,
            icon : "mdi:cpu-64-bit", // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['cpu_usage']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            unit_of_measurement : "%"
        };

        const micConfig = {
            name : `${hn} Microphone`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_mic`, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['micState']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            device : deviceInfo
        };

        const webcamConfig = {
            name : `${hn} Webcam`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${hn}_webcam`, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['webcamState']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            device : deviceInfo
        };

        const ramUsageConfig = {
            name : `${hn} RAM Usage`, // eslint-disable-next-line @typescript-eslint/naming-convention
            state_topic : `${deviceTopic}/state`, // eslint-disable-next-line @typescript-eslint/naming-convention
            availability_topic : `${deviceTopic}/connection`, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_available : LMPCStates.ONLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            payload_not_available : LMPCStates.OFFLINE, // eslint-disable-next-line @typescript-eslint/naming-convention
            unique_id : `lm_${deviceTopic}_ram_usage_sensor`,
            device : deviceInfo, // eslint-disable-next-line @typescript-eslint/naming-convention
            value_template : "{{value_json['ram_usage']}}", // eslint-disable-next-line @typescript-eslint/naming-convention
            unit_of_measurement : "%"
        };

        this.m_lmSensor.on("stateChanged", (data) => {
            this.m_logger.info(`state changed received: ${JSON.stringify(data)}`);
            mqttClient.publish(`${deviceTopic}/state`, JSON.stringify(data), {
                qos : 0,
                retain : true
            });
        });

        this.m_logger.info(`mqtt topic ${deviceTopic}`);

        mqttClient.on("connect", () => {
            const id: string | undefined = this.m_lmSensor.hostname;
            lmConfig.name = id;
            lmConfig.device.name = id;

            mqttClient.publish(`${deviceTopic}/config`, JSON.stringify(lmConfig), {
                retain : true,
                qos : 0
            }).publish(`${gpuTemperatureTopic}/config`, JSON.stringify(gpuTemperatureConfig), {
                retain : true,
                qos : 0
            }).publish(`${gpuUsageTopic}/config`, JSON.stringify(gpuUsageConfig), {
                retain : true,
                qos : 0
            }).publish(`${cpuTemperatureTopic}/config`, JSON.stringify(cpuTemperatureConfig), {
                retain : true,
                qos : 0
            }).publish(`${cpuUsageTopic}/config`, JSON.stringify(cpuUsageConfig), {
                retain : true,
                qos : 0
            }).publish(`${ramUsageTopic}/config`, JSON.stringify(ramUsageConfig), {
                retain : true,
                qos : 0
            }).publish(`${micTopic}/config`, JSON.stringify(micConfig), {
                retain : true,
                qos : 0
            }).publish(`${webcamTopic}/config`, JSON.stringify(webcamConfig), {
                retain : true,
                qos : 0
            }).publish(`${deviceTopic}/connection`, LMPCStates.ONLINE, {
                retain : true,
                qos : 0
            });

            this.m_logger.info("mqtt connected");
        }).on("end", () => this.m_logger.info("mqtt ended")).on("error", this.m_logger.error).on("packetsend", pkg => this.m_logger.silly(`Package sent : ${pkg.messageId}`, { pkg })).on("packetreceive", pkg => this.m_logger.silly(`Package received : ${pkg.messageId}`, { pkg })).on("offline", () => this.m_logger.info("mqtt offline")).on("close", () => this.m_logger.info("mqtt close"));
    }

}