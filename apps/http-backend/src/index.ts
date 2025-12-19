import express from "express";
import cors from "cors";
import { router } from "./routes/route";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
const port = Number(process.env.PORT) || 3001;

app.listen(port, "0.0.0.0", () => {
    console.log(`HTTP Backend running on port ${port}`);
    console.log(`   → Accessible from host: http://localhost:${port}`);
});
app.use("/", router)

app.listen(process.env.PORT as string);