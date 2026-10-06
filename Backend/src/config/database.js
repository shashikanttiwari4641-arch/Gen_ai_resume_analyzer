const mongoose = require("mongoose");

async function connectDB(){
    try{

        await mongoose.connect(process.env.MONGO_URI);

         console.log("DB Connected");

    } 
    catch (err) {
        console.log(err);
        throw err;
    }  

}

module.exports = connectDB;
