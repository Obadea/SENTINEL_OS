import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "@clerk/express";

// Must be a Live API model id — see https://ai.google.dev/gemini-api/docs/models
const GEMINI_LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL || "gemini-2.0-flash-live-001";

const GEMINI_WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const CHANNELS = {
  completion: {
    maxOutputTokens: 320,
    systemInstruction: `You are SENTINEL_OS Solidity copilot. The user sends [COMPLETE] with cursor context.
Return ONLY the next few lines of Solidity code to insert at the cursor (1-6 lines max).
No markdown fences, no explanations, no JSON — raw Solidity continuation only.
Match indentation of the current line. also the latest Pragma version is 0.8.35 so dont flag it or mark it as an error. If nothing to add, return an empty string.`,
  },
  lint: {
    maxOutputTokens: 1024,
    systemInstruction: `You are SENTINEL_OS real-time Solidity security linter. The user sends [LINT] with partial contract code.
Return ONLY a JSON array (no markdown): [{"line":<number>,"severity":"high"|"med"|"low","message":"<short warning>"}]
Flag reentrancy, tx.origin, unchecked calls, access control, integer issues, delegatecall risks, also the latest Pragma version is 0.8.35 so dont flag it or mark it as an error.
.
Max 8 findings. Use line numbers from the provided code. If no issues: []`,
  },
};

function geminiWsUrl() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return `${GEMINI_WS_BASE}?key=${key}`;
}

function buildSetup(channel) {
  const cfg = CHANNELS[channel];
  return {
    setup: {
      model: `models/${GEMINI_LIVE_MODEL}`,
      generationConfig: {
        responseModalities: ["TEXT"],
        temperature: 0.2,
        maxOutputTokens: cfg.maxOutputTokens,
      },
      systemInstruction: {
        parts: [{ text: cfg.systemInstruction }],
      },
    },
  };
}

function extractTextFromResponse(data) {
  const chunks = [];
  if (data.serverContent?.modelTurn?.parts) {
    for (const part of data.serverContent.modelTurn.parts) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  if (typeof data.serverContent?.outputTranscription?.text === "string") {
    chunks.push(data.serverContent.outputTranscription.text);
  }
  return chunks.join("");
}

async function verifyClerkToken(token) {
  if (!token) return false;
  try {
    await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return true;
  } catch {
    return false;
  }
}

function relayGeminiSession(clientWs, channel) {
  let upstream = null;
  let setupDone = false;
  let textBuffer = "";
  let closed = false;

  const closeAll = (reason) => {
    if (closed) return;
    closed = true;
    try {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: reason }));
        clientWs.close();
      }
    } catch {
      /* ignore */
    }
    try {
      upstream?.close();
    } catch {
      /* ignore */
    }
  };

  const openUpstream = () => {
    upstream = new WebSocket(geminiWsUrl());

    upstream.on("open", () => {
      upstream.send(JSON.stringify(buildSetup(channel)));
    });

    upstream.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.error) {
          const msg =
            data.error?.message || JSON.stringify(data.error);
          console.error(`Gemini Live [${channel}] error:`, msg);
          closeAll(msg);
          return;
        }

        if (data.setupComplete) {
          setupDone = true;
          clientWs.send(JSON.stringify({ type: "ready", channel }));
          return;
        }

        const piece = extractTextFromResponse(data);
        if (piece) {
          textBuffer += piece;
          clientWs.send(
            JSON.stringify({ type: "delta", channel, text: piece })
          );
        }

        if (data.serverContent?.turnComplete) {
          clientWs.send(
            JSON.stringify({
              type: "done",
              channel,
              text: textBuffer.trim(),
            })
          );
          textBuffer = "";
        }
      } catch (err) {
        console.error("Gemini Live parse error:", err);
      }
    });

    upstream.on("error", (err) => {
      console.error("Gemini Live upstream error:", err);
      closeAll("Gemini Live connection error");
    });

    upstream.on("close", (code, reason) => {
      if (!setupDone && !closed) {
        const detail = reason?.toString() || `code ${code}`;
        console.error(`Gemini Live [${channel}] closed before ready:`, detail);
        closeAll(`Gemini Live session closed (${detail})`);
        return;
      }
      if (!closed && clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });
  };

  clientWs.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "auth") {
        const ok = await verifyClerkToken(msg.token);
        if (!ok) {
          closeAll("Unauthorized");
          return;
        }
        if (!process.env.GEMINI_API_KEY) {
          closeAll("GEMINI_API_KEY is not configured on the server");
          return;
        }
        openUpstream();
        return;
      }

      if (msg.type === "input" && setupDone && upstream?.readyState === WebSocket.OPEN) {
        textBuffer = "";
        upstream.send(
          JSON.stringify({
            clientContent: {
              turns: [{ role: "user", parts: [{ text: msg.text }] }],
              turnComplete: true,
            },
          })
        );
        return;
      }

      if (msg.type === "ping") {
        clientWs.send(JSON.stringify({ type: "pong" }));
      }
    } catch (err) {
      console.error("Gemini Live client message error:", err);
    }
  });

  clientWs.on("close", () => {
    closed = true;
    upstream?.close();
  });
}

export function attachGeminiLiveProxy(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (!url.pathname.startsWith("/api/gemini-live")) {
      return;
    }

    const channel = url.searchParams.get("channel");
    if (!CHANNELS[channel]) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, channel);
    });
  });

  wss.on("connection", (clientWs, _request, channel) => {
    relayGeminiSession(clientWs, channel);
  });

  return wss;
}
