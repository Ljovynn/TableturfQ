const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const url = require("url");
const { join } = require('path');
const { request } = require("http");
const { createServer } = require('http');
const { Server } = require("socket.io");

dotenv.config();

const website_url = process.env.URL;
const app = express();
const port = process.env.PORT;
const server = createServer(app);
const io = new Server(server);

const bodyParser = require('body-parser');
const hash = require('pbkdf2-password')();
const session = require('express-session');

const sessionMiddleware = session({
  secret: "changeit",
  resave: true,
  saveUninitialized: true
});

app.use(sessionMiddleware);

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret'
}));

// Test data because I haven't done any DB interactions yet
var users = {
    zeb: { name: 'zeb', userid: 1 },
    ljovynn: { name: 'ljovynn', userid: 2 },
    sirnerdbird: { name: 'sirnerdbird', userid: 3 },
    kimi: { name: 'kimi', userid: 4 }
};

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.zeb.salt = salt;
    users.zeb.hash = hash;
});

hash({ password: 'barfoo' }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.ljovynn.salt = salt;
    users.ljovynn.hash = hash;
});

hash({ password: 'baz' }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.sirnerdbird.salt = salt;
    users.sirnerdbird.hash = hash;
});

hash({ password: 'zab' }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.kimi.salt = salt;
    users.kimi.hash = hash;
});

var games = [
    {gameid: 1, player1: null, player1id: null, player1Ready: false, player2: null, player2id: null, player2Ready: false},
    {gameid: 2, player1: null, player1id: null, player1Ready: false, player2: null, player2id: null, player2Ready: false}
];

function getGames() {
    return games;
}

// Rewrite this to not be so dumb and haphazard
function assignPlayer(game) {
    // Try to assign the user to either player slot and return after they are assigned
    if ( games[game].player1id == null ) {
        games[game].player1id = user.userid;
        console.log('Adding ' + JSON.stringify(user.name) + ' to game ' + JSON.stringify(game) + ' as player 1' );
        return true;
    }
    if ( games[game].player2id == null ) {
        games[game].player2id = user.userid;
        console.log('Adding ' + JSON.stringify(user.name) + ' to game ' + JSON.stringify(game) + ' as player 2' );
        return true;
    }
}

// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
  console.log('authenticating %s:%s', name, pass);
  var user = users[name];
  // query the db for the given username
  if (!user) return fn(null, null)
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(null, null)
  });
}

// Restriction functions

function restrict(req, res, next) {
    console.log('Restricted?');
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/');
  }
}

/*app.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
});*/
server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
});

app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});

app.get("/ljovynnspestingpage", async (req, res) => {
    res.sendFile(join(__dirname, "LjovynnsTestingPage.html"));
});

app.get("/api/auth/discord/redirect", async (req, res) => {
    const { code } = req.query;

    if (!code){
        return;
    }

    const formData = new url.URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code.toString(),
        redirect_uri: website_url + ":" + port + "/api/auth/discord/redirect",
    });

    const output = await axios.post("https://discord.com/api/v10/oauth2/token",
        formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
    });

    if (output.data) {
        const access = output.data.access_token;

        const userInfo = await axios.get("https://discord.com/api/v10/users/@me", {
            headers: {
                "Authorization": `Bearer ${access}`,
            },
        });

        //refresh token

        const requestFormData = new url.URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: output.data.refresh_token,
        });

        const refresh = await axios.post("https://discord.com/api/v10/oauth2/token",
            requestFormData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
        });

        //console.log(output.data, userInfo.data, refresh.data);
    }
});

// CRUD

app.get('/', (req, res) => {
    res.sendFile( join(__dirname, 'index.html') );
});

app.post('/competetive', (req, res, next) => {
    authenticate(req.body.username, req.body.password, function(err, user){
        if (err) return next(err)
        if (user) {
          // Regenerate session when signing in
          // to prevent fixation
          req.session.regenerate(function(){
            // Store the user's primary key
            // in the session store to be retrieved,
            // or in this case the entire user object
            req.session.user = user;
            req.session.success = 'Authenticated as ' + user.name
              + ' click to <a href="/logout">logout</a>. '
              + ' You may now access <a href="/restricted">/restricted</a>.';
            res.redirect('queue');
          });
        } else {
          req.session.error = 'Authentication failed, please check your '
            + ' username and password.'
            + ' (use "tj" and "foobar")';
          res.redirect('/');
        }
    });
});

