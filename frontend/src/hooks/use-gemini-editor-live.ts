"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MarkerSeverity, Range } from "monaco-editor";
import { GeminiLiveSession } from "@/lib/gemini-live";
import api, { setAuthToken } from "@/lib/api";

export type LiveVulnerability = {
  line: number;
  severity: "high" | "med" | "low";
  message: string;
};

export type GeminiAssistStatus =
  | "off"
  | "connecting"
  | "live"
  | "http"
  | "error";

type MonacoLike = {
  editor: typeof import("monaco-editor").editor;
  languages: typeof import("monaco-editor").languages;
};

type EditorLike = import("monaco-editor").editor.IStandaloneCodeEditor;
type PositionLike = import("monaco-editor").Position;

const COMPLETION_IDLE_MS = 1500;
const LINT_IDLE_MS = 900;
const LINT_MARKER_OWNER = "sentinel-gemini-lint";
const MIN_CODE_CHARS = 24;
const COMPLETION_TIMEOUT_MS = 45000;

function parseLintJson(raw: string): LiveVulnerability[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return normalizeVulns(parsed);
  } catch {
    /* try extract array */
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (Array.isArray(parsed)) return normalizeVulns(parsed);
    } catch {
      /* ignore */
    }
  }
  return [];
}

function normalizeVulns(items: unknown[]): LiveVulnerability[] {
  const out: LiveVulnerability[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const line = Number(row.line);
    const message = String(row.message ?? "").trim();
    if (!line || !message) continue;
    let severity = String(row.severity ?? "med").toLowerCase();
    if (severity === "medium") severity = "med";
    if (severity !== "high" && severity !== "low") severity = "med";
    out.push({ line, severity: severity as LiveVulnerability["severity"], message });
  }
  return out.slice(0, 12);
}

function buildCompletionPayload(
  code: string,
  position: PositionLike,
  fileName: string
): string {
  const lines = code.split("\n");
  const lineIdx = position.lineNumber - 1;
  const before = lines.slice(Math.max(0, lineIdx - 12), lineIdx + 1).join("\n");
  const after = lines.slice(lineIdx + 1, lineIdx + 6).join("\n");
  const currentLine = lines[lineIdx] ?? "";

  return `[COMPLETE]
File: ${fileName}
Cursor: line ${position.lineNumber}, column ${position.column}
Current line: ${currentLine}

--- code before cursor ---
${before}
--- code after cursor ---
${after}

Suggest the next few lines of Solidity to type at the cursor.`;
}

function buildLintPayload(code: string, fileName: string): string {
  const snippet = code.length > 12000 ? code.slice(-12000) : code;
  return `[LINT]
File: ${fileName}

\`\`\`solidity
${snippet}
\`\`\``;
}

function severityToMarker(severity: LiveVulnerability["severity"]) {
  if (severity === "high") return MarkerSeverity.Error;
  if (severity === "low") return MarkerSeverity.Hint;
  return MarkerSeverity.Warning;
}

function severityInlineClass(severity: LiveVulnerability["severity"]) {
  if (severity === "high") return "sentinel-inline-vuln-high";
  if (severity === "low") return "sentinel-inline-vuln-low";
  return "sentinel-inline-vuln-med";
}

