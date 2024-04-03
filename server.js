const express = require("express");

const dotenv = require("dotenv");

dotenv.config()

var createServer = require('http');

const app = express();
const port = process.env.PORT;

const server = createServer(app);