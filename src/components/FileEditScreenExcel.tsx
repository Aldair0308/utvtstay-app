import React, {
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, Text, ScrollView, StyleSheet, TextInput } from "react-native";
import * as XLSX from "xlsx";
// Cargar soporte de codepages para .xls antiguos y texto en distintos encodings
import * as cpexcel from "xlsx/dist/cpexcel";

// Configurar cptable para que SheetJS pueda usar los codepages de Excel
if (typeof XLSX.set_cptable === "function") {
  XLSX.set_cptable(cpexcel);
}

const DEFAULT_COL_WIDTH = 120;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 320;

type EditorContentPayload = {
  content: string; // base64 del XLSX
  mime_type: string;
};

export type ExcelEditorHandle = {
  getWorkbookBase64: () => { base64: string; sheetName: string } | null;
  getWorkbookDataJson: () => { data: any; sheetName: string } | null;
};

type Props = {
  editorContent: EditorContentPayload;
  initialDataJson?: any;
  onChange?: () => void;
  style?: any;
  readOnly?: boolean;
};

// Limpia y normaliza el base64 (quita prefijos data:, espacios, URL-safe y corrige padding)
function sanitizeBase64Input(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.trim();
  const commaIndex = s.indexOf(",");
  if (s.startsWith("data:") && commaIndex !== -1) {
    s = s.slice(commaIndex + 1);
  }
  s = s.replace(/\s+/g, "");
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  s = s.replace(/[^A-Za-z0-9+/=]/g, "");
  const pad = s.length % 4;
  if (pad !== 0) s += "=".repeat(4 - pad);
  return s;
}

// Decodifica base64 a bytes (Uint8Array) sin depender de atob/Buffer
function decodeBase64ToBytes(b64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const map: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) map[chars[i]] = i;
  const cleaned = sanitizeBase64Input(b64);
  const out: number[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = cleaned[i];
    const b = cleaned[i + 1];
    const c = cleaned[i + 2];
    const d = cleaned[i + 3];
    const c1 = map[a];
    const c2 = map[b];
    const c3 = c === "=" ? 0 : map[c];
    const c4 = d === "=" ? 0 : map[d];
    const b1 = (c1 << 2) | (c2 >> 4);
    out.push(b1 & 0xff);
    if (c !== "=") {
      const b2 = ((c2 & 0x0f) << 4) | (c3 >> 2);
      out.push(b2 & 0xff);
    }
    if (d !== "=") {
      const b3 = ((c3 & 0x03) << 6) | c4;
      out.push(b3 & 0xff);
    }
  }
  return new Uint8Array(out);
}

// Heurística para detectar si el contenido parece base64 en lugar de cadena binaria
function isProbablyBase64(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  if (raw.startsWith("data:")) return true;
  const cleaned = raw.replace(/\s+/g, "");
  if (cleaned.length < 128) return false; // muy corto para un XLSX real
  const invalid = cleaned.replace(/[A-Za-z0-9+/=]/g, "");
  const invalidRatio = invalid.length / cleaned.length;
  return invalidRatio < 0.02 && cleaned.length % 4 === 0;
}

