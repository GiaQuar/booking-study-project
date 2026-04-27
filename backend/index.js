import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";


const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// DB credentials
dotenv.config();
const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

db.connect();

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("../frontend/public"));

// get route homepage
app.get("/", async (req, res) => {
    // print hello world form DB
    const result = await db.query("SELECT message FROM messages WHERE id=1");
    const helloWorld = result.rows[0].message;
    res.render("index.ejs", {messages: helloWorld});
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})