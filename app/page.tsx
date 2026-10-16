'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateLaborSettlement,
  ContractType,
  TerminationReason,
  SettlementInput,
} from './settlementCalculator';

export default function LiquidadorLaboralPage() {
  // 1. Estados del formulario con valores iniciales de prueba
  const [workerName, setWorkerName] = useState('Juan Pérez');
  const [workerId, setWorkerId] = useState('1.020.304.050');
  const [employerName, setEmployerName] = useState('Inversiones Ejemplo S.A.S.');

  const [startDate, setStartDate] = useState('2024-03-15');
  const [endDate, setEndDate] = useState('2026-08-30');
  const [expectedEndDate, setExpectedEndDate] = useState('2026-12-30');

  const [contractType, setContractType] = useState<ContractType>('INDEFINIDO');
  const [terminationReason, setTerminationReason] =
    useState<TerminationReason>('SIN_JUSTA_CAUSA');

  const [baseSalary, setBaseSalary] = useState<number>(2500000);
  const [variableSalaryAvg, setVariableSalaryAvg] = useState<number>(0);
  const [isIntegralSalary, setIsIntegralSalary] = useState<boolean>(false);
  const [forceExcludeTransport, setForceExcludeTransport] = useState<boolean>(false);

  // Parámetros normativos configurables
  const [smmlv, setSmmlv] = useState<number>(1423500);
  const [transportAllowanceLegal, setTransportAllowanceLegal] = useState<number>(200000);

  // Novedades
  const [vacationDaysTaken, setVacationDaysTaken] = useState<number>(0);
  const [unpaidLeaveDaysCurrentYear, setUnpaidLeaveDaysCurrentYear] = useState<number>(0);
  const [unpaidLeaveDaysTotal, setUnpaidLeaveDaysTotal] = useState<number>(0);

  // Estado para el botón de descarga PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Formateador de pesos colombianos
  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  // 2. Conexión en tiempo real con el motor jurídico
  const calculationState = useMemo(() => {
    try {
      const input: SettlementInput = {
        startDate,
        endDate,
        expectedEndDate:
          contractType !== 'INDEFINIDO' && terminationReason === 'SIN_JUSTA_CAUSA'
            ? expectedEndDate
            : undefined,
        contractType,
        terminationReason,
        baseSalary: Number(baseSalary) || 0,
        variableSalaryAvg: Number(variableSalaryAvg) || 0,
        isIntegralSalary,
        smmlv: Number(smmlv) || 1423500,
        transportAllowanceLegal: Number(transportAllowanceLegal) || 200000,
        forceExcludeTransportAllowance: forceExcludeTransport,
        vacationDaysTaken: Number(vacationDaysTaken) || 0,
        unpaidLeaveDaysCurrentYear: Number(unpaidLeaveDaysCurrentYear) || 0,
        unpaidLeaveDaysTotal: Number(unpaidLeaveDaysTotal) || 0,
      };

      const result = calculateLaborSettlement(input);
      return { result, error: null };
    } catch (err: any) {
      return { result: null, error: err.message || 'Error en los datos ingresados.' };
    }
  }, [
    startDate,
    endDate,
    expectedEndDate,
    contractType,
    terminationReason,
    baseSalary,
    variableSalaryAvg,
    isIntegralSalary,
    smmlv,
    transportAllowanceLegal,
    forceExcludeTransport,
    vacationDaysTaken,
    unpaidLeaveDaysCurrentYear,
    unpaidLeaveDaysTotal,
  ]);

  const { result, error } = calculationState;

  // 3. Función para generar y descargar el PDF al hacer clic
  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      setIsGeneratingPdf(true);
      const { pdf } = await import('@react-pdf/renderer');
      const { SettlementPdfDocument } = await import('./SettlementPdfDocument');

      const doc = (
        <SettlementPdfDocument
          data={{
            workerName,
            workerId,
            employerName,
            startDate,
            endDate,
            contractType,
            terminationReason,
            baseSalary,
            result,
          }}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Liquidacion_${workerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando el PDF:', err);
      alert('Hubo un error al generar el PDF. Verifica que SettlementPdfDocument.tsx exista en la carpeta app.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado con Botón de Descarga PDF */}
        <header className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              Régimen Laboral Colombiano • Cómputo 30/360
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Liquidador Jurídico de Prestaciones e Indemnizaciones
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Cálculo automático conforme al Código Sustantivo del Trabajo (Arts. 64, 65, 186, 249 y 306).
            </p>
          </div>

          {/* Botón visible en la esquina superior derecha */}
          {result && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                {isGeneratingPdf ? (
                  'Generando documento...'
                ) : (
                  <>
                    <span>📄</span>
                    <span>Descargar Dictamen en PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </header>

        {/* Contenedor Principal: Izquierda Formulario / Derecha Resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: FORMULARIO (5 columnas) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Bloque 1: Identificación de las Partes */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 mb-4 border-b pb-2">
                1. Datos de las Partes (Para el Reporte)
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre del Trabajador
                  </label>
                  <input
                    type="text"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Documento (C.C.)
                    </label>
                    <input
                      type="text"
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Empleador / Empresa
                    </label>
                    <input
                      type="text"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bloque 2: Parámetros del Contrato */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 mb-4 border-b pb-2">
                2. Vigencia y Modalidad del Contrato
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Fecha de Terminación
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Modalidad Contractual
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INDEFINIDO">Término Indefinido (Art. 47 CST)</option>
                    <option value="FIJO">Término Fijo (Art. 46 CST)</option>
                    <option value="OBRA_LABOR">Obra o Labor Contratada (Art. 45 CST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Causa de Terminación
                  </label>
                  <select
                    value={terminationReason}
                    onChange={(e) =>
                      setTerminationReason(e.target.value as TerminationReason)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SIN_JUSTA_CAUSA">
                      Despido Sin Justa Causa / Renuncia Motivada
                    </option>
                    <option value="RENUNCIA_O_MUTUO_ACUERDO">
                      Renuncia Voluntaria o Mutuo Acuerdo
                    </option>
                    <option value="JUSTA_CAUSA">
                      Despido con Justa Causa Comprobada (Art. 62 CST)
                    </option>
                    <option value="EXPIRACION_PLAZO">
                      Vencimiento del Plazo Pactado / Fin de Obra
                    </option>
                  </select>
                </div>

                {contractType !== 'INDEFINIDO' &&
                  terminationReason === 'SIN_JUSTA_CAUSA' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Fecha en que vencía el plazo o terminaba la obra
                      </label>
                      <input
                        type="date"
                        value={expectedEndDate}
                        onChange={(e) => setExpectedEndDate(e.target.value)}
                        className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm bg-white"
                      />
                      <p className="text-[11px] text-amber-700 mt-1">
                        Requerido por el Art. 64 CST para liquidar el tiempo faltante.
                      </p>
                    </div>
                  )}
              </div>
            </section>

            {/* Bloque 3: Salario y Parámetros */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 mb-4 border-b pb-2">
                3. Estructura Salarial (COP)
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Salario Básico Mensual ($)
                    </label>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Promedio Variable Mensual ($)
                    </label>
                    <input
                      type="number"
                      value={variableSalaryAvg}
                      onChange={(e) => setVariableSalaryAvg(Number(e.target.value))}
                      placeholder="Comisiones, horas extras..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isIntegralSalary}
                      onChange={(e) => setIsIntegralSalary(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Es Salario Integral (Art. 132 CST - Excluye cesantías y prima)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceExcludeTransport}
                      onChange={(e) => setForceExcludeTransport(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Excluir auxilio de transporte (ej. transporte suministrado por empresa)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      SMMLV Vigente ($)
                    </label>
                    <input
                      type="number"
                      value={smmlv}
                      onChange={(e) => setSmmlv(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Auxilio Transporte Legal ($)
                    </label>
                    <input
                      type="number"
                      value={transportAllowanceLegal}
                      onChange={(e) => setTransportAllowanceLegal(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bloque 4: Novedades y Descuentos */}
            <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 mb-4 border-b pb-2">
                4. Vacaciones Disfrutadas y Licencias (Art. 51 CST)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Vacaciones ya tomadas (días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vacationDaysTaken}
                    onChange={(e) => setVacationDaysTaken(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Licencia no rem. (este año)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unpaidLeaveDaysCurrentYear}
                    onChange={(e) =>
                      setUnpaidLeaveDaysCurrentYear(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Licencia no rem. (histórico)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unpaidLeaveDaysTotal}
                    onChange={(e) => setUnpaidLeaveDaysTotal(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: DICTAMEN DE RESULTADOS (7 columnas) */}
          <div className="lg:col-span-7 space-y-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            ) : (
              result && (
                <>
                  {/* Tarjeta Principal de Gran Total */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-4 mb-4 gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                          Total General Liquidación
                        </p>
                        <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1">
                          {formatCOP(result.summary.grandTotal)}
                        </p>
                      </div>
                      <div className="text-left sm:text-right text-xs text-slate-300 space-y-1">
                        <p>
                          <span className="text-slate-400">Trabajador:</span>{' '}
                          <strong className="text-white">{workerName}</strong> (C.C. {workerId})
                        </p>
                        <p>
                          <span className="text-slate-400">Empleador:</span>{' '}
                          <strong className="text-white">{employerName}</strong>
                        </p>
                        <p>
                          <span className="text-slate-400">Tiempo efectivo:</span>{' '}
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-semibold">
                            {result.summary.effectiveDaysContract} días comerciales
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-800/70 p-3 rounded-lg">
                        <span className="text-xs text-slate-400 block">
                          Subtotal Prestaciones
                        </span>
                        <span className="font-bold text-white text-base">
                          {formatCOP(result.summary.totalPrestaciones)}
                        </span>
                      </div>
                      <div className="bg-slate-800/70 p-3 rounded-lg">
                        <span className="text-xs text-slate-400 block">
                          Subtotal Indemnización
                        </span>
                        <span className="font-bold text-amber-300 text-base">
                          {formatCOP(result.summary.totalIndemnizacion)}
                        </span>
                      </div>
                      <div className="bg-slate-800/70 p-3 rounded-lg">
                        <span className="text-xs text-slate-400 block">
                          Auxilio de Transporte
                        </span>
                        <span className="font-semibold text-slate-200 text-sm">
                          {result.summary.appliesTransportAllowance
                            ? `Sí aplica (${formatCOP(transportAllowanceLegal)})`
                            : 'No aplica en base'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla Detallada de Conceptos */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 text-base">
                        Desglose Técnico y Normativo por Concepto
                      </h3>
                      <span className="text-xs text-slate-500">
                        Valores redondeados al peso
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {/* Fila 1: Cesantías */}
                      <div className="p-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              1. Auxilio de Cesantías
                            </span>
                            <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {result.breakdown.cesantias.legalBasis}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              Fórmula: {result.breakdown.cesantias.formulaDescription}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            {formatCOP(result.breakdown.cesantias.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Intereses a las Cesantías */}
                      <div className="p-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              2. Intereses sobre las Cesantías (12% anual)
                            </span>
                            <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {result.breakdown.interesesCesantias.legalBasis}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              Fórmula: {result.breakdown.interesesCesantias.formulaDescription}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            {formatCOP(result.breakdown.interesesCesantias.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 3: Prima de Servicios */}
                      <div className="p-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              3. Prima de Servicios (Semestre en curso)
                            </span>
                            <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {result.breakdown.primaServicios.legalBasis}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              Fórmula: {result.breakdown.primaServicios.formulaDescription}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            {formatCOP(result.breakdown.primaServicios.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 4: Vacaciones */}
                      <div className="p-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              4. Compensación de Vacaciones en Dinero
                            </span>
                            <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {result.breakdown.vacaciones.legalBasis}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              Causadas: {result.breakdown.vacaciones.accruedDays} días | Tomadas:{' '}
                              {vacationDaysTaken} días |{' '}
                              <strong>
                                Pendientes: {result.breakdown.vacaciones.pendingDays} días
                              </strong>
                            </p>
                            <p className="text-xs text-slate-500">
                              Fórmula: {result.breakdown.vacaciones.formulaDescription}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900 text-base">
                            {formatCOP(result.breakdown.vacaciones.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 5: Indemnización Art. 64 CST */}
                      <div className="p-4 bg-amber-50/60 hover:bg-amber-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-amber-950 text-sm">
                              5. Indemnización por Despido sin Justa Causa
                            </span>
                            <span className="ml-2 text-xs bg-amber-200/80 text-amber-900 font-medium px-2 py-0.5 rounded">
                              {result.breakdown.indemnizacion.legalBasis}
                            </span>
                            <p className="text-xs text-amber-800 mt-1">
                              {result.breakdown.indemnizacion.formulaDescription}
                            </p>
                          </div>
                          <span className="font-bold text-amber-900 text-base">
                            {formatCOP(result.breakdown.indemnizacion.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta Informativa de Sanción Moratoria (Art. 65 CST) */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        Referencia Procesal: Indemnización Moratoria (Art. 65 CST)
                      </h4>
                      <p className="text-xs text-indigo-800 mt-1">
                        {result.moratoriaReference.legalNote}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0 bg-white px-4 py-2 rounded-lg border border-indigo-100">
                      <span className="text-[11px] text-slate-500 block">
                        Salario diario de retardo
                      </span>
                      <span className="text-sm font-bold text-indigo-700">
                        {formatCOP(result.moratoriaReference.dailyRate)} / día
                      </span>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}