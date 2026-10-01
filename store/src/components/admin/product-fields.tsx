const CATEGORIES = ["obsidiana", "textil", "cuero", "minerales", "recuerdos", "ropa", "sombreros"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  obsidiana: "Obsidiana",
  textil: "Textil",
  cuero: "Cuero",
  minerales: "Minerales",
  recuerdos: "Recuerdos",
  ropa: "Ropa",
  sombreros: "Sombreros",
};

export type ProductDefaults = {
  nameEs?: string;
  nameEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  origin?: string | null;
  category?: string;
  kind?: string;
  priceMxn?: number;
  weightG?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  fragile?: boolean;
};

const inputClass = "rounded-md border border-stone-300 px-3 py-2 text-sm";
const labelClass = "flex flex-col gap-1 text-sm";

/** Campos de producto compartidos entre el form de creación y el de edición. */
export function ProductFields({ defaults = {} }: { defaults?: ProductDefaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>
        <span>Nombre (ES)</span>
        <input name="nameEs" required defaultValue={defaults.nameEs} className={inputClass} />
      </label>
      <label className={labelClass}>
        <span>Nombre (EN)</span>
        <input name="nameEn" required defaultValue={defaults.nameEn} className={inputClass} />
      </label>

      <label className={`${labelClass} sm:col-span-2`}>
        <span>Descripción (ES)</span>
        <textarea name="descriptionEs" defaultValue={defaults.descriptionEs} rows={3} className={inputClass} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        <span>Descripción (EN)</span>
        <textarea name="descriptionEn" defaultValue={defaults.descriptionEn} rows={3} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span>Categoría</span>
        <select name="category" required defaultValue={defaults.category ?? "obsidiana"} className={inputClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        <span>Tipo</span>
        <select name="kind" required defaultValue={defaults.kind ?? "standard"} className={inputClass}>
          <option value="standard">Repetible (se repone)</option>
          <option value="unique">Pieza única (drop)</option>
        </select>
      </label>

      <label className={labelClass}>
        <span>Precio (MXN)</span>
        <input
          name="priceMxn"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaults.priceMxn}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>Origen (taller/artesano, opcional)</span>
        <input name="origin" defaultValue={defaults.origin ?? ""} className={inputClass} />
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium text-[var(--obsidian)]">
          Peso y dimensiones (para calcular envío)
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className={labelClass}>
            <span>Peso (g)</span>
            <input name="weightG" type="number" min="1" required defaultValue={defaults.weightG} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span>Largo (mm)</span>
            <input name="lengthMm" type="number" min="1" required defaultValue={defaults.lengthMm} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span>Ancho (mm)</span>
            <input name="widthMm" type="number" min="1" required defaultValue={defaults.widthMm} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span>Alto (mm)</span>
            <input name="heightMm" type="number" min="1" required defaultValue={defaults.heightMm} className={inputClass} />
          </label>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input name="fragile" type="checkbox" value="true" defaultChecked={defaults.fragile} />
        Frágil (empaque reforzado en envío)
      </label>
    </div>
  );
}
