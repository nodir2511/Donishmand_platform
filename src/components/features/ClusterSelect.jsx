import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { CLUSTERS_STRUCTURE } from '../../constants/data';

const ClusterSelect = ({ activeClusterId, setActiveClusterId, lang, t }) => {
    return (
        <div className="sticky top-20 z-30 transition-all mt-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="glass-panel rounded-2xl p-2 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-1 min-w-max">
                        {/* Вкладка "Все предметы" */}
                        <button
                            onClick={() => setActiveClusterId(0)}
                            className={`
                px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border
                ${activeClusterId === 0
                                    ? 'bg-gaming-card border-gaming-primary/50 text-white shadow-lg shadow-gaming-primary/10'
                                    : 'border-transparent text-gaming-textMuted hover:text-white hover:bg-white/5'}
              `}
                        >
                            <LayoutGrid size={18} className={activeClusterId === 0 ? "text-gaming-accent" : ""} />
                            {t.allSubjects}
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-2 self-center"></div>

                        {/* Вкладки кластеров */}
                        {CLUSTERS_STRUCTURE.map((cluster) => (
                            <button
                                key={cluster.id}
                                onClick={() => setActiveClusterId(cluster.id)}
                                className={`
                  px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border
                  ${activeClusterId === cluster.id
                                        ? 'bg-gaming-card border-gaming-primary/50 text-white shadow-lg shadow-gaming-primary/10'
                                        : 'border-transparent text-gaming-textMuted hover:text-white hover:bg-white/5'}
                `}
                            >
                                <span className={`
                  flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold transition-colors
                  ${activeClusterId === cluster.id ? 'bg-gaming-primary text-white' : 'bg-white/10 text-white/50'}
                `}>
                                    {cluster.id}
                                </span>
                                {lang === 'ru' ? cluster.titleRu : cluster.titleTj}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClusterSelect;
