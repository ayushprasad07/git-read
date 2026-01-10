export async function GET(req:Request){
    const appName = process.env.Github_Appname

    if(!appName){
        return Response.json({
            success : false,
            message : "Server Configuration erro"
        },{
            status : 400
        })
    }

    const installationURL = `https://github.com/apps/${appName}/installations/new`

    return Response.redirect(installationURL);
}