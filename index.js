const fs        = require('fs');
const crypto    = require('crypto');
const path      = require('path');
const q         = require('q');
const git       = require('simple-git/promise');
require('dotenv').config();

const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', process.env.SSL_PRIVATE_KEY)),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', process.env.SSL_PUBLIC_KEY))
};

require('https').createServer(options, function(req, res) {
    let data = '';
    if(!req.headers || !req.headers.authorization || !validateToken(req.headers.authorization.replace(/^Bearer\s+/,'')) ) {
        console.log("Authorization Bearer Not Included or Not Valid:" + req.ip );
        sendResponse(res, 401, {'error': 'Access Denied'});
    } else {
        if (req.method == "POST") {
            req.on('data', function(chunk) {
                data += chunk;
            });

            req.on('end', function() {
                if(/^access_token=([^&=\s\n\r]+)\r\n$/.test(data))
                    gitPull(data.replace(/^access_token=/,'').trim()).then(function(){
                        sendResponse(res, 200,{ 'Success': 'true'});
                    }).catch(function(){
                        sendResponse(res, 401,{ 'error': 'Access Denied'});
                    });
                else
                    console.log("Authorization Bearer Token Was Not Valid:" + req.ip );
                    sendResponse(res, 401,{ 'error': 'Access Denied'});
            });
        } else {
            console.log("Not a POST Request:" + req.ip );
            sendResponse(res, 401,{ 'error': 'Access Denied'});
        }
    }
}).listen(process.env.HTTP_LISTENER_PORT);;


/**
 * sendResponse - Sends the Response Back to the Browser
 * @param res - Response Object from http
 * @param statusCode - The StatusCode to return on the response
 * @param body - The body to returned. Needs to be in a JSON format.
 */
function sendResponse(res, statusCode, body){
    if(typeof body != 'string')
        body = JSON.stringify(body);
    res.writeHead(statusCode, {'Content-Length': Buffer.byteLength(body), 'Content-Type': 'application/json'}).end(body);
    res.end();
}

/**
 * validateToken - Takes a token value, hashes it through getPwdHashFromPwd and sees if it matches the ENV variable password.
 * @param tokenValue - The token value supplied on the HTTP Request
 * @returns {boolean} - Returns true if it matches, false if it does not.
 */
function validateToken(tokenValue){
    if(getPwdHashFromPwd(tokenValue) == process.env.HASHED_AUTHORIZATION_BEARER)
        return true;
    else
        return false;
}

/**
 * getPwdHashFromPwd - Takes the password and hashes it 250 times to returned the hashed value and add time / weight.
 * @param pwd - The password to be hashed.
 * @returns - base64 encoded string with the final hash value.
 */
function getPwdHashFromPwd(pwd){
    let hash = pwd;
    for(let x=0; x < 250; x++){
        hash = crypto.createHash('sha256').update(hash).digest('base64');
    }
    return hash;
}

/**
 * gitPull - Performs the gitPull on the repository specified in the ENV variable TARGET_GIT_DIRECTORY.
 * @param tokenValue - The token to utilize when doing the git pull.
 * @returns {*|promise|Promise<any>} -  Resolve (Results) - The Pull executed properly
 *                                      Reject (Error) - The Pull failed.
 */
function gitPull(tokenValue){
    let deferred = q.defer();
    git(process.env.TARGET_GIT_DIRECTORY).getRemotes(true).then(function(remotes){
        const pushURL= remotes[0].refs.push;
        const credPushUrl = pushURL.slice(0, 8) + "batchjob:" + encodeURIComponent(tokenValue) + '@' + pushURL.slice(8);
        git(process.env.TARGET_GIT_DIRECTORY).env('GCM_INTERACTIVE', 'never').env('GIT_TERMINAL_PROMPT', '0').pull(credPushUrl).then(function(response){
            deferred.resolve(response);
        }).catch(function(error){
            console.log("Git Pull Error:" + JSON.stringify(error, Object.getOwnPropertyNames(error)));
            deferred.reject(error);
        });
    }).catch(function(error){
        console.log("Unknown Git Pull Error:" + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        deferred.reject(error);
    });
    return deferred.promise;
}

//Outputs the listening port so its clear where / how its listening.
console.log("Listening to port " + process.env.HTTP_LISTENER_PORT);
