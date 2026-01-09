import mongoose from "mongoose";

export interface IUser {
    githubUserId : String;
    githubUserName : String;
    githubUserAvatar : String;
    email : String;
    createdAt : Date;
    updatedAt : Date;
}

const UserSchema = new mongoose.Schema<IUser>({
    githubUserId : {type : String, unique : true},
    githubUserName : {type : String, unique : true,trim : true,required : true},
    githubUserAvatar : {type : String, required : true,match: /^https?:\/\//,},
    email : {type : String, unique : true, required : true,lowercase: true,trim: true,match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/},
}, {timestamps : true,strict : "throw"});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
