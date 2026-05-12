import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt, { hash } from "bcrypt";


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
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(express.static("../frontend/public"));

// get route homepage
app.get("/", async (req, res) => {
    // print hello world form DB
    const result = await db.query("SELECT message FROM messages WHERE id=1");
    const helloWorld = result.rows[0].message;
    res.render("index.ejs", {messages: helloWorld});
});

// get route register
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// get route pacchetti 
app.get("/pacchetti", (req, res) => {
    res.render("pacchetti.ejs"); // DA MODIFICARE
});

// get route bookings:id 
app.get("/booking/:id", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM utente WHERE id = $1",
            [req.params.id]
        );

        if (result.rows.length > 0) {
            res.render("booking.ejs", {name: result.rows[0].nome})
        } else {
            res.status(404).send("prenotazione non trovata");
        }

    } catch (err) {
        console.log(err);
    }
});


// post register
app.post("/register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const checkResult = await db.query("SELECT * FROM utente WHERE email = $1",
            [email]
        );

        if (checkResult.rows.length > 0) {
            res.send("Email alredy exist. Try loggin in.");
        } else {
            // Password Hashing
          bcrypt.hash(password, saltRound, async(err, hash) => {
            if (err) {
            console.log("Error hashing password:", err);
            } else {
            await db.query(
                "INSERT INTO utente (email, password) VALUES ($1, $2)",
                [email, hash]
            );
            res.render("register.ejs");
            }
        })
    }
    } catch (err) {
        console.log(err);
    }
});

// post route /login
app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
      const result = await db.query("SELECT * FROM utente WHERE email = $1",
        [email]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(user);
        const storedPassword = user.password;

        if (password === storedPassword) {
            res.render("index.ejs"); // DA CAMBIARE!!!
        } else {
            res.render("register.ejs");  // DA CAMBIARE!!!
        }
      }
    } catch (err) {
        console.log(err);
    }
})


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})