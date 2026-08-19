import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy } from "passport-local";



const app = express();
const port = 3000;
const saltRound = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


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

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    }
    })
);

app.use(passport.initialize());
app.use(passport.session());

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

// get route login
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// get route pacchetti 
app.get("/pacchetti", async (req, res) => {
    if (req.isAuthenticated()) {
        const result = await db.query(
            "SELECT * FROM pacchetti"
        )
        const pacchetti = result.rows;
        res.render("pacchetti.ejs", {pacchetto: pacchetti}); // TODO: change this
    } else {
        res.redirect("/login");
    }  
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
    console.log("email:", email);
    console.log("password:", password);

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
            res.render("register.ejs"); // TODO: add a success message
            // when registration completes correctly
            }
        })
    }
    } catch (err) {
        console.log(err);
    }
});

// post route /login
// TODO: implement Passport Google OAuth login
app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login"
}));

app.patch("/booking/:id", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM utente WHERE id = $1",
            [req.params.id]
        );

        // const replacementBooking = {
        //         id: result.id,
        //         id_utente: result.id_utente,
        //         id_disponibilita: result.id_disponibilita,
        //         data_prenotazione: req.body.dataPrenotazione,
        //         data_fine: result.data_fine,
        //         numero_persone: req.body.numeroPersone,
        //         stato: result.stato
        //     }

        if (result.rows.length > 0) {
            const booking = result.rows[0];
            console.log(booking);

            const updates = req.body;
            for (let key in updates) {
                if (booking[key] !== undefined) {
                    booking[key] = updates[key];
                }
            }
        }

    } catch (err) {
        console.log(err);
    }
})

passport.use(new Strategy({ usernameField: "email" },
    async function Verify(email, password, cb){

    try {
      const result = await db.query("SELECT * FROM utente WHERE email = $1",
        [email]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedPassword = user.password;
        console.log(storedPassword);

        bcrypt.compare(password, storedPassword, (err, result) => {
            if (err) {
                return cb(err);
            } else {
                if (result) {
                    return cb(null, user);
                } else {
                    return cb(null, false);
                }
                
            }
        });
    }
    } catch (err) {
        return cb(err);
    }

}));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})