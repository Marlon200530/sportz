
import {WebSocket, WebSocketServer} from "ws";

const sendJson = (socket, payload) => {
    if (socket.readyState !== WebSocket.OPEN) return;

    try {
        socket.send(JSON.stringify(payload));
    } catch (error) {
        console.error("Failed to serialize WebSocket payload:", error);
    }
}

const broadcast = (wss, payload) => {
    let message;

    try {
        message = JSON.stringify(payload);
    } catch (error) {
        console.error("Failed to serialize WebSocket broadcast payload:", error);
        return;
    }

    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(message);
    }
}

export const attachWebSocketServer = (server) => {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024
    })

    wss.on("connection", (socket) => {
        sendJson(socket, {message: "Connected to the server"});

        socket.on("error", (error) => {
            console.error("WebSocket error:", error);
        })
    })

    wss.on("error", (error) => {
        if (error.code === "EADDRINUSE") return;

        console.error("WebSocket server error:", error);
    })

    function broadcastMatchCreated(match) {
        broadcast(wss, {
            type: "match_created",
            data: match
        });
    }

    return {
        broadcastMatchCreated
    }
};
