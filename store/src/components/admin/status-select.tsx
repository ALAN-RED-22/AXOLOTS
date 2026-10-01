"use client";

type Status = "draft" | "active" | "archived";

/** Pequeño componente cliente solo porque un <select> que se auto-envía al
 * cambiar necesita `onChange` — el resto del panel es Server Components. */
export function StatusSelect({
  defaultValue,
  onChangeAction,
}: {
  defaultValue: Status;
  onChangeAction: (status: Status) => void | Promise<void>;
}) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => onChangeAction(e.currentTarget.value as Status)}
      className="rounded-md border border-stone-300 px-3 py-2 text-sm"
    >
      <option value="draft">Borrador</option>
      <option value="active">Activo (visible en /tienda)</option>
      <option value="archived">Archivado</option>
    </select>
  );
}
