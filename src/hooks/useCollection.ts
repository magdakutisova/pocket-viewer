import exportText from "../data/pocket.csv?raw";
import { parseExport, type ParsedExport } from "../import/parseExport";

let collection: ParsedExport | undefined;

/**
 * The bundled Pocket export, parsed once and held in memory.
 *
 * This is the seam the collection later arrives through from Supabase; the
 * screens above it do not know where it came from.
 */
export function useCollection(): ParsedExport {
    collection ??= parseExport(exportText);

    return collection;
}
