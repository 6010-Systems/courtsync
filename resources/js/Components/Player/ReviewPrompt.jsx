import React, { useState } from 'react';
import { Star, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewPrompt({ 
    facilityName = 'Cebu Smash Badminton & Sports Arena', 
    matchDate = 'Yesterday',
    onDismiss = () => {},
}) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setDismissed(true);
            onDismiss();
        }, 1800);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                className="group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 shadow-2xs overflow-hidden"
            >
                {/* Background Athletic Geometry Watermark */}
                <div className="pointer-events-none absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.035] text-[#10221C]">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                        <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" />
                    </svg>
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => {
                        setDismissed(true);
                        onDismiss();
                    }}
                    className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#10221C]/40 hover:text-[#10221C] hover:bg-gray-100 transition cursor-pointer z-10"
                    aria-label="Dismiss review prompt"
                >
                    <X size={15} />
                </motion.button>

                {submitted ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-3 text-center flex flex-col items-center justify-center relative z-10"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-2">
                            <Check size={20} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-sm font-black text-[#10221C]">Thank you for your feedback!</h4>
                        <p className="text-xs text-[#10221C]/60 mt-0.5">Your rating helps fellow athletes discover quality courts.</p>
                    </motion.div>
                ) : (
                    <div className="relative z-10">
                        <div className="mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#10221C]/50">
                                Match Review
                            </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-[#10221C] tracking-tight">
                            How was your court experience at <span className="underline decoration-[#D6FF3F] decoration-2">{facilityName}</span>?
                        </h4>
                        <p className="text-xs text-[#10221C]/60 mt-0.5">
                            Match concluded {matchDate}. Help the local community with your rating.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
                            {/* Interactive 5-Star Rating with Motion */}
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const isFilled = (hoverRating || rating) >= star;
                                    return (
                                        <motion.button
                                            key={star}
                                            whileHover={{ scale: 1.25 }}
                                            whileTap={{ scale: 0.9 }}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
                                            aria-label={`Rate ${star} of 5 stars`}
                                        >
                                            <Star
                                                size={22}
                                                className={`transition-colors ${
                                                    isFilled 
                                                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs' 
                                                        : 'fill-transparent text-gray-300'
                                                }`}
                                            />
                                        </motion.button>
                                    );
                                })}
                                <span className="ml-2 text-xs font-bold text-[#10221C]/70">
                                    {rating ? `${rating} / 5 Stars` : 'Select rating'}
                                </span>
                            </div>

                            {/* Optional Comment Input & Submit Action */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add an optional comment (e.g. lighting, surface grip)..."
                                    className="flex-1 rounded-xl border border-[#10221C]/15 bg-[#FAF9F5] px-3.5 py-2 text-xs font-medium text-[#10221C] placeholder-[#10221C]/40 focus:border-[#10221C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#10221C]/10 transition-colors"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    type="submit"
                                    disabled={!rating}
                                    className="px-4 py-2 rounded-xl bg-[#101F1A] hover:bg-[#18342b] text-[#D6FF3F] text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 text-center"
                                >
                                    Submit Feedback
                                </motion.button>
                            </div>
                        </form>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
