import React from 'react';

const Footer = ({ t }) => {
    return (
        <footer className="relative bg-gaming-bg border-t border-white/5 py-12 mt-20">
            <div className="absolute inset-0 bg-gradient-to-t from-gaming-primary/5 to-transparent pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
                <p className="text-gaming-textMuted text-sm font-medium">
                    {t.footerText}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
