import cron from 'node-cron';
import prismaclient from '../db/index.js';
import { getNextRun } from './cron.js';

export const startScheduler = () => {
  console.log('⏰ Scheduler background worker started...');

  // Runs every 1 minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      // 1. Find all schedules that are due and belong to active zaps
      const dueSchedules = await prismaclient.scheduleTrigger.findMany({
        where: {
          nextRunAt: { lte: now },
          zap: { isActive: true }
        }
      });

      for (const schedule of dueSchedules) {
        await prismaclient.$transaction(async (tx: any) => {
          // 2. Create a ZapRun record
          const zapRun = await tx.zapRun.create({
            data: {
              zapId: schedule.zapId,
              metadata: {
                triggeredAt: now.toISOString(),
                cronExpr: schedule.cronExpr
              }
            }
          });

          // 3. Put into ZapRunOutbox for your Kafka/execution processor to pick up
          await tx.zapRunOutbox.create({
            data: {
              zapRunId: zapRun.id
            }
          });

          // 4. Calculate the NEXT execution time and update the schedule record
          const nextRunAt = getNextRun(schedule.cronExpr);

          await tx.scheduleTrigger.update({
            where: { id: schedule.id },
            data: { nextRunAt }
          });
        });

        console.log(`Successfully triggered scheduled zap: ${schedule.zapId}`);
      }
    } catch (error) {
      console.error("Error running scheduler worker:", error);
    }
  });
};