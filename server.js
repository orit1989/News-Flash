var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  // defaultView: 'articles'
}));
app.set("view engine", "handlebars");


// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsFlash";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.nytimes.com/section/travel?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=Travel&WT.nav=page").then(function(response) {
     // console.log(response);
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("a.story-link").each(function(i, element) {
      // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this).children("div.story-meta").children("h2").text();
        result.summary = $(this).children("div.story-meta").children("p").text();
        result.link = $(this).attr("href");

        console.log('this is the result log: ' + JSON.stringify(result));

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
            .then(function(dbArticle) {
            // View the added result in the console
            //console.log(dbArticle);
            })
            .catch(function(err) {
            // If an error occurred, send it to the client
            return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.render("scrape");
  });
});

// Route for getting all Articles from the db
app.get("/", function(req, res) {
  // Grab every document in the Articles collection
  console.log('home');
  db.Article.find({saved: false})
    .then(function(dbArticle) {
      res.render("articles", {
        articles: dbArticle});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// route for grabbing all articles that are saved
app.get("/saved", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({saved: true})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.render("saved", {
          articles: dbArticle});
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

// Route for grabbing a specific Article by id, and deleting it from the saved
app.put("/articles/saved/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.update({ _id: req.params.id }, {$set:{saved: false}})
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
  });

  // Route for grabbing a specific Article by id, and adding it to saved
app.post("/articles/saved/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.update({ _id: req.params.id }, {$set:{saved: true}})
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
  });

// Route for saving/updating an Article's associated Note
app.post("/notes/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/notes/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  var notes = [];
  db.Article.find({ _id: req.params.id })
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      db.Note.find({_id : {$in: dbArticle[0].note}}) 
      .then(function(dbNotes) {
          console.log(dbNotes);
          res.json(dbNotes);
      }); 
    });
});

//route for deleting a note from an article
app.delete("/notes/:id", function(req, res) {
    db.Note.remove({ _id: req.params.id })
      .then(function(dbNote) {
        res.json(dbNote);
      })
  });


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
