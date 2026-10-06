const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");

async function authUser(req , res , next){

    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message : "Token not provided",
        })
    }

    const isTokenBlacklisted = await blacklistModel.findOne({
            token,
        })

        if(isTokenBlacklisted) {

            return res.status(401).json({
                message : "token is invalid",
            })
        }

        let decoded;

    try{

       decoded = jwt.verify(token , process.env.JWT_SECRET);
       req.user = decoded;
       next()

    }
    catch(err) {
        console.log(err);
        res.status(401).json({
            message : "Invalid token",
        })
    }
    
}

module.exports = { authUser };
