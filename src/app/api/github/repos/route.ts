import GithubRepo from "@/model/GithubRepo";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/model/User";
import GithubInstallation from "@/model/GithubInstallation";


export async function GET() {
    
    const session = await getServerSession(authOptions);

    if(!session){
        return Response.json({
            success : false,
            message: "Unauthorized"
        },{
            status : 401
        })
    }

    try {

        await dbConnect();

        const user = await User.findOne({
            email : session.user?.email
        })

        if(!user){
            return Response.json({
                success : false,
                message: "User not found"
            },{
                status : 401
            })
        }
        
        const installation = await GithubInstallation.find({
            user : user._id
        }).select("_id")

        if(!installation){
            return Response.json({
                success : false,
                message: "Installation not found"
            },{
                status : 401
            })
        }

        if(installation.length === 0){
            return Response.json({
                repos : []
            },{
                status : 200
            })
        }

        const installationIds = installation.map(i => i._id);

        const repos = await GithubRepo.find({
            installation : {
                $in : installationIds
            }
        })
        .sort({ createdAt: -1 });

        if (!repos) {
            return Response.json({
                success: false,
                message: "No repos found",
            },{
                status : 404
            });
        }
        
        return Response.json({
            success : true,
            repos
        },{
            status : 200
        });
        
    } catch (error) {
        // console.log("Failed to fetch repos", error);
        return Response.json({
            success : false,
            message: "Internal Server error",
        },{
            status : 500
        })
    }
}