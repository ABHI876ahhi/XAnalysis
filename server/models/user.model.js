import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        default:"User"
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    avatar:{
        type:String,
        default:"🧑"
    },
    isProfileComplete:{
        type:Boolean,
        default:false
    },
    credits:{
        type:Number,
        default:100
    }

}, {timestamps:true})

const User = mongoose.model("User" , userSchema)

export default User