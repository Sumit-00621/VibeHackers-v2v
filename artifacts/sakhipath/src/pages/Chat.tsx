import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGenerateCareerAdvice, useSaveConversation } from '@workspace/api-client-react';
// Local type alias for chat messages
type ChatMessageType = { role: 'user' | 'assistant'; content: string };
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send, Bot, User, Sparkles, AlertCircle, Save } from 'lucide-react';
import { parseMarkdown } from '../lib/markdown';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Chat() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your SakhiPath AI Mentor. I can help you prepare for interviews, figure out a career pivot, review your goals, or talk through any challenges you're facing. What's on your mind today?"
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const generateAdvice = useGenerateCareerAdvice();
  const saveConvo = useSaveConversation();

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, generateAdvice.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || generateAdvice.isPending) return;

    const userMessage: ChatMessageType = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await generateAdvice.mutateAsync({
        data: {
          message: userMessage.content,
          sessionId,
          userId,
          history: messages.slice(-10) // Send last 10 messages as context
        }
      });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.content }
      ]);
    } catch (error) {
      toast.error("Failed to get a response. Please try again.");
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Could you please try again?" }
      ]);
    }
  };

  const handleSave = async () => {
    try {
      await saveConvo.mutateAsync({
        data: {
          userId,
          messages,
          type: 'career',
          title: messages.find(m => m.role === 'user')?.content.substring(0, 40) + "..." || "Career Session"
        }
      });
      toast.success("Conversation saved to your profile!");
    } catch (error) {
      toast.error("Failed to save conversation.");
    }
  };

  const suggestions = [
    "How do I negotiate salary?",
    "I want to pivot to ML.",
    "How do I handle imposter syndrome?",
    "Help me prep for a behavioral interview."
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100dvh-6rem)] flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg leading-tight">AI Career Mentor</h2>
            <p className="text-xs text-muted-foreground">Trained on real experiences of women in STEM</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSave} className="text-muted-foreground hover:text-foreground">
          <Save className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Save Chat</span>
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-3xl mx-auto pb-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === 'user' ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "rounded-2xl px-5 py-3.5 max-w-[85%]",
                msg.role === 'user' 
                  ? "bg-secondary/40 text-foreground rounded-tr-sm border border-secondary" 
                  : "bg-muted/50 text-foreground rounded-tl-sm border border-border"
              )}>
                <div 
                  className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
              </div>
            </div>
          ))}

          {generateAdvice.isPending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {generateAdvice.isError && (
             <div className="flex justify-center my-4">
               <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg flex items-center gap-2 border border-destructive/20">
                 <AlertCircle className="w-4 h-4" />
                 Something went wrong. Please try sending your message again.
               </div>
             </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Suggested Prompts */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-xs bg-muted hover:bg-secondary/50 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full transition-colors border border-border"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for advice, practice interviews, or share your thoughts..."
              className="pr-12 py-6 rounded-full bg-muted/30 border-muted focus-visible:ring-primary shadow-inner"
              disabled={generateAdvice.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1.5 rounded-full w-9 h-9 shadow-sm"
              disabled={!input.trim() || generateAdvice.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              AI responses are generated based on patterns and may not be perfect. Use your best judgment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
