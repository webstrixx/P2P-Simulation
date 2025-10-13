
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center mb-8">
            <div className="flex justify-center items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
                    P2P ECC Authentication
                </h1>
            </div>
            <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
                A simulation of anonymous, certificate-free authentication and key agreement for peer-to-peer systems using Elliptic Curve Cryptography (ECC).
            </p>
        </header>
    );
}
