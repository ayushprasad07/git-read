import mongoose from "mongoose";
import GithubInstallation from "./GithubInstallation";

export interface IGithubRepo extends mongoose.Document {
    githubRepoId : string;
    name : string;
    private : boolean;
    fullName : string;
    defaultBranch:string;
    installation : mongoose.Schema.Types.ObjectId;
    autoSync: boolean;
}


const GithubRepoSchema = new mongoose.Schema<IGithubRepo>({
    githubRepoId : {type : String, required : true},
    name : {type : String, required : true},
    private : {type : Boolean, required : true},
    fullName : {type : String, required : true},
    defaultBranch : {type : String, required : true},
    installation : {type : mongoose.Schema.Types.ObjectId, required : true, ref : GithubInstallation},
    autoSync: {
        type: Boolean,
        default: false,
    }
}, {timestamps : true,strict : "throw"});

const GithubRepo = mongoose.models.GithubRepo || mongoose.model("GithubRepo", GithubRepoSchema);

export default GithubRepo;