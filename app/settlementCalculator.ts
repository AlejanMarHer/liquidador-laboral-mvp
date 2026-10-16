/**
 * Motor de Liquidación de Prestaciones Sociales e Indemnizaciones (Colombia - CST)
 * Basado en el cómputo de año comercial de 360 días (12 meses de 30 días).
 */

export type ContractType = 'INDEFINIDO' | 'FIJO' | 'OBRA_LABOR';

export type TerminationReason =
  | 'RENUNCIA_O_MUTUO_ACUERDO'
  | 'JUSTA_CAUSA'
  | 'EXPIRACION_PLAZO'
  | 'SIN_JUSTA_CAUSA';

export interface SettlementInput {
  // Fechas en formato 'YYYY-MM-DD'
  startDate: string;
  endDate: string;
  /** Requerido si es contrato FIJO u OBRA_LABOR y hay despido SIN_JUSTA_CAUSA */
  expectedEndDate?: string;

  contractType: ContractType;
  terminationReason: TerminationReason;

  // Estructura salarial (en COP)
  baseSalary: number;
  /** Promedio mensual de comisiones, horas extras, recargos nocturnos/dominicales */
  variableSalaryAvg?: number;
  /** Si es true, no liquida cesantías, intereses ni prima (Art. 132 CST) */
  isIntegralSalary?: boolean;

  // Parámetros normativos del año de liquidación (configurables por año)
  smmlv: number;
  transportAllowanceLegal: number;
  /** Permite forzar o excluir el auxilio (ej. si el trabajador vive a menos de 1 km o tiene ruta) */
  forceExcludeTransportAllowance?: boolean;

  // Novedades del periodo
  /** Licencias no remuneradas o suspensiones disciplinarias en el último año (Art. 51 y 53 CST) */
  unpaidLeaveDaysCurrentYear?: number;
  /** Total de licencias no remuneradas en toda la relación laboral (afecta vacaciones e indemnización) */
  unpaidLeaveDaysTotal?: number;
  /** Días hábiles de vacaciones ya disfrutados o compensados durante todo el contrato */
  vacationDaysTaken?: number;
}

export interface ConceptDetail {
  amount: number;
  days: number;
  baseSalaryUsed: number;
  legalBasis: string;
  formulaDescription: string;
}

export interface SettlementResult {
  summary: {
    totalDaysContract: number;
    effectiveDaysContract: number;
    appliesTransportAllowance: boolean;
    totalPrestaciones: number;
    totalIndemnizacion: number;
    grandTotal: number;
  };
  breakdown: {
    cesantias: ConceptDetail;
    interesesCesantias: ConceptDetail;
    primaServicios: ConceptDetail;
    vacaciones: ConceptDetail & { accruedDays: number; pendingDays: number };
    indemnizacion: ConceptDetail;
  };
  moratoriaReference: {
    dailyRate: number;
    legalNote: string;
  };
}

/**
 * Convierte 'YYYY-MM-DD' a componentes numéricos sin desfase de zona horaria.
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Formato de fecha inválido: ${dateStr}. Use YYYY-MM-DD.`);
  }
  return { year, month, day };
}

/**
 * Calcula días comerciales entre dos fechas bajo la regla laboral colombiana (30/360),
 * incluyendo el día inicial y el día final (+1).
 * Ajusta el día 31 a 30 y el último día de febrero (28 o 29) a 30 cuando cierra mes.
 */
export function calculateDays360(startStr: string, endStr: string): number {
  const start = parseDateParts(startStr);
  const end = parseDateParts(endStr);

  const normalizeDay = (y: number, m: number, d: number, isEndDate: boolean): number => {
    if (d === 31) return 30;
    // Si es fecha de corte en febrero (28 o 29), en liquidación comercial equivale al día 30
    if (isEndDate && m === 2 && (d === 28 || d === 29)) {
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      if ((isLeap && d === 29) || (!isLeap && d === 28)) {
        return 30;
      }
    }
    return d;
  };

  const d1 = normalizeDay(start.year, start.month, start.day, false);
  const d2 = normalizeDay(end.year, end.month, end.day, true);

  const totalDays = (end.year - start.year) * 360 + (end.month - start.month) * 30 + (d2 - d1) + 1;
  return Math.max(0, totalDays);
}

/**
 * Redondea al peso colombiano más cercano.
 */
function roundCOP(value: number): number {
  return Math.round(value);
}

/**
 * Función principal de liquidación laboral.
 */
