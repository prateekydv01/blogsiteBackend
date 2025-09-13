import mongoose, { Schema } from "mongoose"

const BlogSchema = new Schema({
    title:{
        type: String,
        required : true
    },
    content:{
        type:String,
        required : true
    },
    image:{
        type:String,
        required:true
    },

    imagePublicId:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Blog = mongoose.model("Blog", BlogSchema)