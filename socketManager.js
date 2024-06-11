import { Server } from "socket.io";

let io;
var connected = false;

export function CreateSocketConnection (server){
    if (connected) return;

    io = new Server(server);

    io.on("connection", socket => {
        //Not complete
    
        //join match id as room
        socket.on('join', function(room){
            socket.join(room.toString());
        });
    });

    connected = true;
};

export function SendSocketMessage(roomId, key, message){
    io.to(roomId).emit(key, message);
}

export function SendEmptySocketMessage(roomId, key){
    io.to(roomId).emit(key);
}