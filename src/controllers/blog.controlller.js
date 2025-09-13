import { Blog } from "../models/blog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import cloudinary from '../utils/cloudinary.js'

export const createPost = asyncHandler(async(req,res)=>{
    const {title,content} = req.body

    const imageLocalPath = req.file?.path
    console.log(title);
    console.log(imageLocalPath);
    
    if(!imageLocalPath){
        throw new ApiError(404,"no image found while creating post !")
    }

    let imageFile
    try {
        imageFile = await uploadOnCloudinary(imageLocalPath)
        console.log("image uploaded on cloudinary ",imageFile);
        
    } catch (error) {
        console.log("error while uploading on cloudinary !",error)
        throw new ApiError(500,"failed to upload image!")
    }

    try {
        const post = await Blog.create({
            title,
            content,
            image:imageFile.url,
            imagePublicId:imageFile.public_id,
            owner:req.user._id
        })
    
        return res
        .status(200)
        .json(new ApiResponse(200,post,"post created successfully!"))
    } catch (error) {
        console.log("post creation failed");
        if(imageFile){
            await deleteFromCloudinary(imageFile.public_id,"image")
        }
    }
})

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) throw new ApiError(400, "Post ID is required");

  const blog = await Blog.findById(postId);
  if (!blog) throw new ApiError(404, "Post not found");

  if (blog.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized");
  }

  const { title, content, status } = req.body;

  if (req.file) {
    if (blog.imagePublicId) {
      await deleteFromCloudinary(blog.imagePublicId, "image");
    }

    const uploaded = await uploadOnCloudinary(req.file.path);
    blog.image = uploaded.url;
    blog.imagePublicId = uploaded.public_id;
  }

  blog.title = title || blog.title;
  blog.content = content || blog.content;
  blog.status = status === "true";

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Post updated successfully"));
});


export const getPostById = asyncHandler(async(req,res)=>{
    const {postId} = req.params
     if(!postId){
        throw new ApiError (400,"please provide post id !")
    }

    const post = await Blog.findById(postId).populate('owner', 'username name email')
    if(!post){
        throw new ApiError (400,"no such post found !")
    }
    return res.status(200).json(new ApiResponse(200,post,"post found successfully!"))
    
})

export const deletePost = asyncHandler(async(req,res)=>{
    const {postId} = req.params
     if(!postId){
        throw new ApiError (400,"please provide post id !")
    }
    const post = await Blog.findById(postId)
    if (post.owner.toString()!==req.user._id.toString()){
        throw new ApiError(401,"you are not the owner of this video file")
    }

    await deleteFromCloudinary(post.imagePublicId,"image")

    const deletePost = await Blog.findByIdAndDelete(postId)
    return res
        .status(200)
        .json(
            new ApiResponse(200, deletePost, "Post deleted successfully")
        );

})


export const getFilePreview = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
        throw new ApiError(400, "Please provide a file ID");
    }

    try {
        const previewUrl = cloudinary.url(fileId, {
            width: 300,
            height: 300,
            crop: 'fill', // or 'thumb'
            resource_type: 'image',
        });

        return res.status(200).json(new ApiResponse(200, { url: previewUrl }, "Preview URL generated successfully"));
    } catch (error) {
        console.error("Error generating preview URL:", error);
        throw new ApiError(500, "Could not generate file preview");
    }
});

export const getAllPosts = asyncHandler(async(req,res)=>{
    const activePosts = await Blog.find({status:true}).populate('owner', 'username name email');

    return res.status(200).json(new ApiResponse(200,activePosts,"active posts fetched successfully!"))
})

// export const getPostById = asyncHandler(async(req,res)=>{
//     const {postId} = req.params
//      if(!postId){
//         throw new ApiError (400,"please provide post id !")
//     }

//     const post = await Blog.findById(postId).populate('owner', 'username name email')
//     if(!post){
//         throw new ApiError (400,"no such post found !")
//     }
//     return res.status(200).json(new ApiResponse(200,post,"post found successfully!"))
    
// })

export const activePostsByUser = asyncHandler(async(req,res)=>{
    const activePosts = await Blog.find({status:true}).populate('owner', 'username name email image')
    const userActivePosts = activePosts.filter(post =>
    String(post.owner._id) === String(req.user._id)
    );
   
    return res.status(200).json(new ApiResponse(200,userActivePosts,"active posts fetched successfully"))

})

export const inactivePostsByUser = asyncHandler(async(req,res)=>{
    const inactivePosts = await Blog.find({status:false}).populate('owner', 'username name email')
    const userInactivePosts = inactivePosts.filter(post =>
    String(post.owner._id) === String(req.user._id)
    );
   
    return res.status(200).json(new ApiResponse(200,userInactivePosts,"inactive posts fetched successfully"))

})