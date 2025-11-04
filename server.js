// server.js

// Express initialisieren
const express = require("express");
const app = express();

// HTTP-Server erstellen
const http = require("http").createServer(app);

// EJS als View-Engine setzen
app.set("view engine", "ejs");

// Statische Dateien (CSS, JS, Bilder) bereitstellen
app.use(express.static(__dirname + "/public"));

// MongoDB Modul einbinden
const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// Globale Variable für die DB
let database;

// Mit MongoDB verbinden
async function connectDB() {
  try {
    await client.connect();
    database = client.db("PlaylistDB");
    console.log("Mit Datenbank verbunden.");
  } catch (err) {
    console.error("Fehler bei der Verbindung:", err);
  }
}
connectDB();

// GET-Route für Songs mit Pagination + Suche
app.get("/", async function (request, result) {
  try {
    const perPage = parseInt(request.query.limit) || 5; // Songs pro Seite
    const pageNumber = parseInt(request.query.page) || 1;
    const searchQuery = request.query.search || "";

    // Suchbedingungen: Titel, Künstler oder Genre
    const query = {
      $or: [
        { Titel: { $regex: searchQuery, $options: "i" } },
        { Künstler: { $regex: searchQuery, $options: "i" } },
        { Genre: { $regex: searchQuery, $options: "i" } }
      ]
    };

    const total = await database.collection("songs").countDocuments(query);
    const pages = Math.ceil(total / perPage);
    const songs = await database
      .collection("songs")
      .find(query, { projection: { Titel: 1, Künstler: 1, Genre: 1, Dauer: 1, Bewertung: 1 } })
      .sort({ Titel: 1 })
      .skip((pageNumber - 1) * perPage)
      .limit(perPage)
      .toArray();

    result.render("index", {
      pages: pages,
      songs: songs,
      currentPage: pageNumber,
      perPage: perPage,
      searchQuery: searchQuery
    });
  } catch (err) {
    result.status(500).send("Fehler: " + err.message);
  }
});

// Server starten, sobald die DB verbunden ist
http.listen(3000, function () {
  console.log("Server gestartet auf Port 3000");
});
