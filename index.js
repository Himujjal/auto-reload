// Step 1: Get all the HTML, CSS and JS files in the required directory
// Step 2: Create a new socket that will send message to a specific server with the shortFileName message to the frontend
// Step 3: Serve each file with their respective location
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const http = require("http");
app.use(bodyParser.json());
app.use(cors());
const {getAllFilesWithExt, filterFunctionWithExtension, replaceSlashes} = require('./getAllFilesWithExt');
// var env = (process.env.NODE_ENV).trim();

const stringToBePut = "<script>var socket=new WebSocket('ws://localhost:3000');setInterval(function(){socket.send(window.location.pathname)},1000);socket.onmessage=function(event){var message=event.data;console.log(message);if(message===window.location.pathname){window.location.reload();}}</script>";

// wss is the websocket server
let wss;

// directory is the main directory where all the html, css and js files are found
let directory = process.argv[2];
let files = getAllFilesWithExt(directory, ["html", "css", "js"])
let htmlFiles = files.filter(file=>filterFunctionWithExtension(file, ["html"]))
var fileContents = []
htmlFiles.forEach(file=>{
    let fileContent = fs.readFileSync(file)
    fileContents.push({
        filePath: file,
        fileContent: fileContent.toString()
    })
})
const server = http.createServer(app);

wss = new WebSocket.Server({server});


wss.on('connection', (ws)=>{
    ws.on("message", (data)=>{

        let newFileContents = fileContents.filter(f=>{
            let shortFileLocation = path.normalize(f.filePath).slice(directory.length);
            shortFileLocation = replaceSlashes(shortFileLocation);
            return data.trim() === shortFileLocation.trim()
        })
        newFileContents = newFileContents[0];
        let {filePath, fileContent} = newFileContents;

        let shortFileLocation = path.normalize(newFileContents.filePath).slice(directory.length);
        shortFileLocation = replaceSlashes(shortFileLocation);

        if(!(fs.readFileSync(filePath).toString() === fileContent) ) {
            // filter out the file that has to be edited
            let newNewFileContents = fileContents.filter(f=> f.filePath !== filePath  )

            newNewFileContents.push({
                filePath: newFileContents.filePath,
                fileContent: fs.readFileSync(newFileContents.filePath).toString()
            })
            
            fileContents = [...newNewFileContents];

            ws.send(shortFileLocation);
        }       
    })
})
// if(env === "production") {}

htmlFiles.forEach(fileLocation=>{
    var shortFileLocation = replaceSlashes(path.normalize(fileLocation).slice(directory.length+1));
    
    app.get('/'+shortFileLocation, (req, res)=> {
        console.log("invoked: "+ shortFileLocation);
        let fileContents = fs.readFileSync(fileLocation).toString();
        let fileContentsArr = fileContents.split("\n");
        fileContentsArr.push(stringToBePut);
        fileContents = fileContentsArr.join("\n")
        res.send(fileContents)
    })
});




app.use(express.static(directory))

const port = process.env.PORT || 3000;
server.listen(port, ()=> console.log("Your website is running at URL: http://localhost:3000/. \n Files:" ) )