export function useGeminiEditorLive(
  enabled: boolean,
  fileName: string
) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState<GeminiAssistStatus>("off");

  const completionSession = useRef<GeminiLiveSession | null>(null);
  const lintSession = useRef<GeminiLiveSession | null>(null);
  const useLiveRef = useRef(false);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionInflight = useRef(false);
  const lintInflight = useRef(false);
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCompletion = useRef<{
    insertText: string;
    lineNumber: number;
    column: number;
  } | null>(null);
  const lintDecorationsRef = useRef<string[]>([]);
  const editorRef = useRef<EditorLike | null>(null);
  const monacoRef = useRef<MonacoLike | null>(null);
  const disposablesRef = useRef<Array<{ dispose: () => void }>>([]);
  const listenersWiredRef = useRef(false);

  const applyLintResults = useCallback((vulns: LiveVulnerability[]) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    const markers = vulns.map((v) => ({
      severity: severityToMarker(v.severity),
      message: v.message,
      startLineNumber: v.line,
      startColumn: 1,
      endLineNumber: v.line,
      endColumn: model.getLineMaxColumn(v.line),
    }));
    monaco.editor.setModelMarkers(model, LINT_MARKER_OWNER, markers);

    const decorations = vulns.map((v) => {
      const label =
        v.severity === "high" ? "HIGH" : v.severity === "low" ? "LOW" : "MED";
      const shortMsg =
        v.message.length > 72 ? `${v.message.slice(0, 69)}…` : v.message;
      return {
        range: new Range(
          v.line,
          model.getLineMaxColumn(v.line),
          v.line,
          model.getLineMaxColumn(v.line)
        ),
        options: {
          after: {
            content: `  // ${label}: ${shortMsg}`,
            inlineClassName: severityInlineClass(v.severity),
          },
        },
      };
    });

    lintDecorationsRef.current = editor.deltaDecorations(
      lintDecorationsRef.current,
      decorations
    );
  }, []);

  const showCompletion = useCallback((insertText: string) => {
    const editor = editorRef.current;
    if (!editor || !insertText.trim()) return;

    const pos = editor.getPosition();
    if (!pos) return;

    latestCompletion.current = {
      insertText,
      lineNumber: pos.lineNumber,
      column: pos.column,
    };

    requestAnimationFrame(() => {
      editor.trigger(null, "editor.action.inlineSuggest.trigger", {});
    });
  }, []);

  const fetchCompletionHttp = useCallback(
    async (code: string, position: PositionLike) => {
      const token = await getToken();
      if (!token) return;
      setAuthToken(token);
      const res = await api.post<{ text: string }>("/gemini-editor/complete", {
        code,
        line: position.lineNumber,
        column: position.column,
        fileName,
      });
      return res.data.text;
    },
    [fileName, getToken]
  );

  const fetchLintHttp = useCallback(
    async (code: string) => {
      const token = await getToken();
      if (!token) return;
      setAuthToken(token);
      const res = await api.post<{ text: string }>("/gemini-editor/lint", {
        code,
        fileName,
      });
      return res.data.text;
    },
    [fileName, getToken]
  );

  const requestCompletion = useCallback(
    async (code: string, position: PositionLike) => {
      if (!enabled || !isSignedIn || completionInflight.current) return;
      if (code.trim().length < MIN_CODE_CHARS) return;

      completionInflight.current = true;
      latestCompletion.current = null;

      if (completionTimeout.current) clearTimeout(completionTimeout.current);
      completionTimeout.current = setTimeout(() => {
        completionInflight.current = false;
      }, COMPLETION_TIMEOUT_MS);

      try {
        let text = "";

        if (useLiveRef.current && completionSession.current?.isConnected()) {
          text = await new Promise<string>((resolve, reject) => {
            const session = completionSession.current!;
            session.setHandlers({
              onDone: (t) => resolve(t),
              onError: (m) => reject(new Error(m)),
            });
            session.sendInput(
              buildCompletionPayload(code, position, fileName)
            );
          });
        } else {
          text = (await fetchCompletionHttp(code, position)) ?? "";
        }

        const insertText = text
          .replace(/^```(?:solidity)?\n?/i, "")
          .replace(/```$/i, "")
          .trim();
        showCompletion(insertText);
      } catch (err) {
        console.warn("Gemini completion failed:", err);
      } finally {
        completionInflight.current = false;
        if (completionTimeout.current) {
          clearTimeout(completionTimeout.current);
          completionTimeout.current = null;
        }
      }
    },
    [enabled, fileName, fetchCompletionHttp, isSignedIn, showCompletion]
  );

  const requestLint = useCallback(
    async (code: string) => {
      if (!enabled || !isSignedIn || lintInflight.current) return;
      if (code.trim().length < MIN_CODE_CHARS) return;

      lintInflight.current = true;
      try {
        let text = "";

        if (useLiveRef.current && lintSession.current?.isConnected()) {
          text = await new Promise<string>((resolve, reject) => {
            const session = lintSession.current!;
            session.setHandlers({
              onDone: (t) => resolve(t),
              onError: (m) => reject(new Error(m)),
            });
            session.sendInput(buildLintPayload(code, fileName));
          });
        } else {
          text = (await fetchLintHttp(code)) ?? "";
        }

        applyLintResults(parseLintJson(text));
      } catch (err) {
        console.warn("Gemini lint failed:", err);
      } finally {
        lintInflight.current = false;
      }
    },
    [applyLintResults, enabled, fetchLintHttp, fileName, isSignedIn]
  );

  const scheduleCompletion = useCallback(
    (code: string, position: PositionLike) => {
      if (status === "off" || status === "connecting" || status === "error") {
        return;
      }
      if (completionTimer.current) clearTimeout(completionTimer.current);
      completionTimer.current = setTimeout(() => {
        requestCompletion(code, position);
      }, COMPLETION_IDLE_MS);
    },
    [requestCompletion, status]
  );

  const scheduleLint = useCallback(
    (code: string) => {
      if (status === "off" || status === "connecting" || status === "error") {
        return;
      }
      if (lintTimer.current) clearTimeout(lintTimer.current);
      lintTimer.current = setTimeout(() => {
        requestLint(code);
      }, LINT_IDLE_MS);
    },
    [requestLint, status]
  );

  const wireEditorListeners = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !enabled || !isSignedIn) return;
    if (listenersWiredRef.current) return;
    if (status !== "live" && status !== "http") return;

    listenersWiredRef.current = true;

    const provider = monaco.languages.registerInlineCompletionsProvider(
      "solidity",
      {
        provideInlineCompletions: (model, position, _context, token) => {
          const cached = latestCompletion.current;
          if (
            !cached ||
            cached.lineNumber !== position.lineNumber ||
            cached.column !== position.column
          ) {
            return { items: [] };
          }
          if (token.isCancellationRequested) return { items: [] };

          return {
            items: [
              {
                insertText: cached.insertText,
                range: new Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
              },
            ],
          };
        },
        disposeInlineCompletions: () => {},
      }
    );
    disposablesRef.current.push(provider);

    disposablesRef.current.push(
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        const pos = editor.getPosition();
        if (!model || !pos) return;
        const value = model.getValue();
        scheduleCompletion(value, pos);
        scheduleLint(value);
      })
    );

    disposablesRef.current.push(
      editor.onDidChangeCursorPosition((e) => {
        const model = editor.getModel();
        if (!model) return;
        scheduleCompletion(model.getValue(), e.position);
      })
    );

    const model = editor.getModel();
    if (model?.getValue().trim().length >= MIN_CODE_CHARS) {
      scheduleLint(model.getValue());
    }
  }, [enabled, isSignedIn, scheduleCompletion, scheduleLint, status]);

  const attachEditor = useCallback(
    (editor: EditorLike, monaco: MonacoLike) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      wireEditorListeners();
    },
    [wireEditorListeners]
  );

  const detachEditor = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [];
    listenersWiredRef.current = false;
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, LINT_MARKER_OWNER, []);
      }
      lintDecorationsRef.current = editor.deltaDecorations(
        lintDecorationsRef.current,
        []
      );
    }
    editorRef.current = null;
    monacoRef.current = null;
    lintDecorationsRef.current = [];
    latestCompletion.current = null;
  }, []);

  useEffect(() => {
    wireEditorListeners();
  }, [wireEditorListeners, status]);

  useEffect(() => {
    if (!enabled || !isLoaded) {
      setStatus("off");
      return;
    }
    if (!isSignedIn) {
      setStatus("off");
      return;
    }

    setStatus("connecting");
    const getClerkToken = () => getToken();
    const completion = new GeminiLiveSession("completion", getClerkToken);
    const lint = new GeminiLiveSession("lint", getClerkToken);
    completionSession.current = completion;
    lintSession.current = lint;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all([completion.connect(), lint.connect()]);
        if (cancelled) return;
        useLiveRef.current = true;
        setStatus("live");
        console.info("Gemini Live assist: connected");
      } catch (err) {
        if (cancelled) return;
        useLiveRef.current = false;
        setStatus("http");
        console.warn(
          "Gemini Live unavailable, using HTTP assist:",
          err instanceof Error ? err.message : err
        );
      }
    })();

    return () => {
      cancelled = true;
      useLiveRef.current = false;
      completion.disconnect();
      lint.disconnect();
      completionSession.current = null;
      lintSession.current = null;
      setStatus("off");
      if (completionTimer.current) clearTimeout(completionTimer.current);
      if (lintTimer.current) clearTimeout(lintTimer.current);
      if (completionTimeout.current) clearTimeout(completionTimeout.current);
    };
  }, [enabled, getToken, isLoaded, isSignedIn]);

  return { attachEditor, detachEditor, status };
}
