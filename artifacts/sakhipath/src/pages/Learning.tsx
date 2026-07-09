import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useListLearningModules, useSaveQuizResult } from '@workspace/api-client-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { SkeletonCard } from '../components/SkeletonCard';
import { parseMarkdown } from '../lib/markdown';
import { BookOpen, Clock, Target, ChevronRight, CheckCircle2, XCircle, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function Learning() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [quizState, setQuizState] = useState<{
    active: boolean;
    currentIndex: number;
    answers: Record<number, number>;
    submitted: boolean;
  }>({
    active: false,
    currentIndex: 0,
    answers: {},
    submitted: false
  });

  const { data, isLoading } = useListLearningModules({
    category: activeCategory !== "all" ? activeCategory : undefined
  });
  
  const saveQuiz = useSaveQuizResult();

  const categories = ["all", "leadership", "technical", "financial", "soft skills"];
  const modules = data?.items || [];

  const handleStartQuiz = () => {
    setQuizState({
      active: true,
      currentIndex: 0,
      answers: {},
      submitted: false
    });
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (quizState.submitted) return;
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentIndex]: optionIndex }
    }));
  };

  const handleNextQuestion = () => {
    if (quizState.currentIndex < (selectedModule?.quizQuestions.length || 0) - 1) {
      setQuizState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!selectedModule) return;
    
    let correctCount = 0;
    selectedModule.quizQuestions.forEach((q: any, idx: number) => {
      if (quizState.answers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const totalQuestions = selectedModule.quizQuestions.length;
    
    setQuizState(prev => ({ ...prev, submitted: true }));
    
    try {
      await saveQuiz.mutateAsync({
        data: {
          userId,
          moduleId: selectedModule.id,
          score: correctCount,
          totalQuestions
        }
      });
      toast.success("Quiz results saved!");
    } catch (error) {
      console.error("Failed to save quiz", error);
    }
  };

  const calculateScore = () => {
    if (!selectedModule || !quizState.submitted) return 0;
    let correctCount = 0;
    selectedModule.quizQuestions.forEach((q: any, idx: number) => {
      if (quizState.answers[idx] === q.correctIndex) correctCount++;
    });
    return Math.round((correctCount / selectedModule.quizQuestions.length) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Learning Hub</h1>
          <p className="text-muted-foreground mt-1">Bite-sized modules to accelerate your growth.</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors border ${
              activeCategory === cat 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : modules.length > 0 ? (
          modules.map((mod) => (
            <Card key={mod.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <div className={`h-2 w-full ${
                mod.category === 'leadership' ? 'bg-primary' :
                mod.category === 'technical' ? 'bg-accent' :
                mod.category === 'financial' ? 'bg-chart-4' : 'bg-chart-3'
              }`} />
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="capitalize text-xs font-normal">
                    {mod.category}
                  </Badge>
                  <Badge className={`text-xs font-normal ${
                    mod.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                    mod.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                    'bg-rose-500/10 text-rose-600 border-rose-200'
                  }`} variant="outline">
                    {mod.difficulty}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {mod.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {mod.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {mod.durationMinutes} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {mod.quizQuestions?.length || 0} questions
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full justify-between hover-elevate" 
                  onClick={() => setSelectedModule(mod)}
                >
                  Start Module
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No modules found for this category.</p>
          </div>
        )}
      </div>

      {/* Module/Quiz Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
          {selectedModule && !quizState.active ? (
            // Module Content View
            <>
              <DialogHeader className="p-6 pb-0 border-b border-border bg-muted/10">
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className="capitalize">{selectedModule.category}</Badge>
                  <Badge variant="secondary">{selectedModule.durationMinutes} mins</Badge>
                </div>
                <DialogTitle className="text-2xl font-serif leading-tight">{selectedModule.title}</DialogTitle>
                <DialogDescription className="text-base mt-2 pb-6">{selectedModule.description}</DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto p-6 lg:p-8 flex-1">
                <div 
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground/90
                    prose-h2:text-primary prose-h2:font-serif prose-h2:font-bold
                    prose-h3:font-bold prose-h3:text-foreground
                    prose-p:leading-relaxed prose-li:leading-relaxed
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedModule.content || "") }}
                />
              </div>

              <div className="p-6 border-t border-border bg-background flex justify-end shrink-0">
                <Button size="lg" onClick={handleStartQuiz} className="shadow-md hover-elevate">
                  <Target className="w-4 h-4 mr-2" />
                  Take Knowledge Check
                </Button>
              </div>
            </>
          ) : selectedModule && quizState.active ? (
            // Quiz View
            <div className="flex flex-col h-full min-h-[500px]">
              <div className="p-6 border-b border-border bg-muted/10 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif font-bold text-lg">Knowledge Check</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    {quizState.submitted ? "Results" : `Question ${quizState.currentIndex + 1} of ${selectedModule.quizQuestions.length}`}
                  </span>
                </div>
                <Progress 
                  value={quizState.submitted ? 100 : ((quizState.currentIndex) / selectedModule.quizQuestions.length) * 100} 
                  className="h-2"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {!quizState.submitted ? (
                  // Active Question
                  <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-xl font-medium leading-relaxed">
                      {selectedModule.quizQuestions[quizState.currentIndex].question}
                    </h2>
                    
                    <div className="space-y-3">
                      {selectedModule.quizQuestions[quizState.currentIndex].options.map((opt: string, idx: number) => {
                        const isSelected = quizState.answers[quizState.currentIndex] === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectAnswer(idx)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                              }`}>
                                {isSelected && <div className="w-2 h-2 bg-background rounded-full" />}
                              </div>
                              <span className={isSelected ? 'font-medium' : ''}>{opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Quiz Results
                  <div className="max-w-2xl mx-auto py-8">
                    <div className="text-center mb-8">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        {calculateScore() >= 70 ? (
                          <Award className="w-12 h-12 text-primary" />
                        ) : (
                          <Target className="w-12 h-12 text-primary" />
                        )}
                      </div>
                      <h2 className="text-3xl font-serif font-bold mb-2">
                        {calculateScore()}% Score
                      </h2>
                      <p className="text-muted-foreground">
                        {calculateScore() >= 70 
                          ? "Great job! You've mastered this concept." 
                          : "Good effort! Review the explanations below to solidify your understanding."}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {selectedModule.quizQuestions.map((q: any, idx: number) => {
                        const userAnswer = quizState.answers[idx];
                        const isCorrect = userAnswer === q.correctIndex;
                        
                        return (
                          <div key={idx} className={`p-5 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-200' : 'bg-rose-500/5 border-rose-200'}`}>
                            <div className="flex items-start gap-3 mb-3">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                              )}
                              <h4 className="font-medium text-foreground">{q.question}</h4>
                            </div>
                            
                            <div className="ml-8 space-y-2 text-sm">
                              {!isCorrect && (
                                <div className="text-rose-600 line-through opacity-80">
                                  Your answer: {q.options[userAnswer]}
                                </div>
                              )}
                              <div className="text-emerald-700 font-medium">
                                Correct answer: {q.options[q.correctIndex]}
                              </div>
                              <div className="mt-3 p-3 bg-background rounded-lg border border-border text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground text-xs uppercase tracking-wider block mb-1">Explanation</span>
                                {q.explanation}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-background flex justify-end shrink-0">
                {!quizState.submitted ? (
                  <Button 
                    size="lg" 
                    onClick={handleNextQuestion}
                    disabled={quizState.answers[quizState.currentIndex] === undefined}
                  >
                    {quizState.currentIndex < selectedModule.quizQuestions.length - 1 ? 'Next Question' : 'Submit Answers'}
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => setSelectedModule(null)}>
                    Return to Hub
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
