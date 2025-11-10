import React, { useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import * as XLSX from 'xlsx';
// Cargar soporte de codepages para .xls antiguos y texto en distintos encodings
import 'xlsx/dist/cpexcel.js';

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
  onChange?: () => void;
};

// Limpia y normaliza el base64 (quita prefijos data:, espacios, URL-safe y corrige padding)
function sanitizeBase64Input(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  const commaIndex = s.indexOf(',');
  if (s.startsWith('data:') && commaIndex !== -1) {
    s = s.slice(commaIndex + 1);
  }
  s = s.replace(/\s+/g, '');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  s = s.replace(/[^A-Za-z0-9+/=]/g, '');
  const pad = s.length % 4;
  if (pad !== 0) s += '='.repeat(4 - pad);
  return s;
}

// Heurística para detectar si el contenido parece base64 en lugar de cadena binaria
function isProbablyBase64(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  if (raw.startsWith('data:')) return true;
  const cleaned = raw.replace(/\s+/g, '');
  if (cleaned.length < 128) return false; // muy corto para un XLSX real
  const invalid = cleaned.replace(/[A-Za-z0-9+/=]/g, '');
  const invalidRatio = invalid.length / cleaned.length;
  return invalidRatio < 0.02 && cleaned.length % 4 === 0;
}

const ExcelEditor = forwardRef<ExcelEditorHandle, Props>(function ExcelEditor({ editorContent, onChange }, ref) {
  const isExcel = (
    editorContent?.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    editorContent?.mime_type === 'application/vnd.ms-excel'
  );
  const tableData = useMemo(() => {
    if (!isExcel) return null;
    const rawContent = editorContent?.content || '';
    const treatAsBase64 = isProbablyBase64(rawContent);
    const cleaned = treatAsBase64 ? sanitizeBase64Input(rawContent) : rawContent;
    if (!cleaned || cleaned.length < 128) return null; // demasiado corto para ser un XLSX
    try {
      const wb = XLSX.read(cleaned, {
        type: treatAsBase64 ? 'base64' : 'binary',
        cellText: false,
        cellDates: true,
      });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: false, defval: '' });
      const rows = aoa.map(row => row.map(cell => (cell === undefined ? '' : String(cell))));
      const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
      return { rows, cols, sheetName };
    } catch (e) {
      console.warn('[FileEditScreenExcel] Error parseando XLSX:', e);
      return null;
    }
  }, [isExcel, editorContent?.content]);

  const [grid, setGrid] = useState<string[][]>(tableData?.rows || []);
  const [cols, setCols] = useState<number>(tableData?.cols || 0);
  const [sheetName, setSheetName] = useState<string>(tableData?.sheetName || 'Sheet1');

  // Actualiza estado cuando tableData cambia (p.ej. nueva carga)
  React.useEffect(() => {
    if (tableData) {
      setGrid(tableData.rows);
      setCols(tableData.cols);
      setSheetName(tableData.sheetName);
    }
  }, [tableData?.rows, tableData?.cols, tableData?.sheetName]);

  useImperativeHandle(ref, () => ({
    getWorkbookBase64: () => {
      try {
        const aoa = grid && grid.length ? grid : [[]];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
        const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        return { base64: b64, sheetName: sheetName || 'Sheet1' };
      } catch (e) {
        console.warn('[FileEditScreenExcel] Error serializando XLSX:', e);
        return null;
      }
    },
    getWorkbookDataJson: () => {
      try {
        const currentGrid = grid && grid.length ? grid : [[]];
        const maxCols = currentGrid.reduce((m, r) => Math.max(m, r.length), 0);

        const rowsObj: Record<string, any> = {};
        currentGrid.forEach((row, ri) => {
          const cells: Record<string, any> = {};
          for (let ci = 0; ci < maxCols; ci++) {
            const text = row?.[ci] ?? '';
            cells[String(ci)] = { text };
          }
          rowsObj[String(ri)] = { cells };
        });

        const data = {
          name: sheetName || 'Sheet1',
          freeze: 'A1',
          styles: [],
          merges: [],
          rows: rowsObj,
        };

        return { data, sheetName: sheetName || 'Sheet1' };
      } catch (e) {
        console.warn('[FileEditScreenExcel] Error generando JSON estructurado:', e);
        return null;
      }
    }
  }), [grid, sheetName]);

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
      </View>
    );
  }
  const rows = grid;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.header}>Hoja: {sheetName} · Filas: {rows.length} · Columnas: {cols}</Text>
      <ScrollView horizontal style={styles.hScroll}>
        <ScrollView style={styles.vScroll}>
          <View style={styles.table}>
            {/* Encabezados A, B, C... */}
            <View style={[styles.row, styles.headerRow]}>
              {Array.from({ length: cols }).map((_, c) => (
                <View key={'h-' + c} style={[styles.cell, styles.headerCell]}>
                  <Text style={styles.cellText}>{String.fromCharCode(65 + (c % 26))}</Text>
                </View>
              ))}
            </View>
            {/* Celdas */}
            {rows.map((r, ri) => (
              <View key={'r-' + ri} style={styles.row}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <View key={'c-' + ri + '-' + ci} style={styles.cell}>
                    <TextInput
                      style={styles.cellInput}
                      value={r[ci] ?? ''}
                      onChangeText={(text) => {
                        setGrid(prev => {
                          const next = prev.map(row => [...row]);
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
  wrapper: { flex: 1, padding: 12, backgroundColor: '#fff' },
  header: { marginBottom: 8, fontSize: 14, color: '#333' },
  hScroll: { flex: 1 },
  vScroll: { flex: 1 },
  table: { borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row' },
  headerRow: { backgroundColor: '#f7f7f7' },
  cell: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 8, paddingVertical: 6, minWidth: 100 },
  headerCell: { backgroundColor: '#f0f0f0' },
  cellText: { fontSize: 12, color: '#222' },
  cellInput: { fontSize: 12, color: '#222', padding: 0 },
  containerMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  msg: { color: '#444' },
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