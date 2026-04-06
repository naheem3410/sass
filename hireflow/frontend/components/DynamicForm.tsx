'use client'
import { FormField } from '@/types'

interface Props {
  fields: FormField[]
  values: Record<string, unknown>
  onChange: (id: string, value: unknown) => void
  disabled?: boolean
}

export default function DynamicForm({ fields, values, onChange, disabled }: Props) {
  if (fields.length === 0) return null

  return (
    <div className="space-y-5">
      {fields.map(field => (
        <div key={field.id}>
          <label className="label">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <FieldInput field={field} value={values[field.id]} onChange={v => onChange(field.id, v)} disabled={disabled} />
        </div>
      ))}
    </div>
  )
}

function FieldInput({ field, value, onChange, disabled }: {
  field: FormField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}) {
  const base = `field ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`

  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <input
          type={field.field_type === 'phone' ? 'tel' : field.field_type}
          className={base}
          placeholder={field.placeholder ?? ''}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
          maxLength={field.max_length}
        />
      )

    case 'textarea':
      return (
        <textarea
          className={`${base} min-h-[100px] resize-y`}
          placeholder={field.placeholder ?? ''}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
          maxLength={field.max_length}
        />
      )

    case 'date':
      return (
        <input type="date" className={base}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
        />
      )

    case 'select':
      return (
        <select className={base}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
        >
          <option value="">Select an option…</option>
          {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={field.id}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                required={field.required}
                disabled={disabled}
                className="accent-ink"
              />
              <span className="text-sm text-slate-700 group-hover:text-ink">{o.label}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox': {
      const checked = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="space-y-2">
          {field.options?.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked.includes(o.value)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...checked, o.value]
                    : checked.filter(v => v !== o.value)
                  onChange(next)
                }}
                disabled={disabled}
                className="accent-ink"
              />
              <span className="text-sm text-slate-700 group-hover:text-ink">{o.label}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'boolean':
      return (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            required={field.required}
            disabled={disabled}
            className="accent-ink"
          />
          <span className="text-sm text-slate-700">Yes</span>
        </label>
      )

    case 'range':
      return (
        <div>
          <input
            type="range"
            className="w-full accent-ink"
            min={field.min_value ?? 0}
            max={field.max_value ?? 100}
            value={(value as number) ?? field.min_value ?? 0}
            onChange={e => onChange(Number(e.target.value))}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
            <span>{field.min_value ?? 0}</span>
            <span className="font-medium text-ink">{(value as number) ?? field.min_value ?? 0}</span>
            <span>{field.max_value ?? 100}</span>
          </div>
        </div>
      )

    case 'file':
      return (
        <input type="file" className={`${base} py-2`}
          onChange={e => onChange(e.target.files?.[0] ?? null)}
          required={field.required}
          disabled={disabled}
        />
      )

    default:
      return null
  }
}
