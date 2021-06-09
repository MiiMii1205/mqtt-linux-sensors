import mqtt from "mqtt";
import LMSensor from "./LMSensor";
import winston from "winston";

export default class MQTTLMSConnector {

    private static readonly SENSOR_TOPIC = "sensor/";

    constructor(private m_lmSensor: LMSensor, private m_url: string, private m_baseTopic: string, private m_username: string, private m_password: string, private m_logger: winston.Logger) {

        let hn =  this.m_lmSensor.hostname

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

        const gpuTemperatureTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}_gpu_temperature`;
        const gpuUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}_gpu_usage`;
        const cpuTemperatureTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}_cpu_temperature`;
        const cpuUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}_cpu_usage`;
        const ramUsageTopic = `${this.m_baseTopic}${MQTTLMSConnector.SENSOR_TOPIC}${hn}_ram_usage`;


        // TODP : Do services

        const deviceInfo = {
            identifiers : `lm_${hn}`,
            name : hn,
            manufacturer : "Linux"
        };

        const lmConfig = {
            name : hn,
            state_topic: `${deviceTopic}/state`,
            availability_topic : `${deviceTopic}/connection`,
            payload_available : "Online",
            unique_id: `lm_${hn}`,
            payload_not_available : "Offline",
            value_template: "{{value_json['state']}}",
            device : deviceInfo
        };

        const gpuTemperatureConfig = {
            name: `${hn} GPU Temperature`,
            state_topic: `${deviceTopic}/state`,
            availability_topic: `${deviceTopic}/connection`,
            payload_available: "Online",
            payload_not_available: "Offline",
            unique_id: `lm_${deviceTopic}_gpu_temperature_sensor`,
            device: deviceInfo,
            value_template: "{{value_json['gpu_temperature']}}",
            device_class: "temperature",
            unit_of_measurement: "°C"
        };

        const gpuUsageConfig = {
            name: `${hn} GPU Usage`,
            state_topic: `${deviceTopic}/state`,
            availability_topic: `${deviceTopic}/connection`,
            payload_available: "Online",
            payload_not_available: "Offline",
            unique_id: `lm_${deviceTopic}_gpu_usage_sensor`,
            icon:"mdi:expansion-card",
            device: deviceInfo,
            value_template: "{{value_json['gpu_usage']}}",
            unit_of_measurement: "%"
        };
        const cpuTemperatureConfig = {
            name: `${hn} CPU Temperature`,
            state_topic: `${deviceTopic}/state`,
            availability_topic: `${deviceTopic}/connection`,
            payload_available: "Online",
            payload_not_available: "Offline",
            unique_id: `lm_${deviceTopic}_cpu_temperature_sensor`,
            device: deviceInfo,
            value_template: "{{value_json['cpu_temperature']}}",
            device_class: "temperature",
            unit_of_measurement: "°C"
        };

        const cpuUsageConfig = {
            name: `${hn} CPU Usage`,
            state_topic: `${deviceTopic}/state`,
            availability_topic: `${deviceTopic}/connection`,
            payload_available: "Online",
            payload_not_available: "Offline",
            unique_id: `lm_${deviceTopic}_cpu_usage_sensor`,
            device: deviceInfo,
            icon:"mdi:cpu-64-bit",
            value_template: "{{value_json['cpu_usage']}}",
            unit_of_measurement: "%"
        };

        const ramUsageConfig = {
            name: `${hn} RAM Usage`,
            state_topic: `${deviceTopic}/state`,
            availability_topic: `${deviceTopic}/connection`,
            payload_available: "Online",
            payload_not_available: "Offline",
            unique_id: `lm_${deviceTopic}_ram_usage_sensor`,
            device: deviceInfo,
            value_template: "{{value_json['ram_usage']}}",
            unit_of_measurement: "%"
        };


        this.m_lmSensor.on("stateChanged", (data) => {
            this.m_logger.info(`state changed received: ${JSON.stringify(data)}`);
            mqttClient.publish(`${deviceTopic}/state`, JSON.stringify(data), {
                qos: 0,
                retain: true
            })
        });

        this.m_logger.info(`mqtt topic ${deviceTopic}`);

        mqttClient.on("connect", () => {

            const id: string | undefined = this.m_lmSensor.hostname;
            lmConfig.name = id;
            lmConfig.device.name = id;


            mqttClient
                .publish(`${deviceTopic}/config`, JSON.stringify(lmConfig), {
                    retain : true,
                    qos : 0
                })

                .publish(`${gpuTemperatureTopic}/config`, JSON.stringify(gpuTemperatureConfig), {
                    retain : true,
                    qos : 0
                })

                .publish(`${gpuUsageTopic}/config`, JSON.stringify(gpuUsageConfig), {
                    retain : true,
                    qos : 0
                })

                .publish(`${cpuTemperatureTopic}/config`, JSON.stringify(cpuTemperatureConfig), {
                    retain : true,
                    qos : 0
                })

                .publish(`${cpuUsageTopic}/config`, JSON.stringify(cpuUsageConfig), {
                    retain : true,
                    qos : 0
                })

                .publish(`${ramUsageTopic}/config`, JSON.stringify(ramUsageConfig), {
                    retain : true,
                    qos : 0
                })


                .publish(`${deviceTopic}/connection`, "Online", {
                    retain : true,
                    qos : 0
                })

            this.m_logger.info("mqtt connected");

        })
            .on("end", () => this.m_logger.info("mqtt ended"))
            .on("error", this.m_logger.error)
            .on("packetsend", (pkg)=> this.m_logger.silly(`Package sent : ${pkg}`, {pkg}) )
            .on("packetreceive", (pkg)=> this.m_logger.silly(`Package received : ${pkg}`, {pkg}) )
            .on("offline", () => this.m_logger.info("mqtt offline"))
            .on("close", () => this.m_logger.info("mqtt close"));

    }

}