export function calculateLaborSettlement(input: SettlementInput): SettlementResult {
  const variableAvg = input.variableSalaryAvg ?? 0;
  const isIntegral = input.isIntegralSalary ?? false;
  const unpaidCurrentYear = input.unpaidLeaveDaysCurrentYear ?? 0;
  const unpaidTotal = input.unpaidLeaveDaysTotal ?? unpaidCurrentYear;
  const vacationsTaken = input.vacationDaysTaken ?? 0;

  // Validaciones de integridad
  const totalDaysContract = calculateDays360(input.startDate, input.endDate);
  if (totalDaysContract <= 0) {
    throw new Error('La fecha de terminación debe ser igual o posterior a la fecha de inicio.');
  }

  const effectiveDaysContract = Math.max(0, totalDaysContract - unpaidTotal);

  // 1. Determinación del Auxilio de Transporte (Ley 15 de 1959)
  // Aplica si el salario ordinario (base + variable) no supera 2 SMMLV y no es salario integral
  const ordinarySalary = input.baseSalary + variableAvg;
  const appliesTransportAllowance =
    !isIntegral &&
    !input.forceExcludeTransportAllowance &&
    ordinarySalary <= input.smmlv * 2;

  const transportValue = appliesTransportAllowance ? input.transportAllowanceLegal : 0;

  // 2. Bases de liquidación según cada concepto
  const basePrestacional = ordinarySalary + transportValue; // Para Cesantías y Prima (Art. 7 Ley 1 de 1963)
  const baseVacaciones = input.baseSalary + variableAvg;    // Sin auxilio de transporte (Art. 192 CST)
  const baseIndemnizacion = ordinarySalary;                 // Sin auxilio de transporte

  const endParts = parseDateParts(input.endDate);

  // ============================================================================
  // A. CESANTÍAS (Art. 249 CST)
  // Se liquidan desde el 1 de enero del año de retiro (o fecha de ingreso si es posterior)
  // ============================================================================
  const startOfCurrentYear = `${endParts.year}-01-01`;
  const cesantiasStartDate = input.startDate > startOfCurrentYear ? input.startDate : startOfCurrentYear;
  const rawDaysCesantias = calculateDays360(cesantiasStartDate, input.endDate);
  const daysCesantias = Math.max(0, rawDaysCesantias - unpaidCurrentYear);

  const amountCesantias = isIntegral
    ? 0
    : roundCOP((basePrestacional * daysCesantias) / 360);

  // ============================================================================
  // B. INTERESES SOBRE LAS CESANTÍAS (Ley 52 de 1975 - 12% anual)
  // ============================================================================
  const amountIntereses = isIntegral
    ? 0
    : roundCOP((amountCesantias * daysCesantias * 0.12) / 360);

  // ============================================================================
  // C. PRIMA DE SERVICIOS (Art. 306 CST)
  // Se liquida por el semestre en curso (Ene 1 o Jul 1)
  // ============================================================================
  const startOfCurrentSemester =
    endParts.month <= 6 ? `${endParts.year}-01-01` : `${endParts.year}-07-01`;
  const primaStartDate =
    input.startDate > startOfCurrentSemester ? input.startDate : startOfCurrentSemester;
  const daysPrima = calculateDays360(primaStartDate, input.endDate);

  const amountPrima = isIntegral
    ? 0
    : roundCOP((basePrestacional * daysPrima) / 360);

  // ============================================================================
  // D. COMPENSACIÓN DE VACACIONES EN DINERO (Art. 186 y 189 CST)
  // 15 días hábiles por cada 360 días laborados
  // ============================================================================
  const accruedVacationDays = (effectiveDaysContract * 15) / 360;
  const pendingVacationDays = Math.max(0, accruedVacationDays - vacationsTaken);
  const dailyVacationRate = baseVacaciones / 30;
  const amountVacaciones = roundCOP(pendingVacationDays * dailyVacationRate);

  // ============================================================================
  // E. INDEMNIZACIÓN POR DESPIDO SIN JUSTA CAUSA (Art. 64 CST)
  // ============================================================================
  let amountIndemnizacion = 0;
  let indemnityDaysEquivalent = 0;
  let indemnityFormulaDesc = 'No aplica por causal de terminación.';

  if (input.terminationReason === 'SIN_JUSTA_CAUSA') {
    const dailySalary = baseIndemnizacion / 30;

    if (input.contractType === 'INDEFINIDO') {
      const earnsLessThan10Smmlv = baseIndemnizacion < input.smmlv * 10;
      const firstYearDays = earnsLessThan10Smmlv ? 30 : 20;
      const additionalYearDays = earnsLessThan10Smmlv ? 20 : 15;

      if (effectiveDaysContract <= 360) {
        indemnityDaysEquivalent = firstYearDays;
      } else {
        const extraDaysWorked = effectiveDaysContract - 360;
        const proportionalExtraDays = (extraDaysWorked * additionalYearDays) / 360;
        indemnityDaysEquivalent = firstYearDays + proportionalExtraDays;
      }

      amountIndemnizacion = roundCOP(indemnityDaysEquivalent * dailySalary);
      indemnityFormulaDesc = earnsLessThan10Smmlv
        ? `Ingreso < 10 SMMLV: 30 días primer año + 20 días proporcionales por fracción (${indemnityDaysEquivalent.toFixed(2)} días de salario).`
        : `Ingreso >= 10 SMMLV: 20 días primer año + 15 días proporcionales por fracción (${indemnityDaysEquivalent.toFixed(2)} días de salario).`;

    } else if (input.contractType === 'FIJO') {
      if (!input.expectedEndDate) {
        throw new Error('Para contrato a término fijo sin justa causa debe indicar expectedEndDate.');
      }
      // Días faltantes desde el día siguiente al despido hasta el vencimiento pactado
      const remainingDays = Math.max(0, calculateDays360(input.endDate, input.expectedEndDate) - 1);
      indemnityDaysEquivalent = remainingDays;
      amountIndemnizacion = roundCOP(remainingDays * dailySalary);
      indemnityFormulaDesc = `Tiempo faltante para vencimiento del plazo pactado (${remainingDays} días de salario).`;

    } else if (input.contractType === 'OBRA_LABOR') {
      const remainingDays = input.expectedEndDate
        ? Math.max(0, calculateDays360(input.endDate, input.expectedEndDate) - 1)
        : 15;
      // El Art. 64 CST establece un piso mínimo de 15 días para obra o labor
      indemnityDaysEquivalent = Math.max(15, remainingDays);
      amountIndemnizacion = roundCOP(indemnityDaysEquivalent * dailySalary);
      indemnityFormulaDesc = `Lapso determinado por la duración de la obra con mínimo legal de 15 días (${indemnityDaysEquivalent} días de salario).`;
    }
  }

  const totalPrestaciones =
    amountCesantias + amountIntereses + amountPrima + amountVacaciones;
  const grandTotal = totalPrestaciones + amountIndemnizacion;

  return {
    summary: {
      totalDaysContract,
      effectiveDaysContract,
      appliesTransportAllowance,
      totalPrestaciones,
      totalIndemnizacion: amountIndemnizacion,
      grandTotal,
    },
    breakdown: {
      cesantias: {
        amount: amountCesantias,
        days: daysCesantias,
        baseSalaryUsed: basePrestacional,
        legalBasis: 'Art. 249 CST',
        formulaDescription: `($${basePrestacional.toLocaleString('es-CO')} × ${daysCesantias} días) / 360`,
      },
      interesesCesantias: {
        amount: amountIntereses,
        days: daysCesantias,
        baseSalaryUsed: amountCesantias,
        legalBasis: 'Ley 52 de 1975 (Art. 1)',
        formulaDescription: `($${amountCesantias.toLocaleString('es-CO')} × ${daysCesantias} días × 12%) / 360`,
      },
      primaServicios: {
        amount: amountPrima,
        days: daysPrima,
        baseSalaryUsed: basePrestacional,
        legalBasis: 'Art. 306 CST',
        formulaDescription: `($${basePrestacional.toLocaleString('es-CO')} × ${daysPrima} días) / 360`,
      },
      vacaciones: {
        amount: amountVacaciones,
        days: effectiveDaysContract,
        accruedDays: Number(accruedVacationDays.toFixed(2)),
        pendingDays: Number(pendingVacationDays.toFixed(2)),
        baseSalaryUsed: baseVacaciones,
        legalBasis: 'Art. 186 y 189 CST',
        formulaDescription: `${pendingVacationDays.toFixed(2)} días hábiles pendientes × ($${baseVacaciones.toLocaleString('es-CO')} / 30)`,
      },
      indemnizacion: {
        amount: amountIndemnizacion,
        days: Number(indemnityDaysEquivalent.toFixed(2)),
        baseSalaryUsed: baseIndemnizacion,
        legalBasis: 'Art. 64 CST',
        formulaDescription: indemnityFormulaDesc,
      },
    },
    moratoriaReference: {
      dailyRate: roundCOP(ordinarySalary / 30),
      legalNote:
        'Art. 65 CST: Un día de salario por cada día de retardo hasta por 24 meses (o intereses moratorios a la tasa máxima de la Superfinanciera a partir del mes 25 si devenga más de 1 SMMLV).',
    },
  };
}