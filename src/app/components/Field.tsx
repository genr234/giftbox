export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <span className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wide">
                {label}
            </span>
            {children}
        </div>
    );
}