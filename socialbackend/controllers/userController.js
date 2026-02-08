const User = require("../models/User");

export const getUserById = async(req,res) => {
    try{
        const userId = req.params.id;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}