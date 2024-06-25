import { Server } from "socket.io";
import cookieParser from 'cookie-parser';
import { sessionMiddleware, DeserializeSession } from "./utils/session.js";
import dotenv from "dotenv";
import { FindIfPlayerInMatch } from "./matchManager.js";
import { GetMatch, GetUserRole } from "./database.js";
import { userRoles } from "./public/constants/userData.js";

dotenv.config();
const sessionSecret = process.env.SESSION_SECRET;

let io;
var connected = false;

export function CreateSocketConnection (server){
    if (connected) return;

    io = new Server(server);

    io.engine.use(sessionMiddleware);
    io.engine.use(cookieParser(sessionSecret));
    io.engine.use(DeserializeSession);

    io.on("connection", socket => {
        //socket.use(cookieParser(sessionSecret));
        //socket.use(DeserializeSession);
    
        //join match id as room
        socket.on('join', function(room){
            const userId = socket.request.session.user;
            if (room == 'queRoom'){
                if (!userId) return; 

                var userQueRoom = 'queRoom' + userId.toString();
                socket.join(userQueRoom);
                return;
            }

            if (room.slice(0, 5) == 'match'){
                SocketJoinMatchRoom(socket, room);
            }
        });
    });

    connected = true;
};

async function SocketJoinMatchRoom(socket, room){
    const userId = socket.request.session.user;
    const roomId = +room.slice(5);
    if (!roomId) return;

    //find if user in active match
    if (FindIfPlayerInMatch(userId)) socket.join(room.toString());

    //find if user is in inactive match
    const match = await GetMatch(roomId);
    if (match){
        if (match.player1_id == userId || match.player2_id == userId) socket.join(room.toString());
    }

    //if user is mod
    const userRole = await GetUserRole(userId);
    if (userRole == userRoles.mod) socket.join(room.toString());
}

export function SendSocketMessage(roomId, key, message){
    io.to(roomId).emit(key, message);
}

export function SendEmptySocketMessage(roomId, key){
    io.to(roomId).emit(key);
}