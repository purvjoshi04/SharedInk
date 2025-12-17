import express from "express";
import cors from "cors";
import { router } from "./routes/route";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://web:3000'],
    credentials: true
}));
app.use("/", router)

app.listen(process.env.PORT as string);