export const GlassCard = ({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) => (
    <div className={`${dark ? 'bg-black/50 text-white' : 'bg-black/40'} backdrop-blur-md rounded-2xl border border-white/30 shadow-lg ${className}`}>
        {children}
    </div>
);