import express from "express";
import { client, kafka, TOPIC_NAME } from "@flowify/shared";
import "dotenv/config";

const app = express();
// @ts-ignore
let t;

async function main() {
    const producer = kafka.producer();
    await producer.connect();

    while (1) {
        const pendingrows = await client.zapRunOutbox.findMany({
            where: {},
            take: 10
        }) as any[];
        // @ts-ignore
        if (pendingrows.length === 0) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }

        try {
            // console.log(pendingrows);
            await producer.send({
                topic: TOPIC_NAME,
                messages: pendingrows.map(r => ({ 
                    value: JSON.stringify({ zapId: r.zapRunId, stage: 0 }) 
                }))
            });

            await client.zapRunOutbox.deleteMany({
                where: {
                    id: {
                        in: pendingrows.map(x => x.id)
                    }
                }
            });
        } catch (error) {
            console.log("erorr in ading it to kafka");
        }
    }
    // @ts-ignore
    console.log(t);
}

main();
