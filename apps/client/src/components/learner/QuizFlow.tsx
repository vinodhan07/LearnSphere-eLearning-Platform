import { useState, useEffect } from "react";
import {
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Play,
    Trophy,
    RotateCcw,
    Sparkles,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";

interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
}

interface QuizFlowProps {
    lessonId: string;
    passScore: number;
    pointsReward: number;
    onComplete: (pointsEarned: number) => void;
}

const QuizFlow = ({ lessonId, passScore, pointsReward, onComplete }: QuizFlowProps) => {
    const { toast } = useToast();
    const [step, setStep] = useState<"intro" | "questions" | "result">("intro");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ score: number, passed: boolean, pointsEarned: number } | null>(null);
    const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);

    useEffect(() => {
        if (!lessonId) return;

        const fetchQuestions = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('QuizQuestion')
                .select('*')
                .eq('quizId', lessonId)
                .order('order', { ascending: true });

            if (error) {
                console.error("Failed to load quiz questions:", error);
                toast({ title: "Error", description: "Failed to load quiz questions", variant: "destructive" });
            } else if (data) {
                const formatted = data.map(d => ({
                    id: d.id,
                    question: d.question,
                    options: Array.isArray(d.options) ? d.options : (typeof d.options === 'string' ? JSON.parse(d.options) : []),
                    correctIndex: d.correctIndex
                } as Question));
                setQuestions(formatted);
            }
            setIsLoading(false);
        };

        fetchQuestions();

        const channel = supabase.channel(`quiz-${lessonId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'QuizQuestion', filter: `quizId=eq.${lessonId}` }, fetchQuestions)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [lessonId]);

    const startQuiz = () => {
        setAnswers([]);
        setCurrentIndex(0);
        setStep("questions");
    };

    const handleSelect = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        try {
            setIsLoading(true);
            // This still uses API as backend logic is needed for calculation/points
            // We'll update this once backend is migrated
            const res = await (await import("@/lib/api")).post<any>(`/quizzes/${lessonId}/submit`, { answers });
            setResult(res.attempt);
            setStep("result");
            if (res.attempt.passed) {
                onComplete(res.attempt.pointsEarned);
            } else {
                fetchPracticeQuestions();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit quiz", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPracticeQuestions = async () => {
        try {
            const data = await (await import("@/lib/api")).get<Question[]>(`/ai/smart-retake/${lessonId}`);
            setPracticeQuestions(data);
        } catch (error) {
            console.error("Failed to fetch practice questions");
        }
    };

    if (isLoading && questions.length === 0) {
        return <div className="h-64 flex items-center justify-center"><RotateCcw className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
            <AnimatePresence mode="wait">
                {step === "intro" && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-8 text-center space-y-6"
                    >
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                            <HelpCircle className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-heading font-bold">Ready for the Quiz?</h3>
                            <p className="text-muted-foreground">{questions.length} Questions • {passScore}% to Pass • {pointsReward} Points Reward</p>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-xl text-sm text-left border border-border">
                            <p className="flex items-center gap-2 mb-2 font-semibold"><AlertCircle className="h-4 w-4 text-warning" /> Important Notice</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>One question per page</li>
                                <li>Multiple attempts are allowed</li>
                                <li>Points are only awarded for the first pass</li>
                            </ul>
                        </div>
                        <Button onClick={startQuiz} className="w-full h-12 gap-2 text-lg font-bold bg-primary text-primary-foreground">
                            <Play className="h-5 w-5 fill-current" /> Start Quiz
                        </Button>
                    </motion.div>
                )}

                {step === "questions" && (
                    <motion.div
                        key="questions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8 space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
                            <Progress value={((currentIndex + 1) / questions.length) * 100} className="w-32 h-1.5" />
                        </div>

                        <h3 className="text-xl font-medium leading-relaxed">{questions[currentIndex].question}</h3>

                        <div className="space-y-3">
                            {questions[currentIndex].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${answers[currentIndex] === idx
                                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold ${answers[currentIndex] === idx ? "bg-primary border-primary text-white" : "border-muted-foreground/30 text-muted-foreground"
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={nextQuestion}
                            disabled={answers[currentIndex] === undefined}
                            className="w-full h-12 gap-2 font-bold"
                        >
                            {currentIndex === questions.length - 1 ? "Proceed and Complete Quiz" : "Proceed"} <ChevronRight className="h-5 w-5" />
                        </Button>
                    </motion.div>
                )}

                {step === "result" && result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 text-center space-y-8"
                    >
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto ${result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {result.passed ? <Trophy className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-heading font-bold">{result.passed ? "Great Job!" : "Not Quite There"}</h3>
                            <p className="text-xl font-medium">You scored <span className={result.passed ? "text-success" : "text-destructive"}>{result.score}%</span></p>
                            <p className="text-muted-foreground">Passing score is {passScore}%</p>
                        </div>

                        {result.passed && result.pointsEarned > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-center gap-3">
                                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                                <span className="font-bold text-lg text-primary">+{result.pointsEarned} Points Earned!</span>
                            </div>
                        )}

                        {!result.passed && practiceQuestions.length > 0 && (
                            <div className="space-y-4 text-left">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Sparkles className="h-4 w-4" /> AI Smart Practice
                                </div>
                                <div className="space-y-2">
                                    {practiceQuestions.map((q, i) => (
                                        <div key={i} className="p-3 bg-muted/30 rounded-lg text-xs border border-border">
                                            {q.question}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Try these practice questions before retaking the quiz.</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={startQuiz} className="flex-1 gap-2">
                                <RotateCcw className="h-4 w-4" /> Retake Quiz
                            </Button>
                            <Button onClick={() => window.location.reload()} className="flex-1">
                                Continue
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizFlow;
