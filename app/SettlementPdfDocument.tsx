import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { SettlementResult } from './settlementCalculator';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerLeft: {
    width: '70%',
  },
  headerRight: {
    width: '30%',
    textAlign: 'right',
  },
  headerBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#4338ca',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 7,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0f172a',
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  col: {
    width: '48%',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3.5,
  },
  fieldLabel: {
    width: '44%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#475569',
  },
  fieldValue: {
    width: '56%',
    fontSize: 8,
    color: '#0f172a',
  },
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowHighlight: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
    backgroundColor: '#fffbeb',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  colConcepto: { width: '28%', paddingRight: 4 },
  colNorma: { width: '16%', paddingRight: 4 },
  colFormula: { width: '38%', paddingRight: 4 },
  colValor: { width: '18%', textAlign: 'right' },

  cellNormaText: { fontSize: 7.5, color: '#475569' },
  cellFormulaText: { fontSize: 7.5, color: '#334155' },
  cellValorText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#0f172a', textAlign: 'right' },

  conceptMainText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0f172a',
  },
  conceptSubText: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  subtotalCard: {
    width: '32%',
    padding: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  subtotalCardTotal: {
    width: '34%',
    padding: 7,
    backgroundColor: '#0f172a',
    borderRadius: 3,
  },
  subtotalLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  subtotalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#34d399',
    marginTop: 2,
  },
  legalNoteBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    borderRadius: 2,
  },
  legalNoteTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  legalNoteText: {
    fontSize: 7.5,
    color: '#1e40af',
    lineHeight: 1.35,
  },
  signaturesContainer: {
    marginTop: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '44%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 5,
    alignItems: 'center',
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  signatureRole: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

const CONTRACT_LABELS: Record<string, string> = {
  INDEFINIDO: 'Término Indefinido (Art. 47 CST)',
  FIJO: 'Término Fijo (Art. 46 CST)',
  OBRA_LABOR: 'Obra o Labor Contratada (Art. 45 CST)',
};

const TERMINATION_LABELS: Record<string, string> = {
  SIN_JUSTA_CAUSA: 'Despido Unilateral Sin Justa Causa (Art. 64 CST)',
  RENUNCIA_O_MUTUO_ACUERDO: 'Renuncia Voluntaria / Mutuo Acuerdo',
  JUSTA_CAUSA: 'Despido con Justa Causa Comprobada (Art. 62 CST)',
  EXPIRACION_PLAZO: 'Expiración del Plazo Fijo Pactado / Fin de Obra',
};

interface PdfProps {
  data: {
    workerName: string;
    workerId: string;
    employerName: string;
    lawyerName?: string;
    lawyerLicense?: string;
    startDate: string;
    endDate: string;
    contractType: string;
    terminationReason: string;
    baseSalary: number;
    result: SettlementResult;
  };
}

export const SettlementPdfDocument: React.FC<PdfProps> = ({ data }) => {
  const {
    workerName,
    workerId,
    employerName,
    lawyerName = 'APODERADO / LIQUIDADOR RESPONSABLE',
    lawyerLicense = 'Elaboró y revisó liquidación conforme al CST',
    startDate,
    endDate,
    contractType,
    terminationReason,
    baseSalary,
    result,
  } = data;

  const formatCOP = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;
  const todayStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ordinarySalary = result.breakdown.indemnizacion.baseSalaryUsed;
  const variableSalary = Math.max(0, ordinarySalary - baseSalary);
  const basePrestacional = result.breakdown.cesantias.baseSalaryUsed;
  const suspendedDays = result.summary.totalDaysContract - result.summary.effectiveDaysContract;

  return (
    <Document title={`Dictamen_Liquidacion_${workerName.replace(/\s+/g, '_')}`}>
      <Page size="LETTER" style={styles.page}>
        {/* 1. ENCABEZADO EJECUTIVO */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBadge}>
              Anexo Técnico • Jurisdicción Ordinaria Laboral
            </Text>
            <Text style={styles.headerTitle}>
              Dictamen de Liquidación de Acreencias Laborales
            </Text>
            <Text style={styles.headerSubtitle}>
              Cómputo técnico-jurídico conforme al Código Sustantivo del Trabajo (Regla Comercial 30/360)
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaLabel}>Fecha de Emisión:</Text>
            <Text style={styles.metaValue}>{todayStr}</Text>
            <Text style={styles.metaLabel}>Sistema de Cómputo:</Text>
            <Text style={styles.metaValue}>Año 360 / Mes 30 días</Text>
          </View>
        </View>

        {/* 2. PARÁMETROS DE LA RELACIÓN LABORAL */}
        <Text style={styles.sectionTitle}>1. Identificación de las Partes y Extremos Temporales</Text>
        <View style={styles.gridContainer}>
          <View style={styles.col}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Trabajador:</Text>
              <Text style={styles.fieldValue}>{workerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Identificación (C.C.):</Text>
              <Text style={styles.fieldValue}>{workerId}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Empleador / Demandado:</Text>
              <Text style={styles.fieldValue}>{employerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Modalidad Contractual:</Text>
              <Text style={styles.fieldValue}>
                {CONTRACT_LABELS[contractType] || contractType}
              </Text>
            </View>
          </View>

          <View style={styles.col}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Extremo Inicial:</Text>
              <Text style={styles.fieldValue}>{startDate}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Extremo Final:</Text>
              <Text style={styles.fieldValue}>{endDate}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tiempo Efectivo:</Text>
              <Text style={styles.fieldValue}>
                {result.summary.effectiveDaysContract} días comerciales
                {suspendedDays > 0 ? ` (-${suspendedDays} días Lic. Art. 51)` : ''}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Causal de Terminación:</Text>
              <Text style={styles.fieldValue}>
                {TERMINATION_LABELS[terminationReason] || terminationReason}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. CONFORMACIÓN DEL INGRESO BASE DE LIQUIDACIÓN (IBL) */}
        <Text style={styles.sectionTitle}>2. Estructura Salarial e Ingreso Base de Liquidación (IBL)</Text>
        <View style={styles.gridContainer}>
          <View style={styles.col}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Salario Básico Fijo:</Text>
              <Text style={styles.fieldValue}>{formatCOP(baseSalary)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Promedio Variable:</Text>
              <Text style={styles.fieldValue}>{formatCOP(variableSalary)}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Auxilio de Transporte:</Text>
              <Text style={styles.fieldValue}>
                {result.summary.appliesTransportAllowance
                  ? `Sí incluye en base (${formatCOP(basePrestacional - ordinarySalary)})`
                  : 'Excluido (> 2 SMMLV o No Aplica)'}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Base Prestacional (IBL):</Text>
              <Text style={styles.fieldValue}>{formatCOP(basePrestacional)}</Text>
            </View>
          </View>
        </View>

        {/* 4. TABLA DISCRIMINADA CON FÓRMULAS MATEMÁTICAS */}
        <Text style={styles.sectionTitle}>3. Liquidación Detallada y Memoria de Cálculo</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colConcepto, styles.tableHeaderText]}>Concepto</Text>
            <Text style={[styles.colNorma, styles.tableHeaderText]}>Norma</Text>
            <Text style={[styles.colFormula, styles.tableHeaderText]}>Memoria de Cálculo (Fórmula Aplicada)</Text>
            <Text style={[styles.colValor, styles.tableHeaderText]}>Valor Liquidado</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colConcepto}>
              <Text style={styles.conceptMainText}>1. Auxilio de Cesantías</Text>
              <Text style={styles.conceptSubText}>{result.breakdown.cesantias.days} días causados en el año</Text>
            </View>
            <Text style={[styles.colNorma, styles.cellNormaText]}>{result.breakdown.cesantias.legalBasis}</Text>
            <Text style={[styles.colFormula, styles.cellFormulaText]}>{result.breakdown.cesantias.formulaDescription}</Text>
            <Text style={[styles.colValor, styles.cellValorText]}>{formatCOP(result.breakdown.cesantias.amount)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colConcepto}>
              <Text style={styles.conceptMainText}>2. Intereses a las Cesantías</Text>
              <Text style={styles.conceptSubText}>12% anual proporcional</Text>
            </View>
            <Text style={[styles.colNorma, styles.cellNormaText]}>{result.breakdown.interesesCesantias.legalBasis}</Text>
            <Text style={[styles.colFormula, styles.cellFormulaText]}>{result.breakdown.interesesCesantias.formulaDescription}</Text>
            <Text style={[styles.colValor, styles.cellValorText]}>{formatCOP(result.breakdown.interesesCesantias.amount)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colConcepto}>
              <Text style={styles.conceptMainText}>3. Prima de Servicios</Text>
              <Text style={styles.conceptSubText}>{result.breakdown.primaServicios.days} días semestre actual</Text>
            </View>
            <Text style={[styles.colNorma, styles.cellNormaText]}>{result.breakdown.primaServicios.legalBasis}</Text>
            <Text style={[styles.colFormula, styles.cellFormulaText]}>{result.breakdown.primaServicios.formulaDescription}</Text>
            <Text style={[styles.colValor, styles.cellValorText]}>{formatCOP(result.breakdown.primaServicios.amount)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colConcepto}>
              <Text style={styles.conceptMainText}>4. Vacaciones Compensadas</Text>
              <Text style={styles.conceptSubText}>
                Causadas: {result.breakdown.vacaciones.accruedDays}d | Pendientes: {result.breakdown.vacaciones.pendingDays}d
              </Text>
            </View>
            <Text style={[styles.colNorma, styles.cellNormaText]}>{result.breakdown.vacaciones.legalBasis}</Text>
            <Text style={[styles.colFormula, styles.cellFormulaText]}>{result.breakdown.vacaciones.formulaDescription}</Text>
            <Text style={[styles.colValor, styles.cellValorText]}>{formatCOP(result.breakdown.vacaciones.amount)}</Text>
          </View>

          <View style={styles.tableRowHighlight}>
            <View style={styles.colConcepto}>
              <Text style={styles.conceptMainText}>5. Indemnización por Despido</Text>
              <Text style={styles.conceptSubText}>
                Equivalente a {result.breakdown.indemnizacion.days} días de salario
              </Text>
            </View>
            <Text style={[styles.colNorma, styles.cellNormaText]}>{result.breakdown.indemnizacion.legalBasis}</Text>
            <Text style={[styles.colFormula, styles.cellFormulaText]}>{result.breakdown.indemnizacion.formulaDescription}</Text>
            <Text style={[styles.colValor, styles.cellValorText]}>{formatCOP(result.breakdown.indemnizacion.amount)}</Text>
          </View>
        </View>

        {/* 5. RESUMEN EJECUTIVO DE TOTALES */}
        <View style={styles.summaryRow}>
          <View style={styles.subtotalCard}>
            <Text style={styles.subtotalLabel}>Subtotal Prestaciones y Vacaciones</Text>
            <Text style={styles.subtotalValue}>{formatCOP(result.summary.totalPrestaciones)}</Text>
          </View>
          <View style={styles.subtotalCard}>
            <Text style={styles.subtotalLabel}>Subtotal Indemnización (Art. 64)</Text>
            <Text style={styles.subtotalValue}>{formatCOP(result.summary.totalIndemnizacion)}</Text>
          </View>
          <View style={styles.subtotalCardTotal}>
            <Text style={styles.grandTotalLabel}>Gran Total Liquidación</Text>
            <Text style={styles.grandTotalValue}>{formatCOP(result.summary.grandTotal)}</Text>
          </View>
        </View>

        {/* 6. ADVERTENCIA PROCESAL ART. 65 CST */}
        <View style={styles.legalNoteBox}>
          <Text style={styles.legalNoteTitle}>
            Parámetro de Sanción Moratoria (Art. 65 CST - Salario Diario: {formatCOP(result.moratoriaReference.dailyRate)} / día)
          </Text>
          <Text style={styles.legalNoteText}>
            A partir de la terminación del vínculo laboral, la falta de pago oportuno de los salarios y prestaciones debidas causa a título de indemnización moratoria una suma igual al último salario diario ({formatCOP(result.moratoriaReference.dailyRate)}) por cada día de retardo hasta por veinticuatro (24) meses, o intereses moratorios a la tasa máxima de créditos de libre asignación certificada por la Superintendencia Financiera a partir del mes veinticinco (25).
          </Text>
        </View>

        {/* 7. ESPACIO PARA FIRMAS */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{lawyerName}</Text>
            <Text style={styles.signatureRole}>{lawyerLicense}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{workerName}</Text>
            <Text style={styles.signatureRole}>Trabajador / Interesado • C.C. {workerId}</Text>
          </View>
        </View>

        {/* PIE DE PÁGINA */}
        <View style={styles.footer}>
          <Text>Dictamen Técnico de Liquidación Laboral • Régimen Colombiano (CST)</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
};