"use client"

import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { DotmSquare14 } from "@/components/ui/dotm-square-14"
import { useGeminiEditorLive } from "@/hooks/use-gemini-editor-live"

export function SolidityEditor({
  value,
  onChange,
  readOnly = false,
  highlightLines,
  enableLiveAssist = true,
  fileName = "Contract.sol",
}: {
  value: string,
  onChange?: (val: string | undefined) => void,
  readOnly?: boolean,
  highlightLines?: { removed?: number[]; added?: number[] },
  enableLiveAssist?: boolean,
  fileName?: string,
}) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const liveAssist = enableLiveAssist && !readOnly;
  const { attachEditor, detachEditor, status } = useGeminiEditorLive(
    liveAssist,
    fileName
  );

  const statusLabel =
    status === "live"
      ? "AI Live"
      : status === "http"
        ? "AI Assist"
        : status === "connecting"
          ? "AI connecting…"
          : null;

  function handleBeforeMount(monaco: any) {
    monaco.languages.register({ id: 'solidity' })

    monaco.languages.setMonarchTokensProvider('solidity', {
      keywords: [
        'pragma', 'solidity', 'contract', 'interface', 'library',
        'function', 'modifier', 'event', 'struct', 'enum', 'mapping',
        'address', 'uint256', 'uint', 'int', 'bool', 'bytes', 'string',
        'public', 'private', 'internal', 'external', 'view', 'pure',
        'payable', 'returns', 'memory', 'storage', 'calldata',
        'if', 'else', 'for', 'while', 'return', 'emit', 'require',
        'import', 'is', 'new', 'delete', 'this', 'super', 'override',
        'virtual', 'constructor', 'fallback', 'receive', 'indexed'
      ],
      tokenizer: {
        root: [
          [/(contract|interface|library)(\s+)([a-zA-Z_]\w*)/, ['keyword', '', 'entity.name.type']],
          [/(function)(\s+)([a-zA-Z_]\w*)/, ['keyword', '', 'entity.name.function']],
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/".*?"/, 'string'],
          [/\d+/, 'number'],
          [/[{}()\[\]]/, 'delimiter'],
          [/[<>!&|=+\-*\/^%]/, 'operator'],
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment']
        ]
      }
    })

    monaco.editor.defineTheme('sentinel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c8ff00' },
        { token: 'entity.name.type', foreground: '00E5FF' },
        { token: 'entity.name.function', foreground: '00E5FF' },
        { token: 'comment', foreground: '555555' },
        { token: 'string', foreground: 'ff9d4d' },
        { token: 'number', foreground: 'f0a500' },
        { token: 'identifier', foreground: 'c8c8c8' },
        { token: 'delimiter', foreground: 'ffffff' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#c8c8c8',
        'editorLineNumber.foreground': '#333333',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editorCursor.foreground': '#c8ff00',
        'editor.selectionBackground': '#c8ff0033',
        'editor.selectionHighlightBackground': '#c8ff0011',
        'editorGhostText.foreground': '#5a5a5a',
        'editorGhostText.background': '#00000000',
      }
    })
  }

  function handleMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (liveAssist) {
      attachEditor(editor, monaco);
    }
  }

  useEffect(() => {
    return () => {
      detachEditor();
    };
  }, [detachEditor]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const newDecorations: any[] = [];

    if (highlightLines?.removed) {
      highlightLines.removed.forEach((lineNum) => {
        if (lineNum > 0) {
          newDecorations.push({
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              className: 'diff-removed-line',
              glyphMarginClassName: 'diff-removed-glyph'
            }
          });
        }
      });
    }

    if (highlightLines?.added) {
      highlightLines.added.forEach((lineNum) => {
        if (lineNum > 0) {
          newDecorations.push({
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              className: 'diff-added-line',
              glyphMarginClassName: 'diff-added-glyph'
            }
          });
        }
      });
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [highlightLines, value]);

  return (
    <div className="relative h-full w-full">
      {/* {liveAssist && statusLabel && (
        <div
          className="pointer-events-none absolute right-3 top-2 z-10 rounded-none border border-wireframe bg-[#0a0a0a]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon-cyan"
          title="Pause typing ~1.5s for ghost completions; lint updates while you type"
        >
          {statusLabel}
        </div>
      )} */}
      <Editor
        height="100%"
        language="solidity"
        theme="sentinel-dark"
        value={value}
        onChange={onChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-[#050505]">
            <DotmSquare14
              size={30}
              color="#c8ff00"
              speed={1.5}
              bloom
            />
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: 'var(--font-mono), JetBrains Mono, Fira Code, monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          padding: { top: 16 },
          readOnly: readOnly,
          quickSuggestions: false,
          wordBasedSuggestions: 'off',
          inlineSuggest: {
            enabled: liveAssist && (status === 'live' || status === 'http'),
            mode: 'subwordSmart',
            showToolbar: 'never',
          },
          suggestOnTriggerCharacters: false,
        }}
      />
    </div>
  )
}
