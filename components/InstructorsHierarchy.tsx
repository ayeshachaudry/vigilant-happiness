'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Faculty {
    id: string;
    name: string;
    designation: string;
    department: string;
    university?: string;
    campus?: string;
}

export default function InstructorsHierarchy() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUniversity, setSelectedUniversity] = useState<string>('');
    const [selectedCampus, setSelectedCampus] = useState<string>('');

    useEffect(() => {
        const fetchFaculty = async () => {
            const { data, error } = await supabase
                .from('faculty')
                .select()
                .eq('designation', 'Instructor');

            if (error) {
                console.error('Error fetching faculty:', error);
            } else {
                setFaculty(data || []);
                // Set default university to first one found
                const unis = [...new Set((data || []).map(f => f.university).filter(Boolean))];
                if (unis.length > 0) setSelectedUniversity(unis[0]);
            }
            setLoading(false);
        };

        fetchFaculty();
    }, []);

    const universities = [...new Set(faculty.map(f => f.university).filter(Boolean))];
    const campuses = [...new Set(
        faculty
            .filter(f => f.university === selectedUniversity)
            .map(f => f.campus)
            .filter(Boolean)
    )];
    const departments = [...new Set(
        faculty
            .filter(f => f.university === selectedUniversity && f.campus === selectedCampus)
            .map(f => f.department)
            .filter(Boolean)
    )];

    const filtered = faculty.filter(
        f => f.university === selectedUniversity &&
            (selectedCampus ? f.campus === selectedCampus : true)
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white p-8 text-center">
                    <p className="text-[var(--accent)]">Loading instructors...</p>
                </div>
            </div>
        );
    }

    if (faculty.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-gray-800 border border-[var(--accent-2)]/30 rounded-lg p-8 text-center max-w-md">
                    <p className="text-[var(--accent-2)] text-lg font-semibold mb-2">No instructors found</p>
                    <p className="text-gray-400 text-sm">Please run the load script to populate the database:</p>
                    <code className="block bg-black px-3 py-2 rounded mt-3 text-[var(--accent)] text-xs font-mono overflow-auto">
                        python scripts/load_all_instructors.py
                    </code>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* University Selection */}
            {universities.length > 0 && (
                <div>
                    <h3 className="text-[var(--accent-2)] text-xs uppercase tracking-widest font-bold mb-3">University</h3>
                    <div className="flex flex-wrap gap-2">
                        {universities.map(uni => (
                            <button
                                key={uni}
                                onClick={() => {
                                    setSelectedUniversity(uni);
                                    setSelectedCampus('');
                                }}
                                className={`px-4 py-2 rounded border-2 transition-all font-medium ${selectedUniversity === uni
                                        ? 'border-[var(--accent)] bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/50'
                                        : 'border-gray-600 text-gray-300 hover:border-[var(--accent-2)]'
                                    }`}
                            >
                                {uni}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Campus Selection */}
            {campuses.length > 0 && (
                <div>
                    <h3 className="text-[var(--accent-2)] text-xs uppercase tracking-widest font-bold mb-3">Campus</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCampus('')}
                            className={`px-4 py-2 rounded border-2 transition-all font-medium ${selectedCampus === ''
                                    ? 'border-[var(--accent)] bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/50'
                                    : 'border-gray-600 text-gray-300 hover:border-[var(--accent-2)]'
                                }`}
                        >
                            All ({filtered.length})
                        </button>
                        {campuses.map(campus => {
                            const count = faculty.filter(
                                f => f.university === selectedUniversity && f.campus === campus
                            ).length;
                            return (
                                <button
                                    key={campus}
                                    onClick={() => setSelectedCampus(campus)}
                                    className={`px-4 py-2 rounded border-2 transition-all font-medium ${selectedCampus === campus
                                            ? 'border-[var(--accent)] bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/50'
                                            : 'border-gray-600 text-gray-300 hover:border-[var(--accent-2)]'
                                        }`}
                                >
                                    {campus} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Department Grid */}
            {departments.length > 1 && (
                <div>
                    <h3 className="text-[var(--accent-2)] text-xs uppercase tracking-widest font-bold mb-3">Departments</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {departments.map(dept => {
                            const count = faculty.filter(
                                f => f.university === selectedUniversity &&
                                    f.campus === selectedCampus &&
                                    f.department === dept
                            ).length;
                            return (
                                <div
                                    key={dept}
                                    className="bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-xs"
                                >
                                    <p className="text-[var(--accent-2)] font-semibold truncate">{dept}</p>
                                    <p className="text-gray-400 text-[11px]">{count} instructor{count !== 1 ? 's' : ''}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Instructors Grid */}
            <div>
                <h3 className="text-[var(--accent-2)] text-xs uppercase tracking-widest font-bold mb-4">
                    Instructors ({filtered.length})
                </h3>
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(instructor => (
                            <div
                                key={instructor.id}
                                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-[var(--accent)]/30 rounded-lg p-4 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20 transition-all"
                            >
                                <h3 className="text-[var(--accent)] font-bold text-sm mb-1 line-clamp-2">{instructor.name}</h3>
                                <p className="text-[var(--accent-2)] text-xs uppercase tracking-widest font-semibold mb-3">Instructor</p>
                                <div className="space-y-1 text-xs text-gray-400 border-t border-gray-700 pt-3">
                                    {instructor.department && <p><span className="text-[var(--accent-2)] font-semibold">Dept:</span> {instructor.department}</p>}
                                    {instructor.campus && <p><span className="text-[var(--accent-2)] font-semibold">Campus:</span> {instructor.campus}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                        <p className="text-gray-400">No instructors found for the selected campus.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
