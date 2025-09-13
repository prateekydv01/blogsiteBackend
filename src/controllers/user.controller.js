import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken";


export const createUser = asyncHandler(async(req,res)=>{
    const{username,email,password,fullname}=req.body

    if(!username || !email ||!password||!fullname){
        throw new ApiError(401,"All fields are mandatory!")
    }

    const existingUser = await User.findOne(
        {$or:[{username},{email}]}
    )

    if (existingUser){
        throw new ApiError(409,"user with this email or username already exists!")
    }
    try {
        const user = await User.create({
            fullname,
            email,
            username:username.toLowerCase(),
            password
        })

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if(!createdUser){
         throw new ApiError(500,"Something went wrong while registering a user !")
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,createdUser,"user created successfully !"))
    } catch (error) {
        throw new ApiError(404,"error while creating user")
    }
})

const generateAccessAndRefreshToken  = async (userId)=>{
    try {
        const user = await User.findById(userId)
        if (!user){
            throw new ApiError(404, "No user found!");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh token !")
    }
}

export const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} =req.body

    if(!email || !password){
        throw new ApiError(400,"email and password are required")
    }

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404,"user not found with this email id !")
    }

    if (user.password !== password) {
    throw new ApiError(402, "Incorrect password");
    } 


    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
    };

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,
        loggedInUser,
        "user logged in successfully"))

})

export const logout = asyncHandler(async(req,res)=>{
    const user =  await User.findById(req.user._id)
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    user.refreshToken = undefined; 
    await user.save();

    const options = {
    httpOnly : true,
    secure:process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully ! "))
})

export const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200, req.user , "current user details"))
})

export const updateAcessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken){
        throw new ApiError(401,"refresh token is required!")
    }
    
    
    try {
        const decodeRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodeRefreshToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
         if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401," invalid refresh token ! ")
        }
        
        const options = {
            httpOnly: true,
            secure:process.env.NODE_ENV==="production"
        }

        const {accessToken,refreshToken} =await generateAccessAndRefreshToken(user._id)
        const newRefreshToken = refreshToken
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json( new ApiResponse(200,{accessToken,newRefreshToken},"access token refresh successfully!"))
    } catch (error) {
        throw new ApiError(400,"something went wrong while refreshing and accesing token !")
    }
})