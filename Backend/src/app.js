const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:4173",
];

const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials : true
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./Routes/auth.routes");
const aiRouter = require("./Routes/ai.routes");

app.use("/api/auth" , authRouter);
app.use("/api/ai" , aiRouter);

module.exports = app;
