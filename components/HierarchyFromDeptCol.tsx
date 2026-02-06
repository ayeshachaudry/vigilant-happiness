'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface FacultyRow {
    id?: string;
    name?: string;
    designation?: string;
    department?: string;
}

interface HierarchyStructure {
    [uni: string]: {
        [campus: string]: {
            [dept: string]: number; // count only, lazy load faculty later
        };
    };
}

export default function HierarchyFromDeptCol() {
    const [structure, setStructure] = useState<HierarchyStructure>({});
    const [loadingHierarchy, setLoadingHierarchy] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedUni, setSelectedUni] = useState<string | null>(null);
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // Cache of fetched faculty for selected department
    const [currentInstructors, setCurrentInstructors] = useState<FacultyRow[]>([]);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    // Load hierarchy structure (metadata only) once on mount
    useEffect(() => {
        async function fetchHierarchyStructure() {
            setLoadingHierarchy(true);
            try {
                // Fetch all faculty to build hierarchy structure - get all in one call
                // Structure only stores counts, not individual records
                const response = await fetch('/api/faculty?limit=1000&page=1');
                if (!response.ok) throw new Error('Failed to fetch faculty');

                const { data } = await response.json();
                const map: HierarchyStructure = {};

                (data || []).forEach((r: FacultyRow) => {
                    const raw = (r.department || '').trim();
                    if (!raw) return;
                    const parts = raw.split('/').map(p => p.trim()).filter(Boolean);

                    let uni = parts[0] ?? 'Unknown';
                    let campus = parts[1] ?? 'Unknown';
                    let dept = parts[2] ?? 'General';

                    if (parts.length < 3 && parts.length === 2) {
                        campus = parts[0];
                        uni = 'Default University';
                        dept = parts[1];
                    }

                    if (!map[uni]) map[uni] = {};
                    if (!map[uni][campus]) map[uni][campus] = {};
                    map[uni][campus][dept] = (map[uni][campus][dept] || 0) + 1;
                });

                setStructure(map);

                // Set default university
                const unis = Object.keys(map);
                if (unis.length > 0) {
                    setSelectedUni(unis[0]);
                }
            } catch (err: any) {
                console.error('Hierarchy fetch error:', err);
                setError(err.message ?? String(err));
            } finally {
                setLoadingHierarchy(false);
            }
        }

        fetchHierarchyStructure();
    }, []);

    // Log structure for debugging
    useEffect(() => {
        if (Object.keys(structure).length > 0) {
            console.log('=== HIERARCHY STRUCTURE ===');
            console.log('Universities:', Object.keys(structure));
            Object.entries(structure).forEach(([uni, campusMap]) => {
                console.log(`  ${uni}:`, Object.keys(campusMap));
                Object.entries(campusMap).forEach(([campus, deptMap]) => {
                    console.log(`    ${campus}:`, Object.keys(deptMap));
                });
            });
        }
    }, [structure]);

    // Lazy load faculty when department is selected
    useEffect(() => {
        if (!selectedUni || !selectedCampus || !selectedDept) {
            setCurrentInstructors([]);
            return;
        }

        async function fetchDepartmentFaculty() {
            setLoadingInstructors(true);
            try {
                // Use department column matching the format from hierarchy
                const deptFilter = `${selectedCampus} / ${selectedDept}`;
                const fetchUrl = `/api/faculty?department=${encodeURIComponent(deptFilter)}&limit=200&page=1`;

                console.log('Fetching faculty for:', { selectedUni, selectedCampus, selectedDept, deptFilter, fetchUrl });

                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error('Failed to fetch faculty');

                const { data, pagination } = await response.json();
                console.log('Received faculty data:', { count: data?.length, data, pagination });

                setCurrentInstructors(data || []);
            } catch (err: any) {
                console.error('Faculty fetch error:', err);
                setError(err.message ?? String(err));
                setCurrentInstructors([]);
            } finally {
                setLoadingInstructors(false);
            }
        }

        fetchDepartmentFaculty();
    }, [selectedUni, selectedCampus, selectedDept]);

    if (loadingHierarchy) return <div className="p-8 text-center text-[var(--foreground)]">Loading hierarchy…</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;

    const universities = Object.keys(structure);
    if (universities.length === 0) return <div className="p-8 text-center text-yellow-400">No faculty data found in database. Please upload data first.</div>;

    const campuses = selectedUni ? Object.keys(structure[selectedUni] || {}) : [];
    const departments = (selectedUni && selectedCampus) ? Object.keys(structure[selectedUni]?.[selectedCampus] || {}) : [];

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
                        {campuses.length > 0 ? (
                            campuses.map(c => {
                                const count = Object.values(structure[selectedUni][c]).reduce((s, n) => s + n, 0);
                                return (
                                    <button key={c}
                                        className={`px-4 py-2 rounded ${selectedCampus === c ? 'bg-[var(--accent)] text-black font-semibold' : 'bg-transparent border border-gray-700 text-[var(--foreground)]'}`}
                                        onClick={() => { setSelectedCampus(c); setSelectedDept(null); }}
                                    >{c} ({count})</button>
                                );
                            })
                        ) : (
                            <p className="text-yellow-400">No campuses found. Check database format (should be: University / Campus / Department)</p>
                        )}
                    </div>
                </div>
            )}

            {selectedCampus && (
                <div>
                    <h4 className="text-xs text-[var(--accent-2)] uppercase mb-2">Department</h4>
                    <div className="flex gap-2 flex-wrap">
                        {departments.map(d => {
                            const count = structure[selectedUni]?.[selectedCampus]?.[d] || 0;
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
                {loadingInstructors ? (
                    <p className="text-gray-400">Loading instructors…</p>
                ) : selectedDept ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentInstructors.length > 0 ? (
                            currentInstructors.map((ins, idx) => (
                                <Link href={`/faculty/${ins.id}`} key={ins.id || idx}>
                                    <div className="p-4 rounded futuristic-card cursor-pointer hover:opacity-80 transition-opacity">
                                        <p className="font-semibold text-[var(--foreground)]">{ins.name}</p>
                                        <p className="text-sm text-gray-300">{ins.designation}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-gray-400">No instructors found in this department.</p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400">Select a department to view instructors.</p>
                )}
            </div>
        </div>
    );
}