app.get('/competetive', function(req, res){
    res.sendFile( join(__dirname,'competetive.html') );
});

app.get('/queue', restrict, function(req, res){
    res.sendFile( join(__dirname,'queue.html') );
});

app.get('/logout', function(req, res){
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
        res.redirect('/');
    });
});

app.get('/player', restrict, function(req, res){
    res.json( {user: {id: req.session.user.userid, name: req.session.user.name} } );
});

app.get('/game/:gameid', restrict, function(req, res){
    res.sendFile( join(__dirname, 'public/game.html') );
});


io.engine.use(sessionMiddleware);

io.on('connection', (socket) => {
    console.log('A user connected!');
    const session = socket.request.session;
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('join queue', () => {
        user = session.user;
        console.log( user.name + ' has joined the queue');

        // Get the list of games
        // For each game, if there's an open slot, we can assign a user to the game
        // This is probably really stupidly written but for now I just want to connect players
        console.log('Games list: ' + JSON.stringify(games) );
        //try {
        foundGame = false;
        for ( var key in games ) {
                // Assign the player
                foundGame = assignPlayer(key);
                console.log('Found game? ' + foundGame);
                if ( foundGame ) {
                    var gameid = games[key].gameid;
                    console.log('Found game, ' + user.name + ' is waiting for both players');
                    console.log('Game ID: ' + gameid);
                    // Join the player to roomX with the gameid so we can broadcast a redirection event to both players once the second player connects
                    // That room 
                    socket.join('room' + gameid);

                    // Player 2 should be initiating this event hopefully
                    // I know there's a better way to do this, but for now I'm doing the dumbest shit possible
                    if ( games[key].player1id != null && games[key].player2id != null ) {
                        console.log('Two users found, emitting redirection event');
                        io.to('room' + gameid).emit('found game', '/game/' + gameid);
                    }
                    // If we found a game, we have no need to continue looping
                    break;
                }
        }
    });

    socket.on('exit queue', () => {
        // I guess this is where we remove the joined reference for the player or something
        // It should probably add a joined game attribute to the player object so we can easily remove them from the game lobby and destroy that room
    });

    socket.on('found game', (destination) => {
        console.log('redirecting players to ' + destination);
        socket.emit('redirection', destination)
    });


    socket.on('game ready', (gameid) => {
        user = session.user;
        console.log('Current user: ' + JSON.stringify(user));
        // I guess we should make sure the player emitting the event is actually supposed to be in that game room
        games = getGames();
        currentGame = games.find( (game) => game.gameid == gameid );
        console.log('The current game is: ' + JSON.stringify(currentGame) + ' and the current user is: ' + user.userid );


        // This check needs to be done in the page restriction function, but since that's not working right now I'll do it here
        if ( currentGame.player1id != user.userid && currentGame.player2id != user.userid) {
            console.log('Current player with id ' + user.userid + ' is not player 1 or 2. Access denied and redirecting.');
            socket.emit('invalid game', '/');
        } else {
            socket.join('game ' + gameid);
            console.log('Legit user, let\'s go!');
            console.log( 'Current game data: ' + JSON.stringify(currentGame) );
            console.log('Current User: ' + user.userid);
            if ( currentGame.player1id == user.userid ) {
                currentGame.player1Ready = true;
                currentGame.player1 = { id: user.userid, name: user.name };
                games[currentGame] = currentGame;
            }

            if ( currentGame.player2id == user.userid ) {
                currentGame.player2Ready = true;
                currentGame.player2 = { id: user.userid, name: user.name };
                games[currentGame] = currentGame;
            }

            console.log(JSON.stringify(games));

            // Coin flip
            var firstStrike = Math.random() < 0.5;
            if ( firstStrike ) {
                currentGame.currentStriker = currentGame.player1;
            } else {
                currentGame.currentStriker = currentGame.player2;
            }

            // Going to control the state of interactions with phases
            // Phase 1 - Initial strikes of starting stages
            // Phase 2 - Reporting the game score
            // Phase 3 - Winner's strikes
            // Phases 2-3 will repeat until the game is over
            // Phase 4 - Final reporting/game finish events
            currentGame.gamePhase = 'Phase 1';

            if ( currentGame.player1Ready && currentGame.player2Ready ) {
                io.to('game ' + gameid).emit('begin game', currentGame);
            }
        }
    });
});