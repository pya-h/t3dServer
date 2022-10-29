const morgan = require("morgan");
const fs = require("fs");
const path = require("path");


// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    {
        flags: "a",
    }
);
// `res: ${JSON.stringify(res.data)}`,
exports.morganLogger = morgan(
    (tokens, req, res) => {
        
        req.body.password && delete req.body.password;
        return [
            (new Date()).toString(),
            `Method: ${tokens.method(req, res)}`,
            `Token: ${JSON.stringify(req.headers.authorization)}`,
            `User Requested: ${JSON.stringify(req.CurrentUser)}`,
            `Payload: ${JSON.stringify(req.body)}`,
            `URL: ${tokens.url(req, res)}`,
            `Status Code: ${tokens.status(req, res)}`,
            `Error Message: ${JSON.stringify(req.CurrentError)}`,
            `Content Length: ${tokens.res(
                req,
                res,
                "content-length"
            )}`,
            `Response Time: ${tokens["response-time"](req, res)} ms`,
            "---------------------------------------------------\n",
        ].join("\n");
    },
    { stream: accessLogStream, 
        skip: (req, res) => { return res.statusCode < 400 } 
    }
);
