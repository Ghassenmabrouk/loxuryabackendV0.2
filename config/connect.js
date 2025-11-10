// In connect.js
const mongoose = require('mongoose');

const connect = () => {
  mongoose.connect("mongodb+srv://shopadnen:Xva2qfO8e4OMRbe9@cluster0.bu9cfmy.mongodb.net/")
    .then(() => console.log(`Database connected successfully`))
    .catch((err) => {
        console.log(err);
      }
)};

module.exports = connect;

