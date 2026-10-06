export function Avatar({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span className={`avatar ${small ? 'small' : ''}`} aria-hidden="true">
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}
