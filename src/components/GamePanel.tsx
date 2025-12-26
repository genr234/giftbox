export const GamePanel = ({
    children,
    className = "",
    variant = "default"
}: {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "dark" | "accent" | "wood";
}) => {
    const baseStyles = "relative rounded-lg shadow-xl";

    const variants = {
        default: "bg-gradient-to-b from-[#3d3a4a] to-[#2a2833] border-2 border-[#5a556a] text-amber-100",
        dark: "bg-gradient-to-b from-[#1f1d26] to-[#15141a] border-2 border-[#3d3a4a] text-amber-100",
        accent: "bg-gradient-to-b from-[#4a3f2a] to-[#342b1e] border-2 border-[#6b5a3a] text-amber-100",
        wood: "bg-gradient-to-b from-[#5a4530] to-[#3d2e20] border-2 border-[#7a6040] text-amber-100",
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {/* Inner shadow effect */}
            <div className="absolute inset-0 rounded-lg border border-white/5 pointer-events-none" />
            {/* Outer glow */}
            <div className="absolute -inset-[1px] rounded-lg bg-black/30 -z-10 blur-sm" />
            {children}
        </div>
    );
};

export const GameButton = ({
    children,
    onClick,
    disabled = false,
    variant = "default",
    className = "",
    size = "md"
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "primary" | "success" | "danger" | "gold";
    className?: string;
    size?: "sm" | "md" | "lg";
}) => {
    const variants = {
        default: "from-[#4a4560] to-[#363245] border-[#5a556a] hover:from-[#5a5570] hover:to-[#464255] text-amber-100",
        primary: "from-[#4a6090] to-[#354570] border-[#5a70a0] hover:from-[#5a70a0] hover:to-[#455580] text-blue-100",
        success: "from-[#3a6a4a] to-[#2a5038] border-[#4a7a5a] hover:from-[#4a7a5a] hover:to-[#3a6048] text-emerald-100",
        danger: "from-[#7a3a3a] to-[#5a2a2a] border-[#8a4a4a] hover:from-[#8a4a4a] hover:to-[#6a3a3a] text-red-100",
        gold: "from-[#8a7030] to-[#6a5020] border-[#a08040] hover:from-[#9a8040] hover:to-[#7a6030] text-yellow-100",
    };

    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                relative font-bold rounded-md border-2 shadow-md
                bg-gradient-to-b ${variants[variant]} ${sizes[size]}
                transition-all duration-100 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                ${className}
            `}
            style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)'
            }}
        >
            {children}
        </button>
    );
};

export const GameBadge = ({
    children,
    variant = "default",
    className = ""
}: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "info" | "gold";
    className?: string;
}) => {
    const variants = {
        default: "bg-[#3d3a4a] border-[#5a556a] text-amber-100",
        success: "bg-[#2a5038] border-[#4a7a5a] text-emerald-200",
        warning: "bg-[#6a5020] border-[#a08040] text-yellow-200",
        danger: "bg-[#5a2a2a] border-[#8a4a4a] text-red-200",
        info: "bg-[#354570] border-[#5a70a0] text-blue-200",
        gold: "bg-[#6a5020] border-[#a08040] text-yellow-100",
    };

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold
            ${variants[variant]} ${className}
        `}>
            {children}
        </span>
    );
};

export const GameProgressBar = ({
    value,
    max = 100,
    variant = "default",
    size = "md",
    showLabel = false,
    className = ""
}: {
    value: number;
    max?: number;
    variant?: "default" | "health" | "mana" | "xp" | "gold";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
}) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    const variants = {
        default: "from-[#6a80a0] to-[#4a6080]",
        health: percent > 60 ? "from-[#5a9a60] to-[#408048]" : percent > 30 ? "from-[#b09030] to-[#907020]" : "from-[#a04040] to-[#802020]",
        mana: "from-[#6060a0] to-[#404080]",
        xp: "from-[#80a060] to-[#608040]",
        gold: "from-[#c0a040] to-[#a08020]",
    };

    const sizes = {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
    };

    return (
        <div className={`relative ${className}`}>
            <div className={`
                w-full ${sizes[size]} bg-[#1a181f] rounded-sm border border-[#3d3a4a] overflow-hidden
                shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]
            `}>
                <div
                    className={`h-full bg-gradient-to-b ${variants[variant]} transition-all duration-300 rounded-sm`}
                    style={{
                        width: `${percent}%`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                />
            </div>
            {showLabel && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                    {Math.round(value)}/{max}
                </span>
            )}
        </div>
    );
};

export const GameIcon = ({
    icon,
    size = "md",
    className = ""
}: {
    icon: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}) => {
    const sizes = {
        sm: "w-6 h-6 text-sm",
        md: "w-8 h-8 text-base",
        lg: "w-10 h-10 text-lg",
        xl: "w-14 h-14 text-2xl",
    };

    return (
        <div className={`
            ${sizes[size]} 
            flex items-center justify-center
            bg-gradient-to-b from-[#2a2833] to-[#1f1d26]
            border border-[#3d3a4a] rounded
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]
            ${className}
        `}>
            {icon}
        </div>
    );
};

export const GameSlot = ({
    children,
    onClick,
    empty = false,
    selected = false,
    highlight = false,
    className = ""
}: {
    children?: React.ReactNode;
    onClick?: () => void;
    empty?: boolean;
    selected?: boolean;
    highlight?: boolean;
    className?: string;
}) => {
    return (
        <div
            onClick={onClick}
            className={`
                aspect-square rounded border-2 flex items-center justify-center transition-all cursor-pointer relative
                ${empty 
                    ? "border-dashed border-[#3d3a4a] bg-[#1a181f] hover:border-[#5a556a]" 
                    : "border-[#5a556a] bg-gradient-to-b from-[#2a2833] to-[#1f1d26] hover:from-[#3a3843] hover:to-[#2a2833]"
                }
                ${selected ? "border-[#80c080] shadow-[0_0_8px_rgba(128,192,128,0.5)]" : ""}
                ${highlight ? "border-[#c0a040] shadow-[0_0_8px_rgba(192,160,64,0.5)]" : ""}
                shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export const GameTooltip = ({
    children,
    text,
}: {
    children: React.ReactNode;
    text: string;
}) => {
    return (
        <div className="relative group">
            {children}
            <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                bg-[#1a181f] border border-[#3d3a4a] rounded text-xs text-amber-100
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                whitespace-nowrap z-50 shadow-lg
            ">
                {text}
            </div>
        </div>
    );
};

