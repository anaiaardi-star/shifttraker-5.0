
import React, { useState, useEffect, useMemo } from 'react';
import { ApiService, Shift } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const MyReports = () => {
    const { t, language } = useLanguage();
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timezone, setTimezone] = useState('America/New_York');
    
    // Estados para filtro de fecha
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadData = async (tzOverride?: string) => {
        setLoading(true);
        try {
            const user = ApiService.getCurrentUser();
            const tz = tzOverride || timezone;
            const data = await ApiService.fetchMyReports(tz);
            
            // Filtro de seguridad en el frontend: solo mostrar registros del usuario actual
            // a menos que sea un Admin (aunque en My Reports lo ideal es ver solo lo propio)
            const myData = data.filter(s => s.userEmail === user?.email);
            
            const sorted = [...myData].sort((a, b) => {
                const dateA = new Date(a.rawDate).getTime();
                const dateB = new Date(b.rawDate).getTime();
                return isNaN(dateB) ? 1 : dateB - dateA;
            });
            setShifts(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const user = ApiService.getCurrentUser();
            if (user) {
                const tz = await ApiService.getUserTimezone(user);
                if (tz) {
                    setTimezone(tz);
                    loadData(tz);
                } else {
                    loadData();
                }
            } else {
                loadData();
            }
        };
        init();
    }, []);

    const filteredShifts = useMemo(() => {
        return shifts.filter(s => {
            const matchesSearch = s.userName.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtro de estado
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' ? s.isInProgress : !s.isInProgress);
            
            // Filtro de rango de fechas
            let matchesDate = true;
            if (s.rawDate) {
                const shiftDate = new Date(s.rawDate);
                shiftDate.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación exacta de días

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (shiftDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(0, 0, 0, 0);
                    if (shiftDate > end) matchesDate = false;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [shifts, searchTerm, statusFilter, startDate, endDate]);

    const stats = useMemo(() => {
        const totalSecs = filteredShifts.reduce((acc, s) => acc + (s.seconds || 0), 0);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        return {
            totalHours: `${hrs}h ${mins}m`,
            count: filteredShifts.length,
            activeCount: filteredShifts.filter(s => s.isInProgress).length
        };
    }, [filteredShifts]);

    const getPointLink = (lat?: number, lng?: number) => {
        if (lat === undefined || lng === undefined) return '';
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    const getEmbedMapUrl = (lat?: number, lng?: number) => {
        if (lat === undefined || lng === undefined) return '';
        return `https://maps.google.com/maps?q=${lat},${lng}&hl=${language}&z=15&ie=UTF8&iwloc=near&output=embed`;
    };

    const handleExport = () => {
        if (filteredShifts.length === 0) return;

        const headers = [
            "Employee", "Role", "Email", "Start Date", "Start Time", 
            "End Date", "End Time", "Duration", "Seconds", "Status", 
            "Start Comment", "End Comment", "Start Map Link", "End Map Link"
        ];

        const csvRows = filteredShifts.map(s => [
            `"${s.userName}"`,
            `"${s.userRole}"`,
            `"${s.userEmail}"`,
            `"${s.date}"`,
            `"${s.startTime}"`,
            `"${s.endDate}"`,
            `"${s.endTime}"`,
            `"${s.duration}"`,
            s.seconds,
            `"${s.status}"`,
            `"${(s.comment_start || "").replace(/"/g, '""')}"`,
            `"${(s.comment_end || "").replace(/"/g, '""')}"`,
            `"${getPointLink(s.latitude, s.longitude)}"`,
            `"${getPointLink(s.latitude_end, s.longitude_end)}"`
        ]);

        const csvContent = [
            headers.join(","),
            ...csvRows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `My_Report_ShiftTrack_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-10 py-8 relative animate-in fade-in duration-500">
            {/* Header Principal */}
            <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
                <div className="flex min-w-72 flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">analytics</span>
                            {t('rep.analysis')}
                        </span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">{t('nav.my_reports')}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal">{t('rep.desc')} ({timezone})</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport} 
                        className="flex items-center justify-center rounded-xl h-11 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-xl">download</span>
                        {t('rep.export')}
                    </button>
                    <button onClick={loadData} disabled={loading} className="flex items-center justify-center rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg hover:scale-105 transition-all">
                        <span className={`material-symbols-outlined mr-2 text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        {t('rep.refresh')}
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-2 relative">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-1 block tracking-widest">{t('rep.filter_employee')}</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-1 block tracking-widest">{t('rep.from')}</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm shadow-sm focus:ring-4 focus:ring-primary/10" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-1 block tracking-widest">{t('rep.to')}</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm shadow-sm focus:ring-4 focus:ring-primary/10" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-1 block tracking-widest">{t('rep.filter_status')}</label>
                        <select 
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm shadow-sm focus:ring-4 focus:ring-primary/10" 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">{t('rep.all')}</option>
                            <option value="active">{t('rep.active')}</option>
                            <option value="completed">{t('rep.completed')}</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                        >
                            {t('rep.clear')}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* RESUMEN DE ESTADÍSTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">schedule</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">{t('rep.table_duration')}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalHours}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">list_alt</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">REGISTROS</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.count}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">EN CURSO</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeCount}</p>
                    </div>
                </div>
            </div>

            {/* TABLA DE REGISTROS */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-950 text-[10px] uppercase text-slate-400 font-black">
                            <tr>
                                <th className="px-8 py-5">{t('rep.table_name')}</th>
                                <th className="px-8 py-5 text-center">{t('rep.table_start')}</th>
                                <th className="px-8 py-5 text-center">{t('rep.table_end')}</th>
                                <th className="px-8 py-5 text-right">{t('rep.table_duration')}</th>
                                <th className="px-8 py-5 text-left">{t('rep.table_comment')}</th>
                                <th className="px-8 py-5 text-center">{t('rep.table_status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="py-24 text-center text-slate-400 animate-pulse font-bold tracking-widest">{t('rep.loading')}</td></tr>
                            ) : filteredShifts.length === 0 ? (
                                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold italic">{t('rep.no_results')}</td></tr>
                            ) : (
                                filteredShifts.map((s, i) => (
                                    <tr key={s.id || i} onClick={() => setSelectedShift(s)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white text-sm">{s.userName}</span>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{s.userRole}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-200">{s.startTime}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">{s.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-200">{s.endTime || '---'}</span>
                                                {s.endDate !== '---' && <span className="text-[9px] text-slate-400 font-bold">{s.endDate}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-xs text-primary">{s.duration}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                {s.comment_start && (
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={s.comment_start}>
                                                        📥 {s.comment_start}
                                                    </span>
                                                )}
                                                {s.comment_end && (
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate" title={s.comment_end}>
                                                        📤 {s.comment_end}
                                                    </span>
                                                )}
                                                {!s.comment_start && !s.comment_end && (
                                                    <span className="text-[10px] text-slate-400 italic">---</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {s.isInProgress ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase">
                                                    <span className="size-1.5 bg-success rounded-full animate-pulse"></span>
                                                    {t('rep.active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase">
                                                    {t('rep.completed')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETALLE DEL ITEM MODAL */}
            {selectedShift && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#f0f2f5] dark:bg-slate-950 w-full max-w-2xl rounded-[1.5rem] shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">
                        
                        {/* Header del Modal */}
                        <div className="p-6 bg-white dark:bg-slate-900 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">person</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none mb-1">{selectedShift.userName}</h2>
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">{selectedShift.userRole}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedShift(null)} className="size-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-danger border border-slate-200 dark:border-slate-700 transition-all">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            
                            {/* BLOCK 1 - START */}
                            <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                                <div className="bg-primary px-6 py-3 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-white text-lg font-bold">login</span>
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                                        {t('rep.modal_block1')}
                                    </span>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_date_start')}</label>
                                            <p className="text-base font-extrabold text-slate-900 dark:text-white">{selectedShift.date}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_time_start')}</label>
                                            <p className="text-3xl font-black text-primary">{selectedShift.startTime}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_iso_start')}</label>
                                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-xl">
                                            <p className="text-xs font-mono text-slate-500 break-all">{selectedShift.rawDate}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_comm_start')}</label>
                                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-xl min-h-[60px]">
                                            <p className="text-sm italic text-slate-600 dark:text-slate-400">
                                                {selectedShift.comment_start || '---'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('rep.modal_loc_start')}</label>
                                        {selectedShift.latitude !== undefined && selectedShift.longitude !== undefined ? (
                                            <div className="w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner relative group cursor-pointer"
                                                 onClick={() => window.open(getPointLink(selectedShift.latitude, selectedShift.longitude), '_blank')}>
                                                <iframe 
                                                    width="100%" height="100%" style={{ border: 0 }} 
                                                    loading="lazy" allowFullScreen 
                                                    src={getEmbedMapUrl(selectedShift.latitude, selectedShift.longitude)}
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <div className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
                                                <p className="text-[10px] text-slate-400 font-bold italic tracking-widest uppercase">No location data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2 - END */}
                            <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                                <div className="bg-slate-900 px-6 py-3 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-white text-lg font-bold">logout</span>
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                                        {t('rep.modal_block2')}
                                    </span>
                                </div>
                                <div className="p-6 space-y-5">
                                    {selectedShift.isInProgress ? (
                                        <div className="py-10 text-center bg-success/5 rounded-xl border border-success/10 flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-success text-3xl animate-pulse">timer</span>
                                            <p className="text-success text-xs font-black uppercase tracking-widest">
                                                {t('rep.modal_in_progress_msg')}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_date_end')}</label>
                                                    <p className="text-base font-extrabold text-slate-900 dark:text-white">{selectedShift.endDate}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_time_end')}</label>
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{selectedShift.endTime}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_iso_end')}</label>
                                                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-xl">
                                                    <p className="text-xs font-mono text-slate-500 break-all">{selectedShift.rawEndTime || '---'}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('rep.modal_comm_end')}</label>
                                                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-xl min-h-[60px]">
                                                    <p className="text-sm italic text-slate-600 dark:text-slate-400">
                                                        {selectedShift.comment_end || '---'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('rep.modal_loc_end')}</label>
                                                {selectedShift.latitude_end !== undefined && selectedShift.longitude_end !== undefined ? (
                                                    <div className="w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner relative group cursor-pointer"
                                                         onClick={() => window.open(getPointLink(selectedShift.latitude_end, selectedShift.longitude_end), '_blank')}>
                                                        <iframe 
                                                            width="100%" height="100%" style={{ border: 0 }} 
                                                            loading="lazy" allowFullScreen 
                                                            src={getEmbedMapUrl(selectedShift.latitude_end, selectedShift.longitude_end)}
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
                                                        <p className="text-[10px] text-slate-400 font-bold italic tracking-widest uppercase">No location data</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Botón de Cierre Inferior */}
                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <button 
                                onClick={() => setSelectedShift(null)} 
                                className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-xl hover:bg-primary/90 transition-all uppercase text-xs tracking-widest"
                            >
                                {t('rep.modal_close_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
