const express = require("express");

const dotenv = require("dotenv");

dotenv.config()

var createServer = require('http');

const app = express();
const port = process.env.PORT;

const server = createServer(app);

server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
});

app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
})

app.get("/LjovynnsTestingPage", async (req, res) => {
    res.sendFile(join(__dirname, "LjovynnsTestingPage.html"));
})