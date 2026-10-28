import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MAX_SAVE_NAME } from '../lib/saves'
import { Dialog } from './Layout'

/** Fenêtre qui demande le nom d'une sauvegarde (création ou renommage). */
export default function SaveDialog({
  initialName,
  title,
  children,
  onSave,
  onCancel,
}: {
  initialName: string
  title: string
  children: ReactNode
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <Dialog
      title={initialName ? 'Renommer la sauvegarde' : title}
      confirmLabel="Enregistrer"
      confirmDisabled={!name.trim()}
      onCancel={onCancel}
      onConfirm={() => onSave(name)}
    >
      <p>{children}</p>
      <label className="field">
        <span>Nom de la sauvegarde</span>
        <input
          ref={inputRef}
          type="text"
          value={name}
          maxLength={MAX_SAVE_NAME}
          placeholder="Ex. : Camille, soirée du 28"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
    </Dialog>
  )
}
