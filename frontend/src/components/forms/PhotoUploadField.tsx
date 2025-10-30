import { useRef } from "react"
import type { ChangeEvent, KeyboardEventHandler } from "react"

export interface PhotoPreview {
  id: string
  url: string
  fileName: string
}

export interface PhotoUploadFieldProps {
  label: string
  name: string
  previews: PhotoPreview[]
  onSelectFiles: (files: FileList | null) => void
  onRemove: (id: string) => void
  maxItems?: number
  /** Optional handler to support drag-and-drop in a future iteration */
  onDropFiles?: (files: File[]) => void
  /** Optional handler to surface upload progress in a future iteration */
  onUploadProgress?: (file: File, progress: number) => void
  helperText?: string
}

const PhotoUploadField = ({
  label,
  name,
  previews,
  onSelectFiles,
  onRemove,
  maxItems = 6,
  onDropFiles,
  onUploadProgress,
  helperText,
}: PhotoUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files?.length && onUploadProgress) {
      Array.from(files).forEach((file) => onUploadProgress(file, 0))
    }
    onSelectFiles(files)
  }

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {helperText ? (
        <span className="text-xs font-normal text-slate-500">{helperText}</span>
      ) : null}
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        onDrop={(event) => {
          event.preventDefault()
          if (onDropFiles) {
            onDropFiles(Array.from(event.dataTransfer.files))
          }
          onSelectFiles(event.dataTransfer.files)
        }}
        onDragOver={(event) => event.preventDefault()}
      >
        {previews.map((preview) => (
          <div key={preview.id} className="group relative aspect-square overflow-hidden rounded-lg border border-dashed border-slate-300">
            <img
              src={preview.url}
              alt={preview.fileName}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              className="absolute inset-0 hidden items-center justify-center bg-slate-900/70 text-xs font-semibold text-white transition group-hover:flex"
              onClick={() => onRemove(preview.id)}
            >
              Remove
            </button>
          </div>
        ))}
        {previews.length < maxItems ? (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-center text-xs font-normal text-slate-500 transition hover:border-primary hover:text-primary"
          >
            <span className="text-2xl" aria-hidden>
              +
            </span>
            <span>Add photo</span>
          </div>
        ) : null}
      </div>
      <input
        id={name}
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  )
}

export default PhotoUploadField
