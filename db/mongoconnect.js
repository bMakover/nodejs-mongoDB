// 2
const mongoose = require('mongoose');
const {config}=require("../config/secret");
main().catch(err => console.log(err));

async function main() {
   mongoose.set('strictQuery' , false);

  await mongoose.connect(`mongodb+srv://${config.userDb}:${config.passDb}@cluster0.zrwj8um.mongodb.net/28_11`);
  console.log("mongo connect success started");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}