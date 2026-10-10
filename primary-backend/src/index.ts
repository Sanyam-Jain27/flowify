import express from "express"
import cors from "cors"
import { userRouter } from "./router/user.js";
import { zapRouter } from "./router/zap.js";
import { triggerRouter } from "./router/trigger.js";
import { actionRouter } from "./router/action.js";
import { startScheduler } from "./workers/schedule.js";

const app =express();
app.use(express.json());
app.use(cors());


app.use("/api/v1/user",userRouter);
app.use("/api/v1/zap",zapRouter);

app.use("/api/v1/trigger", triggerRouter);
app.use("/api/v1/action", actionRouter);
startScheduler();

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`Primary Backend running on port ${PORT}`);
});