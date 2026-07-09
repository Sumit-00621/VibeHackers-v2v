import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScoreRing } from '../components/ScoreRing';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { Award, BookOpen, MessageSquare, Briefcase, MapPin, Edit3 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Profile() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const { data: summary } = useGetDashboardSummary(userId, {
    query: { enabled: !!userId, queryKey: ['dashboard-summary', userId] }
  });

  const name = currentUser?.displayName || "SakhiPath User";
  
  const getInitials = (n: string) => {
    return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="relative">
        <div className="h-48 rounded-xl bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay opacity-30"></div>
        </div>
        
        <div className="px-6 md:px-10 -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6 pb-6 border-b border-border">
          <Avatar className="w-32 h-32 border-4 border-background shadow-md">
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-serif">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left pb-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight">{name}</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-muted-foreground text-sm">
              <span className="flex items-center justify-center md:justify-start gap-1.5">
                <Briefcase className="w-4 h-4" />
                Software Engineer
              </span>
              <span className="hidden md:inline text-border">•</span>
              <span className="flex items-center justify-center md:justify-start gap-1.5">
                <MapPin className="w-4 h-4" />
                Bangalore, India
              </span>
            </div>
          </div>
          
          <div className="pb-2">
            <Button variant="outline" className="shadow-sm">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 px-2">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Career Confidence</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              <ScoreRing score={summary?.careerConfidenceScore || 0} size={140} strokeWidth={10} className="mb-4" />
              <p className="text-sm text-center text-muted-foreground">
                Your confidence score places you in the top 20% of peers at your career stage.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Career Stage</h4>
                <p className="text-sm">Early Career (0-3 yrs)</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Domain</h4>
                <p className="text-sm">Software & IT</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Goals</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-muted px-2 py-1 rounded text-xs">Full Stack Mastery</span>
                  <span className="bg-muted px-2 py-1 rounded text-xs">Public Speaking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Platform Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-accent/20 text-accent-foreground rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif">{summary?.completedModules || 0}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Modules Finished</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif">{summary?.aiSessionsCount || 0}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Sessions</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-chart-4/20 text-chart-4 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif">4</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-200">
                    <span className="text-xl">🌟</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Perfect Score</h4>
                    <p className="text-xs text-muted-foreground">Scored 100% on "Negotiation Basics"</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-200">
                    <span className="text-xl">🔥</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">7 Day Streak</h4>
                    <p className="text-xs text-muted-foreground">Completed activities 7 days in a row</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
