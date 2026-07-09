import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGenerateResumeFeedback } from '@workspace/api-client-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ScoreRing } from '../components/ScoreRing';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Resume() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateFeedback = useGenerateResumeFeedback();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    
    if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
      setIsExtracting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeText(e.target?.result as string);
        setIsExtracting(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read text file.");
        setIsExtracting(false);
      };
      reader.readAsText(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      // In a real app we'd use a PDF parsing library like pdf.js
      // For this prototype, we'll ask them to paste text instead
      toast.info("For PDF files, please copy and paste the text contents into the box below.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      toast.error("Please upload a .txt file or paste your resume text.");
      setFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      toast.error("Please provide your resume text.");
      return;
    }

    generateFeedback.mutate({
      data: {
        resumeText,
        targetRole,
        userId: currentUser?.uid
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">Get instant, actionable feedback to pass ATS filters and highlight your true impact.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Upload & Form Section */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="targetRole" className="text-base">Target Role (Optional)</Label>
                  <Input 
                    id="targetRole" 
                    placeholder="e.g. Senior Data Scientist" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Adding a role helps tailor the feedback.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Resume Content</Label>
                  
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/10 hover:bg-muted/30'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept=".txt,.pdf"
                    />
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-medium">Upload text file</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">OR PASTE TEXT</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <Textarea 
                    placeholder="Paste your resume content here..."
                    className="min-h-[250px] font-mono text-sm resize-y"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    disabled={isExtracting}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base shadow-md hover-elevate" 
                  disabled={!resumeText.trim() || generateFeedback.isPending || isExtracting}
                >
                  {generateFeedback.isPending || isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Generate Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7">
          {generateFeedback.isPending ? (
            <div className="h-full min-h-[500px] border border-border rounded-xl bg-card flex flex-col items-center justify-center p-8 space-y-6">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium font-serif">Analyzing your experience...</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We're comparing your resume against industry standards and the target role requirements.
                </p>
              </div>
            </div>
          ) : generateFeedback.data ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
                <CardContent className="p-0">
                  <div className="bg-primary/5 p-6 border-b border-border flex flex-col sm:flex-row items-center gap-6">
                    <ScoreRing score={generateFeedback.data.score} size={120} strokeWidth={8} />
                    <div>
                      <h2 className="text-2xl font-serif font-bold mb-2">Resume Score</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        {generateFeedback.data.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        Strengths
                      </h3>
                      <ul className="space-y-3">
                        {generateFeedback.data.strengths.map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                        Areas to Improve
                      </h3>
                      <ul className="space-y-3">
                        {generateFeedback.data.weaknesses.map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 bg-muted/20 border-t border-border space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-primary">
                      <ArrowUpRight className="w-5 h-5" />
                      Actionable Recommendations
                    </h3>
                    <div className="space-y-4">
                      {generateFeedback.data.improvements.map((item, i) => (
                        <div key={i} className="bg-background border border-border p-4 rounded-lg text-sm shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-border rounded-xl bg-card flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-serif font-medium mb-2">No Resume Analyzed Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload your resume or paste its content on the left to get a detailed breakdown of how to improve your chances of landing an interview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
