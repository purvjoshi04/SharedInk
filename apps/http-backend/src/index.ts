import express from "express";
import cors from "cors";
import { router } from "./routes/route";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true
}));
app.use("/", router)

app.listen(process.env.PORT);