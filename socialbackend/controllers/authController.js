const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

require("dotenv").config();

//signup route handler
exports.signup = async (req,res) => {
    try{
        //get data
        const {username, email , password} = req.body;
        //check if user already exist
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already Exists',
            });
        }

        //secure password
        let hashedPassword;
        try{
            hashedPassword = await bcrypt.hash(password, 10);
        }
        catch(err) {
            return res.status(500).json({
                success: false,
                message: 'Error in hashing password',
            });
        }

        //create entry user
        const user = await User.create({
            username,email,password:hashedPassword
        })

        return res.status(200).json({
            success:true,
            token,
            message:'User Created Successfully',
        });
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({
            success:false,
            message:'user cannot be registered, please try again later',
        });
    }
}

//login route handler
exports.login = async (req,res) => {
    try {
        //data fetch 
        const {email, password} = req.body;
        //validation on email and password
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'Please fill all the details carefully',
            });
        }
        
        //check for registered user
        let user = await User.findOne({email});
        //if not a registered user
        if(!user){
            return res.status(401).json({
                success:false,
                message:'User is not registered',
            })
        }
        

        const payload = {
            email:user.email,
            id:user._id,
        }
        //verify password and generate jwt token
        if(await bcrypt.compare(password,user.password)) {
            //password match
            let token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"24h",
            });
            user = user.toObject();
            user.token = token;
            user.password= undefined;

            const options = {
                expires: new Date( Date.now() + 3000),
                httpOnly:true,
                 
            }
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:'User Logged in Successfully',
            });
        }
        else {
            //password do not match
            return res.status(403).json({
                success:false,
                message:'Password Incorrect',
            });
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:'Login Faliure',
        });
    }
}