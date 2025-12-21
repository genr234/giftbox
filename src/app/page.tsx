"use client";

import Letter from "@/app/components/Letter";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center ">
            <Letter initialZoom={0.4} toZoom={1} duration={800} />
        </div>
    );
}
