import mongoose from "mongoose";
import User from "./User";

export interface IGithubInstallation extends mongoose.Document {
    installationId:string;
    githubAccountId: string;
    githubAccountLogin : string;
    user: mongoose.Schema.Types.ObjectId;
}

const GithubInstallationSchema = new mongoose.Schema<IGithubInstallation>({
    installationId : {type : String, required : true},
    githubAccountId : {type : String, required : true},
    githubAccountLogin : {type : String, required : true},
    user : {type : mongoose.Schema.Types.ObjectId, required : true,ref : User},
}, {timestamps : true,strict : "throw"});

const GithubInstallation = mongoose.models.GithubInstallation || mongoose.model("GithubInstallation", GithubInstallationSchema);

export default GithubInstallation;