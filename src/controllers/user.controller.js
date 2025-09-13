import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken";


export const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullname } = req.body;

    if (!username || !email || !password || !fullname) {
        throw new ApiError(400, "All fields are mandatory!");
    }

    const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists!");
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
    });

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite:"none", // same as loginUser
        path: "/",                              // ensures cookie works on all paths
    };

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(201, createdUser, "User created successfully!"));
});

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

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found with this email id!");
    }

    if (user.password !== password) {
        throw new ApiError(402, "Incorrect password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Detect environment
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
        httpOnly: true,
        secure:true,       // true only in production
        sameSite: "none" ,// 'none' for cross-site cookies in prod
        path: "/" 
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});


export const logout = asyncHandler(async (req, res) => {
    // Make sure JWT middleware ran before this
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Remove refresh token from DB
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Cookie options must match the ones used for setting cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // ensures proper cross-site behavior
        path: "/",          // must match the original path
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully!"));
});


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
            secure:true,
            ameSite: "none",  // enables cross-site cookies
            path: "/" 
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