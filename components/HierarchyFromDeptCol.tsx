'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FacultyRow {
    id?: string;
    name?: string;
    designation?: string;
    department?: string; // expected format: uni / campus / department
}

export default function HierarchyFromDeptCol() {
    const [rows, setRows] = useState<FacultyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedUni, setSelectedUni] = useState<string | null>(null);
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // structure: { [uni]: { [campus]: { [dept]: FacultyRow[] } }}
    const [structure, setStructure] = useState<Record<string, Record<string, Record<string, FacultyRow[]>>>>({});

    useEffect(() => {
        async function fetchRows() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('faculty')
                    .select('id,name,designation,department');

                console.log('Supabase fetch result:', { data, error });
                if (error) throw error;
                setRows(data || []);
            } catch (err: any) {
                console.error('Fetch error:', err);
                setError(err.message ?? String(err));
            } finally {
                setLoading(false);
            }
        }

        fetchRows();
    }, []);

    useEffect(() => {
        const map: Record<string, Record<string, Record<string, FacultyRow[]>>> = {};

        rows.forEach(r => {
            const raw = (r.department || '').trim();
            if (!raw) return;
            const parts = raw.split('/').map(p => p.trim()).filter(Boolean);
            let uni = parts[0] ?? 'Unknown';
            let campus = parts[1] ?? 'Unknown';
            let dept = parts.slice(2).join(' / ') || parts[2] || 'General';

            // If original format is exactly 3 parts use parts[2]
            if (parts.length === 3) dept = parts[2];
            if (parts.length < 3) {
                // fallback: if only two parts, treat second as department
                if (parts.length === 2) {
                    campus = parts[0];
                    uni = 'Default University';
                    dept = parts[1];
                }
            }

            if (!map[uni]) map[uni] = {};
            if (!map[uni][campus]) map[uni][campus] = {};
            if (!map[uni][campus][dept]) map[uni][campus][dept] = [];
            map[uni][campus][dept].push(r);
        });

        setStructure(map);

        // set defaults
        const unis = Object.keys(map);
        if (unis.length > 0 && !selectedUni) {
            setSelectedUni(unis[0]);
        }
    }, [rows]);

    if (loading) return <div className="p-8 text-center text-[var(--foreground)]">Loading hierarchy…</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;
    if (rows.length === 0) return <div className="p-8 text-center text-yellow-400">No faculty data found in database. Please upload data first.</div>;

    const universities = Object.keys(structure);
    const campuses = selectedUni ? Object.keys(structure[selectedUni] || {}) : [];
    const departments = (selectedUni && selectedCampus) ? Object.keys(structure[selectedUni]?.[selectedCampus] || {}) : [];

    const currentInstructors = (selectedUni && selectedCampus && selectedDept)
        ? (structure[selectedUni]?.[selectedCampus]?.[selectedDept] || [])
        : [];

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-[var(--accent)]">Faculty Hierarchy</h2>

            <div>
                <h4 className="text-xs text-[var(--accent-2)] uppercase mb-2">University</h4>
                <div className="flex gap-2 flex-wrap">
                    {universities.map(u => (
                        <button key={u}
                            className={`px-4 py-2 rounded ${selectedUni === u ? 'bg-[var(--accent)] text-black font-semibold' : 'bg-transparent border border-gray-700 text-[var(--foreground)]'}`}
                            onClick={() => { setSelectedUni(u); setSelectedCampus(null); setSelectedDept(null); }}
                        >{u}</button>
                    ))}
                </div>
            </div>

            {selectedUni && (
                <div>
                    <h4 className="text-xs text-[var(--accent-2)] uppercase mb-2">Campus</h4>
                    <div className="flex gap-2 flex-wrap">
                        <button className={`px-4 py-2 rounded ${selectedCampus === null ? 'bg-[var(--accent)] text-black font-semibold' : 'bg-transparent border border-gray-700 text-[var(--foreground)]'}`} onClick={() => { setSelectedCampus(null); setSelectedDept(null); }}>All</button>
                        {campuses.map(c => {
                            const count = Object.values(structure[selectedUni][c]).reduce((s, arr) => s + arr.length, 0);
                            return (
                                <button key={c}
                                    className={`px-4 py-2 rounded ${selectedCampus === c ? 'bg-[var(--accent)] text-black font-semibold' : 'bg-transparent border border-gray-700 text-[var(--foreground)]'}`}
                                    onClick={() => { setSelectedCampus(c); setSelectedDept(null); }}
                                >{c} ({count})</button>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedCampus && (
                <div>
                    <h4 className="text-xs text-[var(--accent-2)] uppercase mb-2">Department</h4>
                    <div className="flex gap-2 flex-wrap">
                        {departments.map(d => {
                            const count = (structure[selectedUni][selectedCampus][d] || []).length;
                            return (
                                <button key={d}
                                    className={`px-4 py-2 rounded ${selectedDept === d ? 'bg-[var(--accent)] text-black font-semibold' : 'bg-transparent border border-gray-700 text-[var(--foreground)]'}`}
                                    onClick={() => setSelectedDept(d)}
                                >{d} ({count})</button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <h4 className="text-xs text-[var(--accent-2)] uppercase mb-2">Instructors</h4>
                {selectedDept ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentInstructors.map((ins, idx) => (
                            <Link href={`/faculty/${ins.id}`} key={ins.id || idx}>
                                <div className="p-4 rounded futuristic-card cursor-pointer hover:opacity-80 transition-opacity">
                                    <p className="font-semibold text-[var(--foreground)]">{ins.name}</p>
                                    <p className="text-sm text-gray-300">{ins.designation}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Select a department to view instructors.</p>
                )}
            </div>
        </div>
    );
}
