const userModel = require("../models/user.model");
const blacklistModel = require("../models/blacklist.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
};

async function registerUser(req , res){

    const {username , email , password } = req.body;

    if(!username || !email || !password){
        return res.status(400).json({
            message : " please provide username , email and password"
        })
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or : [ {username} , {email}]
    })

    if(isUserAlreadyExist){
        return res.status(400).json({
            message : "User already exists with this email or username",
        })
    }

        const hash = await bcrypt.hash(password , 10);
    const user = await userModel.create({
        username,
        email,
        password : hash,
    })

    const token = jwt.sign(
        { id : user._id , username : user.username},
        process.env.JWT_SECRET,
        {expiresIn : "1d"}
    )

    res.cookie("token" , token, authCookieOptions);

    return res.status(201).json({
        message : "user registered successfully",
        user : {
            id : user._id,
            username : user.username,
            email : user.email,
        }
    })
}

async function loginUser(req , res){

    const { email , password} = req.body;

   const user = await userModel.findOne({ email })

   if(!user) {
    return res.status(400).json({
        message : "no user exists with this email",
    })
   }

   const isPasswordCorrect = await bcrypt.compare(password , user.password);

   if(!isPasswordCorrect){
    return res.status(400).json({
        message : "Incorrect email or password",
    })
   }

   const token = jwt.sign(
    {id : user._id , username : user.username},
    process.env.JWT_SECRET,
    {expiresIn : "1d"}
   )

   res.cookie("token" , token, authCookieOptions);

   return res.status(200).json({
    message : "user logged in successfully",
    user : {
        id : user._id,
        username : user.username,
        email : user.email
    }
   })

}

async function logoutUser(req , res){

    const token = req.cookies.token;

    if(token){
        await blacklistModel.create({ token })
    }

    res.clearCookie("token", authCookieOptions);

    res.status(200).json({
        message : "user logged out successfully"
    })
}

async function getUser(req, res) {

    const user = await userModel.findById(req.user.id);

    return res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    });
}

module.exports = {registerUser , loginUser , logoutUser , getUser};
