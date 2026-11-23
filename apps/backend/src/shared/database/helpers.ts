import { sql } from "drizzle-orm";

/**
 * Marca de tiempo actual en segundos epoch.
 *
 * Debe coincidir con las columnas declaradas como `integer(..., { mode: "timestamp" })`:
 * en ese modo Drizzle lee/escribe segundos. Usar milisegundos aquí desplaza la
 * fecha ~1000 veces (año ~55840) y rompe cualquier orden o formato relativo.
 */
export const sqliteNowSeconds = sql`(unixepoch())`;
