import type { ReactNode } from "react";

/**
 * Tabla generica reutilizable.
 *
 * Uso:
 *   <Table
 *     data={alumnos}
 *     columns={[
 *       { header: "Nombre", cell: (item) => <span>{item.nombre}</span> },
 *       { header: "Grupo",  cell: (item) => <span>{item.grupo}</span> },
 *     ]}
 *   />
 *
 * Caracteristicas:
 *   - Generica: el tipo T se infiere de data[]
 *   - Cada columna define como renderizar su celda (cell function)
 *   - Hover en filas
 *   - Estado vacio (mensaje cuando data.length === 0)
 *   - Diseno alineado con tokens del proyecto (slate-50, slate-200, etc)
 */

export interface TableColumn<T> {
  header: string;
  cell: (item: T) => ReactNode;
  /** Alineacion del contenido. Default: "left" */
  align?: "left" | "center" | "right";
  /** Ancho de la columna (string CSS). Default: auto */
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  /** Funcion para extraer un key unico por fila. Default: usa indice. */
  getRowKey?: (item: T, index: number) => string | number;
  /** Mensaje cuando no hay datos. Default: "Sin datos" */
  emptyMessage?: string;
  /** className adicional para la tabla externa */
  className?: string;
}

export default function Table<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "Sin datos para mostrar.",
  className = "",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs"
                style={{
                  textAlign: col.align ?? "left",
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr
              key={getRowKey ? getRowKey(item, rowIdx) : rowIdx}
              className="border-b border-slate-100 transition-colors hover:bg-slate-50"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-4 py-3"
                  style={{ textAlign: col.align ?? "left" }}
                >
                  {col.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tambien named export para flexibilidad
export { Table };
