"use client"

import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { DotmSquare14 } from "@/components/ui/dotm-square-14"

export function SolidityEditor({ 
  value, 
  onChange, 
  readOnly = false,
  highlightLines
}: { 
  value: string, 
  onChange?: (val: string | undefined) => void, 
  readOnly?: boolean,
  highlightLines?: { removed?: number[]; added?: number[] }
}) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  function handleBeforeMount(monaco: any) {
    // Register Solidity as a language
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

    // Define the dark theme matching SENTINEL_OS design
    monaco.editor.defineTheme('sentinel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c8ff00' }, // lime green
        { token: 'entity.name.type', foreground: '00E5FF' }, // tertiary cyan
        { token: 'entity.name.function', foreground: '00E5FF' }, // tertiary cyan
        { token: 'comment', foreground: '555555' },
        { token: 'string', foreground: 'ff9d4d' },  // brighter warm orange — readable, distinct from cyan and green        { token: 'number', foreground: 'f0a500' },  // amber — warm, distinct, not in your palette so it stands out        { token: 'identifier', foreground: 'c8c8c8' },
        { token: 'delimiter', foreground: 'ffffff' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#c8c8c8',
        'editorLineNumber.foreground': '#333333',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editorCursor.foreground': '#c8ff00',
        'editor.selectionBackground': '#c8ff0033', // Neon green with low opacity
        'editor.selectionHighlightBackground': '#c8ff0011',
      }
    })
  }

  function handleMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

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
        glyphMargin: true,   // needed for vulnerability markers in gutter
        folding: true,
        padding: { top: 16 },
        readOnly: readOnly
      }}
    />
  )
}
