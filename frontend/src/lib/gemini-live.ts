export type GeminiLiveChannel = "completion" | "lint";

export type GeminiLiveClientMessage =
  | { type: "ready"; channel: GeminiLiveChannel }
  | { type: "delta"; channel: GeminiLiveChannel; text: string }
  | { type: "done"; channel: GeminiLiveChannel; text: string }
  | { type: "error"; message: string }
  | { type: "pong" };

export function getGeminiLiveWsUrl(channel: GeminiLiveChannel): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const httpOrigin = apiBase.replace(/\/api\/?$/, "");
  const wsOrigin = httpOrigin.replace(/^http/, "ws");
  return `${wsOrigin}/api/gemini-live?channel=${channel}`;
}

export type GeminiLiveHandlers = {
  onReady?: () => void;
  onDelta?: (text: string) => void;
  onDone?: (text: string) => void;
  onError?: (message: string) => void;
};

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private ready = false;
  private pendingInput: string | null = null;
  private handlers: Handlers = {};

  constructor(
    private channel: GeminiLiveChannel,
    private getToken: () => Promise<string | null>
  ) {}

  setHandlers(handlers: Handlers) {
    this.handlers = handlers;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = await this.getToken();
    if (!token) throw new Error("Not signed in");

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(getGeminiLiveWsUrl(this.channel));
      this.ws = ws;
      let settled = false;

      const fail = (err: Error) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as GeminiLiveClientMessage;

          if (msg.type === "ready" && msg.channel === this.channel) {
            this.ready = true;
            this.handlers.onReady?.();
            if (!settled) {
              settled = true;
              resolve();
            }
            if (this.pendingInput) {
              const text = this.pendingInput;
              this.pendingInput = null;
              this.sendInput(text);
            }
            return;
          }

          if (msg.type === "delta" && msg.channel === this.channel) {
            this.handlers.onDelta?.(msg.text);
            return;
          }

          if (msg.type === "done" && msg.channel === this.channel) {
            this.handlers.onDone?.(msg.text);
            return;
          }

          if (msg.type === "error") {
            this.handlers.onError?.(msg.message);
            fail(new Error(msg.message));
          }
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => fail(new Error("Gemini Live WebSocket error"));
      ws.onclose = () => {
        this.ready = false;
        if (!settled) fail(new Error("Gemini Live connection closed"));
      };
    });
  }

  sendInput(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.ready) {
      this.pendingInput = text;
      return;
    }
    this.ws.send(JSON.stringify({ type: "input", text }));
  }

  disconnect() {
    this.ready = false;
    this.pendingInput = null;
    this.ws?.close();
    this.ws = null;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN && this.ready;
  }
}
