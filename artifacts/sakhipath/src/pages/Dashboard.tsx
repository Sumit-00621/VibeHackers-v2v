import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGetDashboardSummary, useListUserActivity } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ScoreRing } from '../components/ScoreRing';
import { SkeletonCard } from '../components/SkeletonCard';
import { BookOpen, GraduationCap, Target, Users, MessageSquare, FileText, ArrowRight, Calendar, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary(userId, {
    query: { enabled: !!userId, queryKey: ['dashboard-summary', userId] }
  });
  
  const { data: activity, isLoading: loadingActivity } = useListUserActivity(userId, {
    query: { enabled: !!userId, queryKey: ['user-activity', userId] }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = currentUser?.displayName ? currentUser.displayName.split(' ')[0] : "there";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            {getGreeting()}, <span className="text-primary">{name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Ready to take the next step in your career journey?</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Confidence Score Card */}
        <Card className="md:col-span-5 lg:col-span-4 flex flex-col border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-4 -mt-4" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="font-serif">Career Confidence</CardTitle>
            <CardDescription>Your AI-assessed growth score</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center relative z-10 py-6">
            {loadingSummary ? (
              <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
            ) : (
              <>
                <ScoreRing score={summary?.careerConfidenceScore || 0} size={160} strokeWidth={12} className="mb-6 drop-shadow-sm" />
                <p className="text-sm text-center text-muted-foreground max-w-[250px]">
                  You've gained +4 points this week by completing a learning module.
                </p>
                <Button variant="outline" size="sm" className="mt-6 rounded-full" asChild>
                  <Link href="/learning">Boost your score</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="w-10 h-10 bg-accent/20 text-accent-foreground rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              {loadingSummary ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif mb-1">
                    {summary?.completedModules || 0}<span className="text-muted-foreground text-xl">/{summary?.totalModules || 12}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Modules Completed</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="w-10 h-10 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              {loadingSummary ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif mb-1">
                    {summary?.activeMentorRequests || 0}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Active Mentorships</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              {loadingSummary ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif mb-1">
                    {summary?.aiSessionsCount || 0}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">AI Coaching Sessions</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="w-10 h-10 bg-chart-5/20 text-chart-5 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              {loadingSummary ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-serif mb-1">
                    {summary?.scholarshipsBookmarked || 0}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Saved Scholarships</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-serif flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/chat">
              <div className="group bg-card hover:bg-muted/50 border border-border p-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">Talk to AI Mentor</h4>
                  <p className="text-xs text-muted-foreground">Get career advice</p>
                </div>
              </div>
            </Link>
            
            <Link href="/resume">
              <div className="group bg-card hover:bg-muted/50 border border-border p-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-start gap-4">
                <div className="bg-secondary text-secondary-foreground p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">Analyze Resume</h4>
                  <p className="text-xs text-muted-foreground">Improve ATS score</p>
                </div>
              </div>
            </Link>

            <Link href="/scholarships">
              <div className="group bg-card hover:bg-muted/50 border border-border p-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-start gap-4">
                <div className="bg-accent/20 text-accent-foreground p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">Find Funding</h4>
                  <p className="text-xs text-muted-foreground">Discover scholarships</p>
                </div>
              </div>
            </Link>

            <Link href="/mentors">
              <div className="group bg-card hover:bg-muted/50 border border-border p-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-start gap-4">
                <div className="bg-chart-4/20 text-chart-4 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">Find a Mentor</h4>
                  <p className="text-xs text-muted-foreground">Connect with leaders</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Deadlines & Activity */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="py-4 border-b border-border bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSummary ? (
                <div className="p-4 space-y-3">
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0 ? (
                <div className="divide-y border-border">
                  {summary.upcomingDeadlines.map((item, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          item.type === 'scholarship' ? "bg-accent" : 
                          item.type === 'mentor' ? "bg-secondary-foreground" : "bg-primary"
                        )} />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium whitespace-nowrap text-right">
                        {format(parseISO(item.deadline), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No upcoming deadlines. You're all caught up!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader className="py-4 border-b border-border bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingActivity ? (
                <div className="p-4 space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity?.items && activity.items.length > 0 ? (
                <div className="p-4 space-y-5">
                  {activity.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-background">
                        {item.type === 'ai_chat' ? <MessageSquare className="w-4 h-4 text-primary" /> :
                         item.type === 'quiz_completed' ? <Target className="w-4 h-4 text-accent-foreground" /> :
                         item.type === 'mentor_request' ? <Users className="w-4 h-4 text-secondary-foreground" /> :
                         <Activity className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-snug">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(item.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="link" className="text-xs w-full text-muted-foreground h-auto p-0">View all activity</Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Start exploring SakhiPath to see your activity here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
