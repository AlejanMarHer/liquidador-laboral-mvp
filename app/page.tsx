'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  calculateLaborSettlement,
  ContractType,
  TerminationReason,
  SettlementInput,
} from './settlementCalculator';

export default function LiquidadorLaboralPage() {
  // 1. ESTADOS INICIALES EN BLANCO (Partes)
  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [employerName, setEmployerName] = useState('');

  // 2. DATOS DEL ABOGADO AHORA EN BLANCO (Universal)
  const [lawyerName, setLawyerName] = useState('');
  const [lawyerLicense, setLawyerLicense] = useState('');

  // FECHAS VACÍAS
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');

  const [contractType, setContractType] = useState<ContractType>('INDEFINIDO');
  const [terminationReason, setTerminationReason] = useState<TerminationReason>('SIN_JUSTA_CAUSA');

  // SALARIOS Y NOVEDADES VACÍAS
  const [baseSalary, setBaseSalary] = useState<number | string>('');
  const [variableSalaryAvg, setVariableSalaryAvg] = useState<number | string>('');
  const [isIntegralSalary, setIsIntegralSalary] = useState<boolean>(false);
  const [forceExcludeTransport, setForceExcludeTransport] = useState<boolean>(false);

  // VALORES LEGALES (Inician con 2026 pero se auto-actualizan)
  const [smmlv, setSmmlv] = useState<number | string>(1750905);
  const [transportAllowanceLegal, setTransportAllowanceLegal] = useState<number | string>(249095);

  const [vacationDaysTaken, setVacationDaysTaken] = useState<number | string>('');
  const [unpaidLeaveDaysCurrentYear, setUnpaidLeaveDaysCurrentYear] = useState<number | string>('');
  const [unpaidLeaveDaysTotal, setUnpaidLeaveDaysTotal] = useState<number | string>('');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<boolean>(false);

  // DICCIONARIO HISTÓRICO DE SALARIOS
  const historicalWages: Record<number, { smmlv: number, aux: number }> = {
    2023: { smmlv: 1160000, aux: 140606 },
    2024: { smmlv: 1300000, aux: 162000 },
    2025: { smmlv: 1423500, aux: 200000 },
    2026: { smmlv: 1750905, aux: 249095 },
  };

  useEffect(() => {
    if (!endDate) return;
    const year = new Date(endDate).getFullYear();
    if (historicalWages[year]) {
      setSmmlv(historicalWages[year].smmlv);
      setTransportAllowanceLegal(historicalWages[year].aux);
    }
  }, [endDate]);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const calculationState = useMemo(() => {
    if (!startDate || !endDate || baseSalary === '') {
      return { result: null, error: null };
    }

    try {
      const input: SettlementInput = {
        startDate, endDate,
        expectedEndDate: contractType !== 'INDEFINIDO' && terminationReason === 'SIN_JUSTA_CAUSA' ? expectedEndDate : undefined,
        contractType, terminationReason,
        baseSalary: Number(baseSalary) || 0,
        variableSalaryAvg: Number(variableSalaryAvg) || 0,
        isIntegralSalary,
        smmlv: Number(smmlv) || 1750905,
        transportAllowanceLegal: Number(transportAllowanceLegal) || 249095,
        forceExcludeTransportAllowance: forceExcludeTransport,
        vacationDaysTaken: Number(vacationDaysTaken) || 0,
        unpaidLeaveDaysCurrentYear: Number(unpaidLeaveDaysCurrentYear) || 0,
        unpaidLeaveDaysTotal: Number(unpaidLeaveDaysTotal) || 0,
      };

      const result = calculateLaborSettlement(input);
      return { result, error: null };
    } catch (err: any) {
      return { result: null, error: err.message || 'Verifica la coherencia de las fechas.' };
    }
  }, [
    startDate, endDate, expectedEndDate, contractType, terminationReason,
    baseSalary, variableSalaryAvg, isIntegralSalary, smmlv, transportAllowanceLegal,
    forceExcludeTransport, vacationDaysTaken, unpaidLeaveDaysCurrentYear, unpaidLeaveDaysTotal,
  ]);

  const { result, error } = calculationState;

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      setIsGeneratingPdf(true);
      const { pdf } = await import('@react-pdf/renderer');
      const { SettlementPdfDocument } = await import('./SettlementPdfDocument');

      const doc = (
        <SettlementPdfDocument
          data={{
            workerName: workerName || 'Sin Nombre', 
            workerId: workerId || 'N/A', 
            employerName: employerName || 'Sin Nombre', 
            lawyerName: lawyerName || 'No especificado', 
            lawyerLicense: lawyerLicense || 'No especificada', 
            startDate, endDate, contractType, terminationReason, 
            baseSalary: Number(baseSalary), result,
          }}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dictamen_${workerName.replace(/\s+/g, '_') || 'Laboral'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando el PDF:', err);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!result) return;
    try {
      setIsGeneratingExcel(true);
      const XLSX = await import('xlsx');

      const wsData = [
        ['DICTAMEN TÉCNICO DE LIQUIDACIÓN LABORAL'],
        ['Generado por:', lawyerName || 'No especificado', lawyerLicense || 'No especificada'],
        [],
        ['1. DATOS DE LAS PARTES'],
        ['Trabajador', workerName || 'Sin Nombre', 'Cédula', workerId],
        ['Empleador', employerName || 'Sin Nombre'],
        [],
        ['2. VIGENCIA Y MODALIDAD'],
        ['Fecha Inicio', startDate, 'Fecha Terminación', endDate],
        ['Modalidad Contractual', contractType, 'Causal de Salida', terminationReason],
        ['Días Efectivos', result.summary.effectiveDaysContract],
        [],
        ['3. ESTRUCTURA SALARIAL'],
        ['Salario Básico', Number(baseSalary), 'Variable Promedio', Number(variableSalaryAvg)],
        ['Base Prestacional (IBL)', result.breakdown.cesantias.baseSalaryUsed],
        ['Auxilio de Transporte', result.summary.appliesTransportAllowance ? Number(transportAllowanceLegal) : 0],
        [],
        ['4. DESGLOSE DE LIQUIDACIÓN', 'Fórmula / Base', 'Valor Liquidado'],
        ['Auxilio de Cesantías', result.breakdown.cesantias.formulaDescription, result.breakdown.cesantias.amount],
        ['Intereses a Cesantías', result.breakdown.interesesCesantias.formulaDescription, result.breakdown.interesesCesantias.amount],
        ['Prima de Servicios', result.breakdown.primaServicios.formulaDescription, result.breakdown.primaServicios.amount],
        ['Vacaciones Compensadas', result.breakdown.vacaciones.formulaDescription, result.breakdown.vacaciones.amount],
        ['Indemnización (Art. 64)', result.breakdown.indemnizacion.formulaDescription, result.breakdown.indemnizacion.amount],
        [],
        ['RESUMEN FINANCIERO'],
        ['Subtotal Prestaciones', '', result.summary.totalPrestaciones],
        ['Subtotal Indemnización', '', result.summary.totalIndemnizacion],
        ['TOTAL GENERAL', '', result.summary.grandTotal]
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 20 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Liquidación');

      XLSX.writeFile(wb, `Liquidacion_${workerName.replace(/\s+/g, '_') || 'Laboral'}.xlsx`);
    } catch (err) {
      console.error('Error generando Excel:', err);
      alert('Hubo un error al generar el archivo Excel.');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm flex flex-col">
        {/* --- NUEVO BOTÓN DE VOLVER (RUTA ABSOLUTA) --- */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-2.5">
          <a 
            href="https://legalapp-hub.vercel.app/dashboard" 
            target="_parent" 
            className="inline-flex items-center text-sm font-semibold text-[#1E3A8A] hover:text-blue-700 transition gap-1.5"
          >
            &larr; Volver al Despacho
          </a>
        </div>
        
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-2.5 rounded-xl shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Liquidador de Prestaciones e Indemnizaciones</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Cómputo Comercial 30/360 • Art. 64 CST</p>
            </div>
          </div>

          {result && !error && (
            <div className="flex items-center gap-3">
              <button onClick={handleDownloadExcel} disabled={isGeneratingExcel} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm transition-all">
                {isGeneratingExcel ? 'Procesando...' : '📊 Exportar Excel'}
              </button>
              <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-400 text-white font-medium text-sm px-6 py-2.5 rounded-full shadow-md transition-all">
                {isGeneratingPdf ? 'Generando PDF...' : '📄 Exportar PDF'}
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"></div>
            <h2 className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-xs">1</span>
              Datos de las Partes y Liquidador
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trabajador</label>
                <input type="text" value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Ej. Ana Gómez" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cédula</label>
                  <input type="text" value={workerId} onChange={(e) => setWorkerId(e.target.value)} placeholder="Opcional" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Empleador</label>
                  <input type="text" value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Razón Social o Persona" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Suscrito por (Firma del Dictamen)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Abogado</label>
                    <input type="text" value={lawyerName} onChange={(e) => setLawyerName(e.target.value)} placeholder="Ej. Alejandro Martínez" className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tarjeta Profesional</label>
                    <input type="text" value={lawyerLicense} onChange={(e) => setLawyerLicense(e.target.value)} placeholder="Ej. T.P. 123456" className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"></div>
            <h2 className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-xs">2</span>
              Vigencia y Modalidad
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Inicio</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Terminación</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Contrato</label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value as ContractType)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer outline-none">
                    <option value="INDEFINIDO">Término Indefinido</option>
                    <option value="FIJO">Término Fijo</option>
                    <option value="OBRA_LABOR">Obra o Labor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Causal de Salida</label>
                  <select value={terminationReason} onChange={(e) => setTerminationReason(e.target.value as TerminationReason)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer outline-none">
                    <option value="SIN_JUSTA_CAUSA">Despido Sin Justa Causa</option>
                    <option value="RENUNCIA_O_MUTUO_ACUERDO">Renuncia / Mutuo Acuerdo</option>
                    <option value="JUSTA_CAUSA">Con Justa Causa (Art 62)</option>
                    <option value="EXPIRACION_PLAZO">Fin del Plazo / Obra</option>
                  </select>
                </div>
              </div>

              {contractType !== 'INDEFINIDO' && terminationReason === 'SIN_JUSTA_CAUSA' && (
                <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1.5">Vencimiento pactado (Para indemnización)</label>
                  <input type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} className="w-full bg-white border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" />
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"></div>
            <h2 className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-xs">3</span>
              Estructura Salarial
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Básico Fijo ($)</label>
                  <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ej. 1500000" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Variable Mensual ($)</label>
                  <input type="number" value={variableSalaryAvg} onChange={(e) => setVariableSalaryAvg(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Comisiones..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SMMLV Vigente ($)</label>
                  <input type="number" value={smmlv} onChange={(e) => setSmmlv(e.target.value)} className="w-full bg-indigo-50/30 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Aux. Transporte Legal ($)</label>
                  <input type="number" value={transportAllowanceLegal} onChange={(e) => setTransportAllowanceLegal(e.target.value)} className="w-full bg-indigo-50/30 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group/check">
                  <div className="relative flex items-center">
                    <input type="checkbox" checked={isIntegralSalary} onChange={(e) => setIsIntegralSalary(e.target.checked)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600" />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover/check:text-indigo-700 transition-colors">Es Salario Integral (Art. 132 CST)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group/check">
                  <div className="relative flex items-center">
                    <input type="checkbox" checked={forceExcludeTransport} onChange={(e) => setForceExcludeTransport(e.target.checked)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600" />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover/check:text-indigo-700 transition-colors">Forzar exclusión de Aux. Transporte</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors duration-300"></div>
            <h2 className="flex items-center gap-3 text-sm font-bold text-slate-800 mb-5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-xs">4</span>
              Novedades (Días)
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col justify-end">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 leading-tight">Vacaciones tomadas</label>
                <input type="number" min="0" value={vacationDaysTaken} onChange={(e) => setVacationDaysTaken(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:bg-white outline-none" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 leading-tight">Lic. no rem. (año)</label>
                <input type="number" min="0" value={unpaidLeaveDaysCurrentYear} onChange={(e) => setUnpaidLeaveDaysCurrentYear(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:bg-white outline-none" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 leading-tight">Lic. no rem. (total)</label>
                <input type="number" min="0" value={unpaidLeaveDaysTotal} onChange={(e) => setUnpaidLeaveDaysTotal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:bg-white outline-none" />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-7">
          <div className="sticky top-32 space-y-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm mt-6">
                <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Alerta de Cálculo</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            ) : result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-700/50 pb-6 mb-6 gap-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Total Liquidación
                      </h3>
                      <p className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                        {formatCOP(result.summary.grandTotal)}
                      </p>
                    </div>
                    <div className="md:text-right text-xs text-slate-300 space-y-1.5 bg-slate-950/30 px-4 py-3 rounded-2xl backdrop-blur-sm border border-slate-700/50">
                      <p><span className="text-slate-400 font-medium">Trabajador:</span> <strong className="text-white ml-1">{workerName || 'Por definir'}</strong></p>
                      <p><span className="text-slate-400 font-medium">Tiempo efectivo:</span> <span className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded ml-1 font-semibold border border-indigo-500/20">{result.summary.effectiveDaysContract} días</span></p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 font-medium">Sub. Prestaciones</span>
                      <span className="font-bold text-white text-lg tracking-tight">{formatCOP(result.summary.totalPrestaciones)}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 font-medium">Sub. Indemnización</span>
                      <span className="font-bold text-amber-300 text-lg tracking-tight">{formatCOP(result.summary.totalIndemnizacion)}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 font-medium">Auxilio Transporte</span>
                      <span className="font-semibold text-emerald-300 text-sm mt-0.5 block">
                        {result.summary.appliesTransportAllowance ? 'Sí aplica en IBL' : 'No incluido'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden mt-6">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm">Desglose Técnico y Normativo</h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      { title: 'Auxilio de Cesantías', data: result.breakdown.cesantias },
                      { title: 'Intereses a Cesantías', data: result.breakdown.interesesCesantias },
                      { title: 'Prima de Servicios', data: result.breakdown.primaServicios },
                      { title: 'Vacaciones Compensadas', data: result.breakdown.vacaciones },
                    ].map((item, idx) => (
                      <div key={idx} className="p-5 flex justify-between items-center hover:bg-slate-50/80 transition-colors group">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 text-sm">{item.title}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-md border border-slate-200">{item.data.legalBasis}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5 font-mono bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">{item.data.formulaDescription}</p>
                        </div>
                        <span className="font-bold text-slate-800 text-[15px]">{formatCOP(item.data.amount)}</span>
                      </div>
                    ))}
                    
                    <div className="p-5 flex justify-between items-center bg-amber-50/30 hover:bg-amber-50/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-900 text-sm">Indemnización (Art. 64)</span>
                        </div>
                        <p className="text-xs text-amber-700/80 mt-1.5 max-w-sm leading-relaxed">{result.breakdown.indemnizacion.formulaDescription}</p>
                      </div>
                      <span className="font-bold text-amber-600 text-[15px]">{formatCOP(result.breakdown.indemnizacion.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ESTADO PENDIENTE (EMPTY STATE) CUANDO INICIA EN BLANCO */
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-3xl shadow-sm ring-1 ring-slate-200/50 p-8 text-center mt-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-slate-50/50">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Dictamen Pendiente</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Ingresa las fechas de inicio y terminación junto con el salario para visualizar la liquidación automática.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}