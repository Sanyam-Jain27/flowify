import { kafka, TOPIC_NAME } from "./lib/kafka.js";
import { client } from "./lib/prisma.js";
import { shouldRun } from "./lib/triggerFileter.js";
import { executeActionStep } from "./dispatcher.js";

export async function startWorker() {
    const consumer = kafka.consumer({
        groupId: "flowify-worker-dev-v2",
    });

    await consumer.connect();

    await consumer.subscribe({
        topic: TOPIC_NAME,
        fromBeginning: false,
    });

    console.log("Worker connected. Waiting for new events...");

    const producer = kafka.producer();
    await producer.connect();

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            if (!message.value?.toString()) {
                return;
            }

            try {
                const parsedValue = JSON.parse(message.value.toString());
                const zapRunId = parsedValue.zapRunId ?? parsedValue.zapId;
                const stage = parsedValue.stage ?? 0;
                console.log("Received Kafka message:", parsedValue, {
                    zapRunId,
                    stage,
                });

                const zapRunDetails = await client.zapRun.findFirst({
                    where: { id: zapRunId },
                    include: {
                        zap: {
                            include: {
                                trigger: { include: { type: true } },
                                actions: { include: { type: true } }
                            }
                        }
                    }
                });

                if (!zapRunDetails) {
                    console.log(`ZapRun ${zapRunId} not found in database. Skipping.`);
                    await consumer.commitOffsets([{
                        topic,
                        partition,
                        offset: (BigInt(message.offset) + 1n).toString(),
                    }]);
                    return;
                }

                // @ts-ignore
                const currentAction = zapRunDetails?.zap.actions.find(x => x.sortingorder === stage);
                const triggerTypename = zapRunDetails?.zap?.trigger?.type?.name;

                if (!currentAction) {
                    console.log("Current action not found");
                    await consumer.commitOffsets([{
                        topic,
                        partition,
                        offset: (BigInt(message.offset) + 1n).toString(),
                    }]);
                    return;
                }

                const check = shouldRun(triggerTypename, zapRunDetails);
                if (!check.ok) {
                    console.log(`Flow stopped: ${check.reason}`);
                    await consumer.commitOffsets([{
                        topic,
                        partition,
                        offset: (BigInt(message.offset) + 1n).toString(),
                    }]);
                    return;
                }

                console.log(`Processing Trigger: ${triggerTypename} | Action: ${currentAction.type.id}`);

                await executeActionStep(currentAction, triggerTypename, zapRunDetails);

                await new Promise(r => setTimeout(r, 500));

                const laststage = (zapRunDetails?.zap.actions?.length || 1) - 1;
                if (stage < laststage) {
                    await producer.send({
                        topic: TOPIC_NAME,
                        messages: [{
                            value: JSON.stringify({
                                stage: stage + 1,
                                zapRunId
                            })
                        }]
                    });
                }

                console.log("Process done for stage", stage);

                await consumer.commitOffsets([{
                    topic,
                    partition,
                    offset: (BigInt(message.offset) + 1n).toString(),
                }]);
            } catch (error) {
                console.error("Worker error processing message:", error);
                // Commit offset on failure to avoid infinite crash loops on poison messages
                await consumer.commitOffsets([{
                    topic,
                    partition,
                    offset: (BigInt(message.offset) + 1n).toString(),
                }]);
            }
        }
    });
}

startWorker();