import { Kafka, type KafkaConfig } from "kafkajs";
import "dotenv/config";

export const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "outbox-processor";
export const TOPIC_NAME = process.env.KAFKA_TOPIC || "zap-events";

const isSsl = process.env.KAFKA_SSL === "true" || !!process.env.KAFKA_USERNAME;

const kafkaConfig: KafkaConfig = {
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKER.split(",").map(b => b.trim()),
  ssl: isSsl,
  sasl: process.env.KAFKA_USERNAME
    ? {
        mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || "plain",
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD || "",
      }
    : undefined,
};

export const kafka = new Kafka(kafkaConfig);

export default kafka;
