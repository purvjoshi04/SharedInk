import { Router, type Router as RouterType } from "express";
import { userMiddleware } from "../middleware/middleware";

export const router: RouterType = Router();

router.post("/signup", (req, res) => {
    const {email, password} =req.body;


});


router.post("/signin", (req, res) => {

})

router.post("/room", userMiddleware, (req, res) => {
    
})