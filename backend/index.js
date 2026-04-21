import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "bookingProject",
    password: "Salassa?1",
    port: 5432,
});

db.connect();

let print;


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