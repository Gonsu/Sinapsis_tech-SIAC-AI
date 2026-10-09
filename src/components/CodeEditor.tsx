import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Check, Copy, Upload } from 'lucide-react'
import { LANGUAGE_EXTENSIONS } from '../../shared/evaluation.ts'

interface CodeEditorProps {
  code: string
  setCode: (value: string) => void
  language: string
  fileName: string
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void
}

export function CodeEditor({ code, setCode, language, fileName, onFileUpload }: CodeEditorProps) {
  const lineCount = Math.max(code.split('\n').length, 12)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Silently fail if clipboard API is not available
    }
  }

  const extensions = LANGUAGE_EXTENSIONS[language] ?? []

  return (
    <div className="code-editor">
      <div className="editor-toolbar">
        <div className="editor-window-controls">
          <span className="window-dot dot-red" />
          <span className="window-dot dot-yellow" />
          <span className="window-dot dot-green" />
          <span className="editor-file-name">{fileName}</span>
        </div>

        <div className="editor-toolbar-actions">
          <button type="button" className="editor-action" onClick={handleCopy} disabled={!code}>
            {copied ? (
              <>
                <Check size={13} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={13} />
                Copiar
              </>
            )}
          </button>
          <button type="button" className="editor-action" onClick={() => fileInputRef.current?.click()}>
            <Upload size={13} />
            Cargar archivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={extensions.join(',')}
            className="hidden"
            onChange={onFileUpload}
          />
          <span className="editor-language-tag">{language}</span>
        </div>
      </div>

      <div className="editor-body">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          aria-label="Editor de código"
          placeholder="# Escribe aquí tu solución..."
          className="code-textarea"
        />
      </div>
    </div>
  )
}
