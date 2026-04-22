
import {WebSocket, WebSocketServer} from "ws";

const sendJson = (socket, payload) => {
    if (socket.readyState !== WebSocket.OPEN) return;

    try {
        const json = JSON.stringify(payload);
        socket.send(json);
    } catch (error) {
        console.error("Failed to serialize JSON payload:", error);
    }
}

const broadcast = (wss, payload) => {
    try {
        const json = JSON.stringify(payload);
        for (const client of wss.clients) {
            if (client.readyState !== WebSocket.OPEN) continue;

            client.send(json);
        }
    } catch (error) {
        console.error("Failed to serialize JSON payload:", error);
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