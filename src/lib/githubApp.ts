import jwt from 'jsonwebtoken';
import { Octokit } from '@octokit/rest';

export function getJwt(){
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;
    const appId = process.env.GITHUB_APP_ID!;

    if(!privateKey || !appId){
        return Response.json({
            success : false,
            message : "Server Configuration error"
        },{
            status : 400
        })
    }
    
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iat : now-60,
        exp : now + 600,
        iss : appId
    };

    return jwt.sign(payload, privateKey, {
        algorithm : 'RS256'
    });
}


export async function getInstallationAccessToken(installationId : number){
    const jwt = getJwt();

    const octokit = new Octokit({
        authStrategy : 'jwt',
        auth : jwt
    });

    const response = await octokit.request(
        "POST /app/installations/{installation_id}/access_tokens",
        {
        installation_id: installationId,
        }
    );
    console.log(response);
  return response.data.token;
}