const ExcelEditor = forwardRef<ExcelEditorHandle, Props>(function ExcelEditor(
  { editorContent, initialDataJson, onChange, style, readOnly = false },
  ref
) {
  const isExcel =
    !!initialDataJson ||
    editorContent?.mime_type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    editorContent?.mime_type === "application/vnd.ms-excel";

  // Función para detectar y corregir mojibake específico de Windows-1252 a UTF-8
  const fixMojibake = (text: string): string => {
    if (!text || typeof text !== "string") return text;

    // Patrones comunes de mojibake español -> hebreo/chino
    const mojibakePatterns: [RegExp, string][] = [
      // ó -> ֎ (Windows-1252 ó (0xF3) mal interpretado como UTF-8)
      [/֎/g, "ó"],
      // á -> ֳ (Windows-1252 á (0xE1) mal interpretado como UTF-8)
      [/ֳ/g, "á"],
      // é -> ֱ (Windows-1252 é (0xE9) mal interpretado como UTF-8)
      [/ֱ/g, "é"],
      // í -> ֲ (Windows-1252 í (0xED) mal interpretado como UTF-8)
      [/ֲ/g, "í"],
      // ú -> ֻ (Windows-1252 ú (0xFA) mal interpretado como UTF-8)
      [/ֻ/g, "ú"],
      // ñ -> ֲ± (Windows-1252 ñ (0xF1) mal interpretado como UTF-8)
      [/ֲ±/g, "ñ"],
      // ü -> ֲ¼ (Windows-1252 ü (0xFC) mal interpretado como UTF-8)
      [/ֲ¼/g, "ü"],
      // é -> 鸩 (Windows-1252 é (0xE9) mal interpretado como UTF-8 - caso "méxico")
      // Este es un caso especial porque 鸩 consume 3 bytes y puede afectar caracteres siguientes
      [/鸩/g, "é"],
      // ó -> 󮼯 (Windows-1252 ó (0xF3) mal interpretado como UTF-8 - caso "Dirección")
      [/󮼯/g, "ó"],
      // Ö -> Ó (Windows-1252 Ö (0xD6) mal interpretado como UTF-8 - caso "EVALUACIÖN")
      [/Ö/g, "Ó"],
      // é -> 鸮 (Windows-1252 é (0xE9) mal interpretado como UTF-8 - caso "Méx.")
      [/鸮/g, "é"],
      // Limpiar fragmentos HTML/XML que puedan colarse de otras celdas
      [/td>/g, ""], // Eliminar etiquetas HTML
      [/<\/?[a-z][^>]*>/gi, ""], // Eliminar cualquier etiqueta HTML completa
    ];

    // Primero corregir el caso especial de 鸩 que puede estar afectando caracteres adyacentes
    let fixed = text;

    // Buscar y corregir secuencias donde 鸩 aparece y podría haber afectado caracteres siguientes
    const specialMojibakePatterns = [
      // Patrón para "m鸩co" -> "méxico" (鸩 consume 3 bytes, afectando la 'x')
      { pattern: /m鸩co/g, replacement: "méxico" },
      // Patrón para "M鸩co" -> "México" (caso con mayúscula)
      { pattern: /M鸩co/g, replacement: "México" },
      // Patrón para "m鸩" -> "mé" (caso general)
      { pattern: /m鸩/g, replacement: "mé" },
      // Patrón para "M鸩" -> "Mé" (caso general con mayúscula)
      { pattern: /M鸩/g, replacement: "Mé" },
      // Patrón para "Direcci󮼯" -> "Dirección"
      { pattern: /Direcci󮼯/g, replacement: "Dirección" },
      // Patrón para "cci󮼯" -> "cción" (caso general)
      { pattern: /cci󮼯/g, replacement: "cción" },
      // Patrón específico para "InterWare Méco" -> "InterWare México"
      { pattern: /InterWare Méco/g, replacement: "InterWare México" },
      // Patrón general para "Méco" -> "México"
      { pattern: /Méco/g, replacement: "México" },
      // Patrón específico para "EVALUACIÖN" -> "EVALUACIÓN" (corrección de Ö -> Ó)
      { pattern: /EVALUACIÖN/g, replacement: "EVALUACIÓN" },
      // Patrón general para "CIÖN" -> "CIÓN" (corrección de Ö -> Ó)
      { pattern: /CIÖN/g, replacement: "CIÓN" },
      // Patrón específico para "M鸮" -> "Méx." (caso "Méx." -> "M鸮")
      { pattern: /M鸮/g, replacement: "Méx." },
    ];

    for (const { pattern, replacement } of specialMojibakePatterns) {
      fixed = fixed.replace(pattern, replacement);
    }

    // Luego aplicar las correcciones generales
    for (const [pattern, replacement] of mojibakePatterns) {
      fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
  };

  // Función para detectar y corregir concatenaciones no deseadas entre celdas
  const fixCellConcatenation = (text: string): string => {
    if (!text || typeof text !== "string") return text;

    // Patrones de concatenación común donde palabras se unen sin espacio
    const concatenationPatterns: [RegExp, string][] = [
      // Detectar cuando "ción" se une con una palabra que empieza con letra mayúscula
      [/([a-záéíóúñ])ción([A-Z])/g, "$1ción $2"],
      // Detectar cuando "ción" se une con letras/dígitos (caso "DirecciónDSM")
      [/([a-záéíóúñ])ción(\d*[A-Za-z])/g, "$1ción $2"],
      // Caso general: cuando una palabra termina en minúscula y sigue mayúscula sin espacio
      [/([a-záéíóúñ])([A-Z])/g, "$1 $2"],
      // Cuando una palabra termina en letra y sigue un número sin espacio
      [/([a-zA-Záéíóúñ])(\d)/g, "$1 $2"],
      // Cuando un número sigue a una letra sin espacio
      [/(\d)([a-zA-Záéíóúñ])/g, "$1 $2"],
    ];

    let fixed = text;
    for (const [pattern, replacement] of concatenationPatterns) {
      fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
  };

  const tableData = useMemo(() => {
    if (!isExcel) return null;

    if (initialDataJson) {
      try {
        const payload = initialDataJson;
        const sheets = Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload)
          ? payload
          : payload?.sheets || null;

        const sheet = sheets && sheets.length ? sheets[0] : payload;
        const sheetName: string = sheet?.name || "Sheet1";
        const declaredRaw: number =
          Number(sheet?.cols?.len) || Number(sheet?.cols?.count) || 0;
        const declaredColsLen: number = Math.max(
          0,
          Math.min(Number.isFinite(declaredRaw) ? declaredRaw : 0, 256)
        );

        const rowsObj = sheet?.rows || {};
        const rowKeys = Object.keys(rowsObj);
        const maxRowIndex = rowKeys
          .map((k) => Number(k))
          .filter((n) => !isNaN(n))
          .reduce((m, n) => Math.max(m, n), -1);

        let maxCols = declaredColsLen || 0;
        const grid: string[][] = [];

        for (let ri = 0; ri <= Math.max(maxRowIndex, 0); ri++) {
          const rowEntry = rowsObj?.[String(ri)] || {};
          const cellsEntry = rowEntry?.cells;
          let rowArr: string[] = [];

          if (Array.isArray(cellsEntry)) {
            rowArr = cellsEntry.map((cell: any, idx: number) => {
              const text = cell?.text ?? "";
              let t = String(text);
              t = fixMojibake(t);
              t = fixCellConcatenation(t);
              return t;
            });
            maxCols = Math.max(maxCols, rowArr.length);
          } else if (cellsEntry && typeof cellsEntry === "object") {
            const numericCols = Object.keys(cellsEntry)
              .map((k) => Number(k))
              .filter((n) => !isNaN(n))
              .sort((a, b) => a - b);
            const rowMaxCol = numericCols.length
              ? numericCols[numericCols.length - 1]
              : -1;
            const colsCount = Math.max(rowMaxCol + 1, declaredColsLen || 0);
            rowArr = new Array(colsCount).fill("");
            for (const ci of numericCols) {
              const text = (cellsEntry as any)[String(ci)]?.text ?? "";
              let t = String(text);
              t = fixMojibake(t);
              t = fixCellConcatenation(t);
              if (!isNaN(ci)) rowArr[ci] = t;
            }
            maxCols = Math.max(maxCols, rowArr.length);
          } else {
            rowArr = new Array(Math.max(declaredColsLen, 1)).fill("");
            maxCols = Math.max(maxCols, rowArr.length);
          }

          grid.push(rowArr);
        }

        let colWidths: number[] = [];
        const colsDef = sheet?.cols || {};
        const widthsArr = Array.isArray(colsDef?.widths)
          ? colsDef.widths
          : Array.isArray(colsDef?.items)
          ? colsDef.items.map((it: any) => Number(it?.width) || DEFAULT_COL_WIDTH)
          : null;

        if (widthsArr && widthsArr.length) {
          colWidths = widthsArr.map((w: any) => Number(w) || DEFAULT_COL_WIDTH);
        } else if (colsDef && typeof colsDef === "object") {
          const numericKeys = Object.keys(colsDef)
            .map((k) => Number(k))
            .filter((n) => !isNaN(n));
          if (numericKeys.length) {
            const maxKey = numericKeys.reduce((m, n) => Math.max(m, n), -1);
            colWidths = new Array(Math.max(maxKey + 1, maxCols || 1)).fill(
              DEFAULT_COL_WIDTH
            );
            for (const k of Object.keys(colsDef)) {
              const idx = Number(k);
              const widthVal = Number((colsDef as any)[k]?.width);
              if (!isNaN(idx) && !isNaN(widthVal) && widthVal > 0) {
                colWidths[idx] = widthVal;
              }
            }
          }
        }

        const cols = maxCols;
        if (!colWidths || !colWidths.length) {
          colWidths = autoWidths(grid, colWidths);
        }

        return { rows: grid, cols, sheetName, colWidths };
      } catch (e) {
        console.warn("[FileEditScreenExcel] Error parseando JSON de Excel:", e);
        return null;
      }
    }

    const rawContent = editorContent?.content || "";
    const treatAsBase64 = isProbablyBase64(rawContent);
    try {
      let wb: XLSX.WorkBook | null = null;
      if (treatAsBase64) {
        const cleaned = sanitizeBase64Input(rawContent);
        if (!cleaned || cleaned.length < 128) return null;
        try {
          const bytes = decodeBase64ToBytes(cleaned);
          wb = XLSX.read(bytes, {
            type: "array",
            cellText: false,
            cellDates: true,
          });
        } catch (e0) {
          console.warn(
            "[FileEditScreenExcel] Fallback array reading failed:",
            e0
          );
          return null;
        }
      } else {
        try {
          const s = rawContent || "";
          const len = s.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = s.charCodeAt(i) & 0xff;
          wb = XLSX.read(bytes, {
            type: "array",
            cellText: false,
            cellDates: true,
          });
        } catch (e1) {
          console.warn(
            "[FileEditScreenExcel] Binary to array conversion failed:",
            e1
          );
          return null;
        }
      }

      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(ws, {
        FS: ",",
        RS: "\n",
        blankrows: false,
        skipHidden: true,
      });

      const aoa: any[][] = [];
      const lines = csv.split("\n");
      for (const line of lines) {
        if (line.trim() === "") continue;
        const cells = line.split(",").map((cell) => {
          let value = cell.trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          return value === "" ? null : value;
        });
        aoa.push(cells);
      }

      const rows = aoa.map((row) =>
        row.map((cell) => {
          if (cell === undefined || cell === null) return "";
          let cellText = String(cell);
          cellText = fixMojibake(cellText);
          cellText = fixCellConcatenation(cellText);
          return cellText;
        })
      );

      const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
      const colWidths = autoWidths(rows, []);
      return { rows, cols, sheetName, colWidths };
    } catch (e) {
      console.warn("[FileEditScreenExcel] Error parseando XLSX:", e);
      return null;
    }
  }, [isExcel, editorContent?.content, initialDataJson]);

  const [grid, setGrid] = useState<string[][]>(tableData?.rows || []);
  const [cols, setCols] = useState<number>(tableData?.cols || 0);
  const [colWidths, setColWidths] = useState<number[]>(tableData?.colWidths || []);
  const [sheetName, setSheetName] = useState<string>(
    tableData?.sheetName || "Sheet1"
  );

  // Actualiza estado cuando tableData cambia (p.ej. nueva carga)
  React.useEffect(() => {
    if (tableData) {
      setGrid(tableData.rows);
      setCols(tableData.cols);
      setColWidths(tableData.colWidths || []);
      setSheetName(tableData.sheetName);
    }
  }, [tableData?.rows, tableData?.cols, tableData?.sheetName]);

  useImperativeHandle(
    ref,
    () => ({
      getWorkbookBase64: () => {
        try {
          const aoa = grid && grid.length ? grid : [[]];
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
          const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
          return { base64: b64, sheetName: sheetName || "Sheet1" };
        } catch (e) {
          console.warn("[FileEditScreenExcel] Error serializando XLSX:", e);
          return null;
        }
      },
      getWorkbookDataJson: () => {
        try {
          const currentGrid = grid && grid.length ? grid : [[]];
          const maxCols = currentGrid.reduce(
            (m, r) => Math.max(m, r.length),
            0
          );

          const rowsObj: Record<string, any> = {};
          currentGrid.forEach((row, ri) => {
            const cells: Record<string, any> = {};
            for (let ci = 0; ci < maxCols; ci++) {
              const text = row?.[ci] ?? "";
              cells[String(ci)] = { text };
            }
            rowsObj[String(ri)] = { cells };
          });

          const widths = colWidths && colWidths.length
            ? colWidths
            : new Array(Math.max(maxCols, 1)).fill(DEFAULT_COL_WIDTH);

          const data = {
            name: sheetName || "Sheet1",
            freeze: "A1",
            styles: [],
            merges: [],
            rows: rowsObj,
            cols: { len: maxCols, widths },
          };

          return { data, sheetName: sheetName || "Sheet1" };
        } catch (e) {
          console.warn(
            "[FileEditScreenExcel] Error generando JSON estructurado:",
            e
          );
          return null;
        }
      },
    }),
    [grid, sheetName]
  );

  if (!isExcel) {
    return (
      <View style={styles.containerMsg}>
        <Text style={styles.msg}>Tipo de archivo no compatible</Text>
      </View>
    );
  }

  if (!tableData) {
    return (
      <View style={styles.containerMsg}>
        <Text style={styles.msg}>No se pudo leer el contenido del Excel</Text>
        {/* Mostrar el cuerpo de la respuesta del endpoint si está disponible */}
        <Text style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
          {initialDataJson
            ? `JSON recibido: ${JSON.stringify(initialDataJson).slice(0, 1000)}`
            : typeof editorContent?.content === "string" &&
              editorContent?.content?.length === 0
            ? "Respuesta vacía del endpoint."
            : `Cuerpo recibido: ${JSON.stringify(editorContent?.content).slice(0, 1000)}`}
        </Text>
      </View>
    );
  }
  const rows = grid;

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.header}>
        Hoja: {sheetName} · Filas: {rows.length} · Columnas: {cols}
      </Text>
      <ScrollView
        horizontal
        style={styles.hScroll}
        contentContainerStyle={styles.hScrollContent}
        nestedScrollEnabled
      >
        <ScrollView
          style={styles.vScroll}
          contentContainerStyle={styles.vScrollContent}
          nestedScrollEnabled
        >
          <View style={styles.table}>
            {/* Encabezados A, B, C... */}
            <View style={[styles.row, styles.headerRow]}>
              {Array.from({ length: cols }).map((_, c) => (
                <View
                  key={"h-" + c}
                  style={[
                    styles.cell,
                    styles.headerCell,
                    { width: (colWidths && colWidths[c]) || DEFAULT_COL_WIDTH },
                  ]}
                >
                  <Text style={styles.cellText}>
                    {String.fromCharCode(65 + (c % 26))}
                  </Text>
                </View>
              ))}
            </View>
            {/* Celdas */}
            {rows.map((r, ri) => (
              <View key={"r-" + ri} style={styles.row}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <View
                    key={"c-" + ri + "-" + ci}
                    style={[styles.cell, { width: (colWidths && colWidths[ci]) || DEFAULT_COL_WIDTH }]}
                  >
                    <TextInput
                      style={styles.cellInput}
                      multiline={false}
                      value={r[ci] ?? ""}
                      editable={!readOnly}
                      onChangeText={(text) => {
                        if (readOnly) return;
                        setGrid((prev) => {
                          const next = prev.map((row) => [...row]);
                          if (!next[ri]) next[ri] = [] as any;
                          next[ri][ci] = text;
                          return next;
                        });
                        onChange?.();
                      }}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
});

export default ExcelEditor;

const styles = StyleSheet.create({
  wrapper: { flex: 1, minHeight: 800, padding: 0, backgroundColor: "#fff" },
  header: { marginBottom: 8, fontSize: 14, color: "#333" },
  hScroll: { flex: 1 },
  hScrollContent: { flexGrow: 1 },
  vScroll: { flex: 1 },
  vScrollContent: { flexGrow: 1, paddingBottom: 180 },
  table: { borderWidth: 1, borderColor: "#ddd", flexGrow: 1 },
  row: { flexDirection: "row" },
  headerRow: { backgroundColor: "#f7f7f7" },
  cell: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 6,
    overflow: "hidden",
    flexShrink: 0,
  },
  headerCell: { backgroundColor: "#f0f0f0" },
  cellText: { fontSize: 12, color: "#222", fontFamily: "sans-serif" },
  cellInput: {
    fontSize: 12,
    color: "#222",
    padding: 0,
    fontFamily: "sans-serif",
    width: "100%",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  containerMsg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  msg: { color: "#444" },
});

/*
Ejemplo de uso:

import FileEditScreen from '../components/FileEditScreenExcel';

<FileEditScreen
  editorContent={{
    content: '<base64_del_excel>',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }}
/>
*/
  const autoWidths = (grid: string[][], fallback: number[]): number[] => {
    const colsCount = grid.reduce((m, r) => Math.max(m, r.length), 0);
    const widths = new Array(Math.max(colsCount, 1)).fill(DEFAULT_COL_WIDTH);
    for (let ci = 0; ci < colsCount; ci++) {
      let maxLen = 0;
      for (let ri = 0; ri < grid.length; ri++) {
        const v = grid?.[ri]?.[ci] ?? "";
        const len = String(v).length;
        if (len > maxLen) maxLen = len;
      }
      const w = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, 12 + maxLen * 8));
      widths[ci] = w;
    }
    return fallback && fallback.length ? fallback : widths;
  };
