// schema of the database

CREATE TABLE UTENTE (
id SERIAL,
nome VARCHAR(40),
cognome VARCHAR(40),
email CITEXT UNIQUE,
Password TEXT,
ruolo VARCHAR(10) CHECK (ruolo IN ('admin', 'utente')) DEFAULT 'utente'
PRIMARY KEY (id)
)

CREATE TABLE PACCHETTI (
id SERIAL,
tipo VARCHAR(10),
prezzo DECIMAL(10,2),
durata DATE,	
capacita_massima INT,
descrizione TEXT,
PRIMARY KEY (id)
)

CREATE TABLE DISPONIBILITA (
    id SERIAL,
    id_pacchetto INT,
    data_inizio DATE,
    data_fine DATE,
    UNIQUE (id_pacchetto, data_inizio, data_fine),
    PRIMARY KEY (id),
    FOREIGN KEY (id_pacchetto) REFERENCES pacchetti (id)
)

CREATE TABLE PRENOTAZIONI (
id SERIAL,
id_utente INT,
id_disponibilita INT,
data_prenotazione DATE,
data_fine DATE,
numero_persone INT,
stato VARCHAR(20) CHECK (stato IN (‘attivo’, ‘cancellato’, ‘in attesa’)) DEFAULT ‘in attesa’,
PRIMARY KEY (ID),
FOREIGN KEY (id_utente) REFERENCES utente(id),
FOREIGN KEY (id_disponibilita) REFERENCES disponibilita (id)
)