// initialize express framework
const express = require("express");
const app = express();

// create http server
const http = require("http").createServer(app);

// set the view engine as EJS
app.set("view engine", "ejs");

// include MongoDB module
const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// globale Variable für die DB
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
    const perPage = parseInt(request.query.limit) || 5; // Anzahl Songs pro Seite (Standard = 5)
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
      .sort({ Titel: 1 }) // alphabetisch nach Titel sortieren
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

// start server
http.listen(3000, function () {
  console.log("Server gestartet auf Port 3000");
});
