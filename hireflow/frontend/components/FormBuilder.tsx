'use client'
import { useState } from 'react'
import { FormField, FieldType, FieldOption } from '@/types'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { generateFieldId } from '@/lib/utils'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'file', label: 'File upload' },
  { value: 'range', label: 'Range slider' },
]

const NEEDS_OPTIONS: FieldType[] = ['select', 'radio', 'checkbox']
const NEEDS_RANGE: FieldType[] = ['range']

interface Props {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}

export default function FormBuilder({ fields, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  function addField() {
    const newField: FormField = {
      id: generateFieldId(),
      label: 'New field',
      field_type: 'text',
      required: false,
    }
    onChange([...fields, newField])
    setExpanded(newField.id)
  }

  function removeField(id: string) {
    onChange(fields.filter(f => f.id !== id))
    if (expanded === id) setExpanded(null)
  }

  function updateField(id: string, patch: Partial<FormField>) {
    onChange(fields.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = [...fields]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  function addOption(field: FormField) {
    const opts = field.options ?? []
    updateField(field.id, {
      options: [...opts, { label: `Option ${opts.length + 1}`, value: `option_${opts.length + 1}` }],
    })
  }

  function updateOption(field: FormField, idx: number, patch: Partial<FieldOption>) {
    const opts = (field.options ?? []).map((o, i) =>
      i === idx ? { ...o, ...patch, value: patch.label ? patch.label.toLowerCase().replace(/\s+/g, '_') : o.value } : o
    )
    updateField(field.id, { options: opts })
  }

  function removeOption(field: FormField, idx: number) {
    updateField(field.id, { options: (field.options ?? []).filter((_, i) => i !== idx) })
  }

  return (
    <div>
      {/* Fixed CV field indicator */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
        <GripVertical className="w-4 h-4 text-slate-300" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">CV / Document upload</p>
          <p className="text-xs text-slate-400 font-mono">Always included · Required · PDF, DOCX, and more</p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-0.5 rounded">fixed</span>
      </div>

      {/* Custom fields */}
      <div className="space-y-2 mb-4">
        {fields.map((field, idx) => (
          <div key={field.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            {/* Field header */}
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{field.label || 'Untitled field'}</p>
                <p className="text-xs text-slate-400 font-mono">{FIELD_TYPES.find(t => t.value === field.field_type)?.label} {field.required ? '· required' : '· optional'}</p>
              </div>
              <button
                onClick={() => setExpanded(expanded === field.id ? null : field.id)}
                className="btn-ghost text-xs px-2 py-1"
              >
                {expanded === field.id ? 'Done' : 'Edit'}
              </button>
              <button onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded editor */}
            {expanded === field.id && (
              <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Field label</label>
                    <input className="field" value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Field type</label>
                    <select className="field" value={field.field_type}
                      onChange={e => updateField(field.id, { field_type: e.target.value as FieldType, options: undefined })}>
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {['text','textarea','email','phone','number'].includes(field.field_type) && (
                  <div>
                    <label className="label">Placeholder text</label>
                    <input className="field" value={field.placeholder ?? ''}
                      onChange={e => updateField(field.id, { placeholder: e.target.value })} />
                  </div>
                )}

                {NEEDS_RANGE.includes(field.field_type) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Min value</label>
                      <input type="number" className="field" value={field.min_value ?? 0}
                        onChange={e => updateField(field.id, { min_value: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Max value</label>
                      <input type="number" className="field" value={field.max_value ?? 100}
                        onChange={e => updateField(field.id, { max_value: Number(e.target.value) })} />
                    </div>
                  </div>
                )}

                {NEEDS_OPTIONS.includes(field.field_type) && (
                  <div>
                    <label className="label">Options</label>
                    <div className="space-y-2">
                      {(field.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input className="field flex-1" value={opt.label}
                            onChange={e => updateOption(field, oi, { label: e.target.value })} placeholder={`Option ${oi + 1}`} />
                          <button onClick={() => removeOption(field, oi)} className="text-slate-300 hover:text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(field)} className="btn-ghost text-xs">+ Add option</button>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded accent-ink" />
                  <span className="text-sm">Required field</span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addField} className="btn-secondary w-full text-sm">
        <Plus className="w-4 h-4" /> Add field
      </button>
    </div>
  )
}
