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
app.get("/bookings", async (req, res) => {

    if(req.isAuthenticated()){
        const id = req.user.id;
        const name = req.user.nome;
        const cognome = req.user.cognome;
        const email = req.user.email;
        try {
        const result = await db.query(
            "SELECT * FROM prenotazioni JOIN pacchetti ON prenotazioni.id_pacchetto = pacchetti.id WHERE prenotazioni.id_utente = $1",
            [id]
        );

        if (result.rows.length > 0) {
            res.render("booking.ejs", {tipo: result.rows[0].tipo, name: name, surname: cognome, email: email});
        } else {
            res.status(404).send("prenotazione non trovata");
        }

    } catch (err) {
        console.log(err);
    }
    } else {
        res.redirect("/login");
    }
});


// post register
app.post("/register", async (req, res) => {

    const name = req.body.name;
    const surname = req.body.surname;
    const email = req.body.email;
    const password = req.body.password;
    console.log("name:", name);
    console.log("surname:", surname);
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
                "INSERT INTO utente (nome, cognome, email, password) VALUES ($1, $2, $3, $4)",
                [name, surname, email, hash]
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

// post BOOKINGS
app.post("/bookings", async (req,res) => {
    if (req.isAuthenticated()) {
        const name = req.user.name;
        console.log(name);
        const username = req.user.username;
        console.log(username);
        const email = req.user.email;
        console.log(email);
        const idUtente = req.user.id;
        console.log(idUtente);
        
        try {
            const idPacchetto = req.body.id_pacchetto;
            const dataInizio = req.body.data_inizio;
            const numeroPersone = req.body.numero_persone;


            const pacchetto = await db.query(
                "SELECT durata FROM pacchetti WHERE id = $1",
                [idPacchetto]
            );
            const durata = pacchetto.rows[0].durata;
            const dataFine = addDays(dataInizio, durata);


            const result = await db.query(
                "INSERT INTO prenotazioni (id_utente, id_pacchetto, data_inizio, data_fine, numero_persone, stato) VALUES($1,$2,$3,$4,$5, 'in_transit')",
                [idUtente, idPacchetto, dataInizio, dataFine, numeroPersone]
            );
        } catch (err) {
            console.log(err);
        }


    } else {
        res.redirect("/login");
    } 
});


// route PATCH bookings/:id
app.patch("/bookings/:id", async (req, res) => {
    if(req.isAuthenticated()) {

        const idPrenotazione = req.params.id;
        const id = req.user.id;
        const newData_inizio = req.body.dataInizio;
        const newIdPacchetto = req.body.newIdPacchetto; // convertire nome con id da Front-end
        const newNumeroPersone = req.body.numeroPersone;
        
        try {
            const join = await db.query(
            "SELECT * FROM prenotazioni JOIN pacchetti ON prenotazioni.id_pacchetto = pacchetti.id WHERE prenotazioni.id_utente = $1",
            [id]
        );
        const dataFine = addDays(newData_inizio, join.rows[0].durata);

            const result = await db.query(
            "UPDATE prenotazioni SET id_pacchetto = $1, data_inizio = $2, data_fine = $3, numero_persone = $4 WHERE id = $5 AND id_utente = $6",
            [newIdPacchetto, newData_inizio, dataFine, newNumeroPersone, idPrenotazione, id]
        );

        res.redirect("/pacchetti");
        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/login");
    }
})


app.delete("/bookings/:id", async (req, res) => {
    if(req.isAuthenticated()) {
        try {
            const idPrenotazione = req.params.id;
            const idUtente = req.user.id;
            const result = await db.query(
                "DELETE FROM prenotazioni WHERE id = $1 AND id_utente = $2",
                [idPrenotazione, idUtente]
            )
        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/login");
    }
});



function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


passport.use(new Strategy({ usernameField: "email" },
    async function Verify(email, password, cb){
        console.log("Strategy chiamata con email:", email);
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