import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as XLSX from 'xlsx';

type EditorContentPayload = {
  content: string; // base64 del XLSX
  mime_type: string;
};

type Props = {
  editorContent: EditorContentPayload;
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

export default function FileEditScreen({ editorContent }: Props) {
  const isExcel = editorContent?.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const tableData = useMemo(() => {
    if (!isExcel) return null;
    const cleaned = sanitizeBase64Input(editorContent?.content || '');
    if (!cleaned || cleaned.length < 128) return null; // demasiado corto para ser un XLSX
    try {
      const wb = XLSX.read(cleaned, { type: 'base64' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
      const rows = aoa.map(row => row.map(cell => (cell === undefined ? '' : String(cell))));
      const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
      return { rows, cols, sheetName };
    } catch (e) {
      console.warn('[FileEditScreenExcel] Error parseando XLSX:', e);
      return null;
    }
  }, [isExcel, editorContent?.content]);

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

  const { rows, cols, sheetName } = tableData;

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
                    <Text style={styles.cellText}>{r[ci] ?? ''}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, padding: 12, backgroundColor: '#fff' },
  header: { marginBottom: 8, fontSize: 14, color: '#333' },
  hScroll: { flexGrow: 0 },
  vScroll: { flexGrow: 0 },
  table: { borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row' },
  headerRow: { backgroundColor: '#f7f7f7' },
  cell: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 8, paddingVertical: 6, minWidth: 100 },
  headerCell: { backgroundColor: '#f0f0f0' },
  cellText: { fontSize: 12, color: '#222' },
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