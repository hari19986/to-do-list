const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
console.log(process.env.MONGODB_LINK);

mongoose.connect(process.env.MONGODB_LINK);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Items = mongoose.model("Items", itemsSchema);
const Lists = mongoose.model("Lists", listSchema);

const defaultItems = [
  { name: "Welcome to todo list!" },
  { name: "Hit + icon to add new items" },
  { name: "<--- To delete items" },
];

let port = process.env.PORT;

if (port === null || port === "" || port === undefined) {
  port = 3000;
}

app.listen(port, function () {
  console.log("I am listening");
});

app.get("/", function (req, res) {
  Items.find()
    .then((response) => {
      console.log("Data received", response);
      if (response.length === 0) {
        Items.insertMany(defaultItems)
          .then((res) => {
            console.log("Successfully inserted", res);
          })
          .catch((e) => {
            console.log(e);
          });
        res.redirect("/");
      } else {
        res.send({ listTitle: "Today", newItemList: response });
      }
    })
    .catch((err) => {
      console.log("Failed to get Data", err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listname = req.body.list;
  const item = new Items({ name: itemName });
  if (listname === "Today") {
    item.save();
    res.redirect("/");
  } else {
    Lists.findOne({ name: listname })
      .then((response) => {
        const foundList = response;
        console.log(foundList);
        foundList.items.push(item);
        foundList.save().then(() => {
          res.redirect("/" + listname);
        });
      })
      .catch((e) => {
        console.log(e);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkboxId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);
  console.log(checkboxId);
  if (listName === "Today") {
    Items.findByIdAndRemove(checkboxId)
      .then((response) => {
        console.log(response);
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Lists.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkboxId } } }
    ).then(() => {
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  Lists.findOne({ name: customListName })
    .then((response) => {
      if (!response) {
        const newLists = Lists({ name: customListName, items: defaultItems });
        console.log(newLists);
        newLists
          .save()
          .then(() => {
            res.redirect("/" + customListName);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.send({
          listTitle: response.name,
          newItemList: response.items,
        });
      }
    })
    .catch((err) => {
      console.log("I am in error");
    });
});
