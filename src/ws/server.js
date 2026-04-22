
import {WebSocket, WebSocketServer} from "ws";
import { protectWithArcjet, shouldFailOpenArcjet } from "../middleware/arcjet.middleware.js";

const WS_MESSAGE_WINDOW_MS = 10_000;
const WS_MAX_MESSAGES_PER_WINDOW = 30;

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

const sendSerializedJson = (socket, message) => {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(message);
}

const parseMatchId = (matchId) => {
    const parsedMatchId = Number(matchId);

    if (!Number.isInteger(parsedMatchId) || parsedMatchId <= 0) {
        return null;
    }

    return parsedMatchId;
}

const handleSubscriptionMessage = (socket, message) => {
    const matchId = parseMatchId(message.matchId);

    if (!matchId) {
        sendJson(socket, {
            type: "error",
            code: "INVALID_MATCH_ID",
            error: "matchId must be a positive integer"
        });
        return;
    }

    if (message.type === "subscribe_match") {
        socket.subscribedMatchIds.add(matchId);
        sendJson(socket, {
            type: "match_subscribed",
            matchId
        });
        return;
    }

    if (message.type === "unsubscribe_match") {
        socket.subscribedMatchIds.delete(matchId);
        sendJson(socket, {
            type: "match_unsubscribed",
            matchId
        });
    }
}

const handleClientMessage = (socket, rawMessage) => {
    const now = Date.now();

    if (!socket.rateLimitWindowStartedAt || now - socket.rateLimitWindowStartedAt > WS_MESSAGE_WINDOW_MS) {
        socket.rateLimitWindowStartedAt = now;
        socket.messageCount = 0;
    }

    socket.messageCount += 1;

    if (socket.messageCount > WS_MAX_MESSAGES_PER_WINDOW) {
        sendJson(socket, {
            type: "error",
            code: "RATE_LIMITED",
            error: "Too many WebSocket messages"
        });
        socket.close(1008, "Too many messages");
        return;
    }

    let message;

    try {
        message = JSON.parse(rawMessage.toString());
    } catch {
        sendJson(socket, {
            type: "error",
            code: "INVALID_JSON",
            error: "Message must be valid JSON"
        });
        return;
    }

    if (message.type === "subscribe_match" || message.type === "unsubscribe_match") {
        handleSubscriptionMessage(socket, message);
        return;
    }

    sendJson(socket, {
        type: "error",
        code: "UNKNOWN_MESSAGE_TYPE",
        error: "Unsupported WebSocket message type"
    });
}

const broadcastToMatchSubscribers = (wss, matchId, payload) => {
    let message;

    try {
        message = JSON.stringify(payload);
    } catch (error) {
        console.error("Failed to serialize WebSocket match payload:", error);
        return;
    }

    for (const client of wss.clients) {
        if (!client.subscribedMatchIds?.has(matchId)) continue;

        sendSerializedJson(client, message);
    }
}

export const attachWebSocketServer = (server) => {
    // Handle upgrade events to provide detailed JSON error responses
    server.on("upgrade", (req, socket, head) => {
        if (req.url !== "/ws") return;

        protectWithArcjet(req)
            .then((result) => {
                if (result.allowed) return;

                // Connection denied - send detailed JSON response
                const body = JSON.stringify({
                    success: false,
                    error: result.error,
                    code: result.code,
                });

                socket.write(
                    `HTTP/1.1 ${result.statusCode} ${result.error}\r\n` +
                    `Content-Type: application/json\r\n` +
                    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
                    `Connection: close\r\n` +
                    `\r\n` +
                    body
                );
                socket.destroy();
            })
            .catch((error) => {
                console.error("Arcjet WebSocket protection failed:", error);
                if (shouldFailOpenArcjet()) return;

                // Error during protection check - send error response
                const body = JSON.stringify({
                    success: false,
                    error: "Security protection unavailable",
                    code: "SECURITY_UNAVAILABLE",
                });

                socket.write(
                    `HTTP/1.1 503 Service Unavailable\r\n` +
                    `Content-Type: application/json\r\n` +
                    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
                    `Connection: close\r\n` +
                    `\r\n` +
                    body
                );
                socket.destroy();
            });
    });

    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
        verifyClient: (info, done) => {
            protectWithArcjet(info.req)
                .then((result) => {
                    if (result.allowed) {
                        done(true);
                        return;
                    }

                    done(false, result.statusCode, result.error);
                })
                .catch((error) => {
                    console.error("Arcjet WebSocket protection failed:", error);
                    if (shouldFailOpenArcjet()) {
                        done(true);
                        return;
                    }

                    done(false, 503, "Security protection unavailable");
                });
        }
    })

    wss.on("connection", (socket) => {
        socket.subscribedMatchIds = new Set();
        socket.rateLimitWindowStartedAt = Date.now();
        socket.messageCount = 0;

        sendJson(socket, {
            type: "connected",
            message: "Connected to the server"
        });

        socket.on("message", (rawMessage) => {
            handleClientMessage(socket, rawMessage);
        })

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

    function broadcastCommentaryCreated(commentary) {
        broadcastToMatchSubscribers(wss, commentary.matchId, {
            type: "commentary_created",
            matchId: commentary.matchId,
            data: commentary
        });
    }

    return {
        broadcastMatchCreated,
        broadcastCommentaryCreated
    }
};