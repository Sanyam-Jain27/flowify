import {Router} from "express"
import { authMiddleware } from "../middleware.js";
import { ZapCreateSchema } from "../types/index.js";
import prismaclient from "../db/index.js";

const router =Router();
router.post("/available",async(req,res)=>{
const available= await prismaclient.availableAction.findMany(
        {}
    )
    if(!available){
        console.log("no available actions you have")
        return res.status(419).json(
            {message:"no available actions you have"}
        )
    }
    return res.json(
        available
    )
})
export const actionRouter = router;