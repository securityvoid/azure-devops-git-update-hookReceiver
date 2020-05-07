# azure-devops-git-update-hookReceiver
A light-weight HTTP Listener set to receive a Personal Access Token or similar, and utilize that token to pull the latest updates from a git repository.

## Installation
1. Clone this repository
2. Create a directory "ssl" in the base of your cloned project and generate your SSL Certificates with the following openssl commands:
```
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```
3. Set the following environmental variables or put them in a .env file in the base of the directory:
| Variable | Definition
| ------------ | -------------
| **HTTP_LISTENER_PORT**          | The port that the HTTP Listener should listen on.                                   |
| **HASHED_AUTHORIZATION_BEARER** | The expected Authorization Bearer value run through the function getPwdHashFromPwd. |
| **TARGET_GIT_DIRECTORY**        | The location of the git directory that you want to run git pull on.                 |
| **SSL_PRIVATE_KEY**             | The name for the SSL private key. This should probably be key.pem .                 |
| **SSL_PUBLIC_KEY**              | The name for the SSL public key. This should probably be cert.pem .                 |

4. Run the script with the following command:
`node index.js`

## HTTP Request Format
HTTP Requests should be in the following format:
```POST / HTTP/1.1
Host: [HOSTNAME]
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
authorization: Bearer [AUTHORIZATION_BEARER_VALUE]
Connection: close
Content-Length: 67

access_token=[ACCESS_TOKEN_VALUE]
```

Where [AUTHORIZATION_BEARER_VALUE] is the authentication token that you've run through getPwdHashFromPwd and stored its value into the environmental variable HASHED_AUTHORIZATION_BEARER
and [ACCESS_TOKEN_VALUE] is the personal access token or similar from Azure DevOps that is allowed to pull the repository. [HOSTNAME] must also be filled out.

### Example HTTP Request
The following is an example HTTP Request:
```
POST / HTTP/1.1
Host: localhost
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
authorization: Bearer KgUGw2euwyL5p6UADMAYd4f0QG-Mjmc1HHyLycaAScg9uUa2SZPLSqu0IokjEfRD
Connection: close
Content-Length: 67

access_token=esqag7hurb6zeqfrenz6o4f2omq4c24jvgcenbudgneevqwzszda

```
In the above example, the value of HASHED_AUTHORIZATION_BEARER should be "o401q6Z+vmL7I/p3EUbuG57mYHB1MSPsZiJK56+EM+o=".

The HTTP Response will either be a 401 Unauthorized if ANY type of error happens or fails to validate, or an HTTP 200 because it was successful.





