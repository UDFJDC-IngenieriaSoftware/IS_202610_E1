/**
 * Molécula SearchInput — campo de búsqueda con icono y atajo de teclado.
 */
import { Icon } from '../atoms/Icon'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  kbd?: string       // atajo a mostrar, p. ej. "⌘K"
  inline?: boolean   // variante compacta (.search--inline)
  id?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  kbd,
  inline = false,
  id,
}: SearchInputProps) {
  return (
    <div className={`search${inline ? ' search--inline' : ''}`}>
      <Icon name="search" size={16} />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {kbd && <kbd>{kbd}</kbd>}
    </div>
  )
}
