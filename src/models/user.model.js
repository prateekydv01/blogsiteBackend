import mongoose, { Schema }  from "mongoose";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config({
    path:"./.env"
})

const UserSchema = new Schema(
    {
        email:{
            type:String,
            required : true,
            unique : true,
            lowercase : true,
            trim: true,
        },
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
         password: {
            type:String,
            required:[true,"password is required"],
            
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        refreshToken:{
            type:String
        }
    },{ timestamps:true })

UserSchema.methods.generateRefreshToken= function (){
    return jwt.sign({
        _id : this._id,  
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    );
}


UserSchema.methods.generateAccessToken = function(){
   return jwt.sign({ 
        _id : this._id,
        email : this.email,
        username : this.username
    },
     process.env.ACCESS_TOKEN_SECRET,
     {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );
}

export const User = mongoose.model("User",UserSchema)