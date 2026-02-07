import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

interface PointsNotificationProps {
    points: number;
    badgeProgress: number;
}

const PointsNotification = ({ points, badgeProgress }: PointsNotificationProps) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (points > 0) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [points]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    className="fixed bottom-8 right-8 z-50 bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/20 w-80 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Trophy className="h-20 w-20 text-purple-500" />
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Sparkles className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg">You earned {points} points!</h4>
                            <p className="text-slate-400 text-xs text-balance">Keep it up! You're making great progress.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            <span>Next Badge Progress</span>
                            <span>{badgeProgress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${badgeProgress}%` }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                        </div>
                    </div>

                    <div className="absolute -bottom-1 -left-1 -right-1 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-shimmer" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PointsNotification;
