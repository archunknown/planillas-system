import { StyleSheet } from '@react-pdf/renderer';

// Decimal format decision: punto como separador decimal, sin separador de miles
// ("S/ 1500.00"). Consistente con .toFixed(2) de la UI existente.
// Formato local peruano (1.500,00) postergado a Fase 5 si el cliente lo solicita.

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'LiberationSans',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    color: '#111111',
  },
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  titulo: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
  },
  small: {
    fontSize: 8,
    color: '#555555',
  },
  // Sección datos trabajador
  seccion: {
    marginTop: 10,
    marginBottom: 6,
  },
  seccionTitulo: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#555555',
    textTransform: 'uppercase',
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    fontSize: 8,
    color: '#555555',
    width: 100,
  },
  value: {
    fontSize: 9,
    flex: 1,
  },
  // Tabla de conceptos — dos columnas
  tableContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  tableCol: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    flex: 1,
  },
  tableHeaderAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
    width: 60,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderBottomWidth: 0.3,
    borderBottomColor: '#eeeeee',
  },
  tableRowText: {
    fontSize: 9,
    flex: 1,
  },
  tableRowAmount: {
    fontSize: 9,
    textAlign: 'right',
    width: 60,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderTopWidth: 0.8,
    borderTopColor: '#aaaaaa',
    marginTop: 2,
  },
  tableTotalText: {
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1,
  },
  tableTotalAmount: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
    width: 60,
  },
  // Neto a pagar
  netoContainer: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  netoAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Aportes empleador (nota al pie)
  aportesContainer: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f8f8f8',
    borderWidth: 0.5,
    borderColor: '#dddddd',
  },
  // Footer firma
  firmaContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  firmaCol: {
    flex: 1,
    alignItems: 'center',
  },
  firmaLinea: {
    borderTopWidth: 0.8,
    borderTopColor: '#333333',
    width: '80%',
    marginBottom: 4,
  },
  firmaLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  firmaTexto: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555555',
    marginTop: 12,
  },
});

export function formatAmount(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}
