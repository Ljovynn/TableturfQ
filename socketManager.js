import { Server } from "socket.io";
import { sessionMiddleware } from "./utils/session.js";
import dotenv from "dotenv";
import { FindIfPlayerInMatch } from "./matchManager.js";
import { GetMatch, GetUserRole } from "./database.js";
import { userRoles } from "./public/constants/userData.js";
import { instrument } from "@socket.io/admin-ui";

dotenv.config();
const sessionSecret = process.env.SESSION_SECRET;

let io;
var connected = false;

export function CreateSocketConnection (server){
    if (connected) return;

    console.log("Setting up socket connection");
    io = new Server(server, {
        cors: {
          origin: ["https://admin.socket.io"],
          credentials: true
        }
    });

    io.engine.use(sessionMiddleware);

    io.on("connection", socket => {

    
        //join match id as room
        socket.on('join', function(room){
            const userId = socket.request.session.user;
            if (room == 'queRoom'){
                if (!userId) return; 

                var userQueRoom = 'queRoom' + userId;
                socket.join(userQueRoom);
                return;
            }

            if (room.slice(0, 5) == 'match'){
                SocketJoinMatchRoom(socket, room);
            }
        });
    });

    if (process.env.NODE_ENV === 'development') {
        console.log("Setting up socket admin page");
        instrument(io, {
            auth: false,
            mode: "development",
        });
    }

    connected = true;
};

async function SocketJoinMatchRoom(socket, room){
    const userId = socket.request.session.user;
    const roomId = room.slice(5);
    if (!roomId) return;
    if (!userId) return;

    //find if user in active match
    if (FindIfPlayerInMatch(userId)) socket.join(room);

    //find if user is in inactive match
    const match = await GetMatch(roomId);
    if (match){
        if (match.player1_id == userId || match.player2_id == userId) socket.join(room);
    }

    //if user is mod
    const userRole = await GetUserRole(userId);
    if (userRole == userRoles.mod) socket.join(room);
}

export function SendSocketMessage(roomId, key, message){
    io.to(roomId).emit(key, message);
}

export function SendEmptySocketMessage(roomId, key){
    io.to(roomId).emit(key);
}