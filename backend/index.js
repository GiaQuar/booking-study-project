import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";



// Inizialate Express application
const app = express();
const port = 3000;

// Resolve current file and directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure EJS as the templete engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// PostgreSQL client configuration
dotenv.config();
const db = new pg.Client({
    user: precess.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Connect to the database 
db.connect();

// Parse incoming form data
app.use(bodyParser.urlencoded({extended: true}));

// Serve static files from the frontend public folder
app.use(express.static("../frontend/public"));

// Home route - render main page
app.get("/", async (req, res) => {
    res.render("index.ejs")
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})