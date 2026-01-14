import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LatestApprovedReviewsTimeline from './LatestApprovedReviewsTimeline';
import LatestSalesTimeline from './LatestSalesTimeline';
import Icon from '@/components/icon/Icon';

const TimelineWidget: React.FC = () => {
    const [mode, setMode] = useState<'reviews' | 'sales'>('reviews');

    const toggleMode = () => {
        setMode((prev) => (prev === 'reviews' ? 'sales' : 'reviews'));
    };

    return (
        <div className="h-full relative overflow-hidden">
            {/* Persistent Switch Button */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={toggleMode}
                    className="group flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    title={mode === 'reviews' ? 'Ir a Ventas' : 'Ir a Revisiones'}
                >
                    <Icon 
                        icon="HeroArrowRight" 
                        className={`h-5 w-5 transition-transform duration-300 ${mode === 'sales' ? 'rotate-180' : ''} group-hover:scale-110`} 
                    />
                </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                {mode === 'reviews' ? (
                    <motion.div
                        key="reviews"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <LatestApprovedReviewsTimeline />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sales"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <LatestSalesTimeline />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimelineWidget;
