import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    HelpCircle,
    CheckCircle2,
    XCircle,
    ArrowRight,
    RotateCcw,
    Trophy,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Question {
    id: string;
    question: string;
    options: string[]; // We'll parse the JSON string from API
    correctIndex: number;
}

const QuizPlayer: React.FC = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [pointsPerQuestion, setPointsPerQuestion] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Constants
    const TOTAL_QUIZ_POINTS = 50;

    useEffect(() => {
        fetchQuizData();
    }, [courseId]);

    const fetchQuizData = async () => {
        try {
            setIsLoading(true);
            // In this setup, courseId passed to /quiz/:id is actually the lessonId representing the quiz
            const data = await api.get<any[]>(`/quizzes/${courseId}/questions`);
            const formatted = data.map(q => ({
                ...q,
                options: JSON.parse(q.options)
            }));
            setQuestions(formatted);
            if (formatted.length > 0) {
                setPointsPerQuestion(TOTAL_QUIZ_POINTS / formatted.length);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load quiz content.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (showFeedback) return;
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;

        const currentQuestion = questions[currentIndex];
        const correct = selectedOption === currentQuestion.correctIndex;

        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            setScore(prev => prev + pointsPerQuestion);
        } else {
            // Deduct 1 mark, but don't go below 0
            setScore(prev => Math.max(0, prev - 1));
        }
    };

    const handleNext = () => {
        if (isCorrect) {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setShowFeedback(false);
            } else {
                setIsFinished(true);
            }
        } else {
            // Repeat the same question if incorrect
            setSelectedOption(null);
            setShowFeedback(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-2xl font-bold mb-2">No Questions Found</h2>
                <p className="text-muted-foreground mb-8">This quiz doesn't have any questions yet.</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card border border-border p-12 rounded-3xl shadow-glow-sm max-w-md w-full"
                >
                    <Trophy className="h-20 w-20 text-orange-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-muted-foreground mb-8">Great job on finishing the assessment.</p>

                    <div className="bg-orange-500/10 rounded-2xl p-6 mb-8 border border-orange-500/20">
                        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-1">Total Score</p>
                        <p className="text-5xl font-black text-foreground">
                            {Math.round(score)}<span className="text-xl text-muted-foreground">/{TOTAL_QUIZ_POINTS}</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button className="bg-orange-500 hover:bg-orange-600 font-bold h-12 rounded-xl" onClick={() => navigate(-1)}>
                            Finish & Return
                        </Button>
                        <Button variant="ghost" onClick={() => window.location.reload()}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Progress Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground">
                            <RotateCcw className="h-5 w-5 rotate-180" />
                        </Button>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex h-1.5 w-48 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-500"
                                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Score</p>
                        <p className="text-2xl font-black text-orange-500">{Math.round(score)}</p>
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="bg-card border border-border rounded-3xl p-8 shadow-sm"
                    >
                        <div className="flex items-start gap-4 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground leading-tight pt-1">
                                {currentQuestion.question}
                            </h2>
                        </div>

                        <div className="grid gap-4">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedOption === index;
                                let variant = "border-border hover:border-orange-500/50 hover:bg-muted/30";

                                if (showFeedback) {
                                    if (index === currentQuestion.correctIndex) {
                                        variant = "border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm";
                                    } else if (isSelected && !isCorrect) {
                                        variant = "border-red-500 bg-red-500/10 text-red-700";
                                    } else {
                                        variant = "border-border opacity-50";
                                    }
                                } else if (isSelected) {
                                    variant = "border-orange-500 bg-orange-500/5 text-orange-600 shadow-sm";
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleOptionSelect(index)}
                                        disabled={showFeedback}
                                        className={`flex items-center justify-between p-5 rounded-2xl border-2 font-medium transition-all duration-200 text-left ${variant}`}
                                    >
                                        <span>{option}</span>
                                        {showFeedback && index === currentQuestion.correctIndex && (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        )}
                                        {showFeedback && isSelected && !isCorrect && (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 flex justify-end">
                            {!showFeedback ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={selectedOption === null}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-orange-500/20"
                                >
                                    Confirm Answer
                                </Button>
                            ) : (
                                <div className="flex flex-col items-end gap-3">
                                    <div className={`flex items-center gap-2 font-bold ${isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                                        {isCorrect ? (
                                            <>
                                                <CheckCircle2 className="h-5 w-5" /> Excellent! +{Math.round(pointsPerQuestion)} points
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw className="h-5 w-5" /> Incorrect (-1 mark). Try again!
                                            </>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleNext}
                                        className={`${isCorrect ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-500 hover:bg-orange-600"} text-white px-8 h-12 rounded-xl font-bold gap-2`}
                                    >
                                        {isCorrect ? "Next Question" : "Try Again"}
                                        {isCorrect && <ArrowRight className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizPlayer;
