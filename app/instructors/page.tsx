import InstructorsHierarchy from "@/components/InstructorsHierarchy";

export default function InstructorsPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
                <h1 className="text-5xl lg:text-6xl font-bold text-[var(--accent)] mb-2 tracking-tight">
                    Faculty Instructors
                </h1>
                <p className="text-gray-400 mb-12">
                    Explore our teaching staff across campuses and departments
                </p>
                <InstructorsHierarchy />
            </div>
        </main>
    );
}
