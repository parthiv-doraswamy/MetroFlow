import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());

app.use(express.json());

const __filename =
fileURLToPath(import.meta.url);

const __dirname =
path.dirname(__filename);

/* CROSS PLATFORM EXECUTABLE */

const executableName =

process.platform === "win32"

? "metro.exe"

: "metro";

const cppExecutable =

path.resolve(
  __dirname,
  "../cpp",
  executableName
);

/* HEALTH CHECK API */

app.get("/",(req,res) => {

    res.json({
        status:"MetroFlow API Running"
    });
});

/* SHORTEST ROUTE API */

app.post("/route",(req,res) => {

    const { source,destination } =
    req.body;

    if(!source || !destination){

        return res.status(400).json({

            error:
            "Missing source or destination"
        });
    }

    execFile(

        cppExecutable,

        [source,destination],

        (error,stdout,stderr) => {

            if(stderr){

                console.error(
                    "STDERR:",
                    stderr
                );
            }

            if(error){

                console.error(
                    "ERROR:",
                    error
                );

                return res.status(500).json({

                    error:error.message
                });
            }

            try{

                const result =
                JSON.parse(stdout);

                res.json(result);

            }catch(parseError){

                console.error(
                    parseError
                );

                res.status(500).json({

                    error:
                    "Invalid C++ output"
                });
            }
        }
    );
});

const PORT = 3000;

app.listen(PORT,() => {

    console.log(
        `Server running on port ${PORT}`
    );
});