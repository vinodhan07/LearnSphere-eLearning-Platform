import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

interface QuizPlayerProps {
  quiz: Quiz;
}

type QuizState = "intro" | "playing" | "result";

const QuizPlayer = ({ quiz }: QuizPlayerProps) => {
  const [state, setState] = useState<QuizState>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(1);

  const question = quiz.questions[currentQ];
  const totalQuestions = quiz.questions.length;

  const handleSelect = (optionId: string) => {
    if (selectedOption) return;
    setSelectedOption(optionId);
  };

  const handleProceed = () => {
    if (!selectedOption) return;
    setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));

    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    } else {
      setState("result");
    }
  };

  const correctCount = quiz.questions.filter(
    (q) => q.options.find((o) => o.id === answers[q.id])?.isCorrect
  ).length;

  const reward = quiz.rewards.find((r) => r.attempt === attempt) || quiz.rewards[quiz.rewards.length - 1];

  const handleRetry = () => {
    setState("intro");
    setCurrentQ(0);
    setSelectedOption(null);
    setAnswers({});
    setAttempt((prev) => prev + 1);
  };

  if (state === "intro") {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center space-y-6 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-card-foreground">{quiz.title}</h3>
          <p className="text-muted-foreground mt-2">{totalQuestions} questions • Multiple attempts allowed</p>
          {attempt > 1 && (
            <p className="text-sm text-accent font-medium mt-1">Attempt #{attempt}</p>
          )}
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rewards</p>
          {quiz.rewards.map((r) => (
            <div key={r.attempt} className="flex justify-between text-sm text-foreground py-1">
              <span>{r.attempt === 4 ? "4th+ try" : `${r.attempt}${["st", "nd", "rd"][r.attempt - 1]} try`}</span>
              <span className="font-semibold text-accent">{r.points} pts</span>
            </div>
          ))}
        </div>
        <Button onClick={() => setState("playing")} className="bg-gradient-hero text-primary-foreground font-bold px-8" size="lg">
          Start Quiz
        </Button>
      </div>
    );
  }

  if (state === "result") {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center space-y-6 max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto"
        >
          <Trophy className="h-10 w-10 text-accent" />
        </motion.div>
        <div>
          <h3 className="font-heading text-2xl font-bold text-card-foreground">Quiz Complete!</h3>
          <p className="text-muted-foreground mt-2">
            You got {correctCount} out of {totalQuestions} correct
          </p>
        </div>
        <div className="bg-gradient-accent rounded-lg p-4 animate-pulse-glow">
          <p className="text-accent-foreground/70 text-sm">Points Earned</p>
          <p className="font-heading text-3xl font-bold text-accent-foreground">{reward.points} pts</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleRetry} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Question {currentQ + 1} of {totalQuestions}</span>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${
                i < currentQ ? "bg-success" : i === currentQ ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="font-heading text-xl font-bold text-card-foreground mb-6">{question.text}</h3>
          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const showResult = selectedOption !== null;
              const isCorrect = option.isCorrect;

              let optionStyle = "border-border hover:border-primary/30 hover:bg-primary/5";
              if (showResult && isSelected && isCorrect) {
                optionStyle = "border-success bg-success/5";
              } else if (showResult && isSelected && !isCorrect) {
                optionStyle = "border-destructive bg-destructive/5";
              } else if (showResult && isCorrect) {
                optionStyle = "border-success/50 bg-success/5";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionStyle} flex items-center gap-3`}
                >
                  <span className="flex-1 text-sm font-medium text-foreground">{option.text}</span>
                  {showResult && isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                  {showResult && !isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-success/60" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Proceed */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleProceed}
          disabled={!selectedOption}
          className="bg-gradient-hero text-primary-foreground font-semibold gap-2"
        >
          {currentQ === totalQuestions - 1 ? "Complete Quiz" : "Proceed"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuizPlayer;
