import {Router} from "express"
import { authMiddleware } from "../middleware.js";
import { SignupSchema,SigninSchema } from "../types/index.js";
import prismaclient from "../db/index.js" 
import jwt from "jsonwebtoken"
import { JWT_PASSWORD } from "../config.js";
const router = Router();
router.get("/check",(req,res)=>{
    res.send("is that ture")
})
router.post("/signup",async(req,res)=>{
    const body = req.body;
    const parseddata = SignupSchema.safeParse(body);
    console.log(parseddata,req.body.username);
    if(!parseddata.success){
        return res.status(411).json({
            message:"incorrect inputs"
        })
    }
    console.log("reached here")
    const userexist = await prismaclient.user.findFirst({
        where:{
            email:parseddata.data.username
        }
    })
    console.log("reached here")

    if(userexist){
        return res.status(403).json({
            message:"already exist"
        })
    }
    console.log("reached here");
    await prismaclient.user.create({
        data:{
            email:parseddata.data.username,
            password: parseddata.data.password,
            name:parseddata.data.name
        }
    })
    return res.json({
        message:"please verify account by checking your email"
    })

})
router.post("/signin",async(req,res)=>{
    const body = req.body;
    const parseddata = SigninSchema.safeParse(body);
    if(!parseddata.success){
        return res.status(411).json({
            message:"incorrect inputs"
        })
    }
    const user =await prismaclient.user.findFirst({
        where: {
            email:parseddata.data.username,
            password:parseddata.data.password
        }
    })
    if(!user){
        return res.status(400).json({
            message:"sorry credentials are incorrect"
        })
    }
    //sign it with jwt
    console.log(JWT_PASSWORD)
    const token =jwt.sign({
        id:user.id
    },JWT_PASSWORD);
    res.json(token)
})
router.get("/",authMiddleware,async(req,res)=>{
    // @ts-ignore
    const id =req.id;
    const user=await prismaclient.user.findFirst({
        where:{
            id
        },
        select:{
            name:true,
            email:true
        }
    }) 
    return res.json({
        user
    })
})

export const userRouter =router;
