import genToken from "../config/token.js"
import User from "../models/user.model.js"


export const googleAuth = async (req,res) => {
    try {
        const {name , email} = req.body
        let user = await User.findOne({email})
        if(!user){
            user = await User.create({
                name , 
                email,
                isProfileComplete: true  // Google users already have name
            })
        }
        let token = await genToken(user._id)
        res.cookie("token" , token , {
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({message:`Google auth error ${error}`})
    }
    
}



// Update profile — name and/or avatar
export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body
        const user = await User.findByIdAndUpdate(
            req.userId,
            { 
                name: name?.trim() || "User",
                avatar: avatar || "🧑",
                isProfileComplete: true
            },
            { new: true }
        )
        if (!user) return res.status(404).json({ message: "User not found" })
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `Update profile error ${error}` })
    }
}


export const logOut = async (req,res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        })
        return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
         return res.status(500).json({message:`Logout error ${error}`})
    }
    
}
