import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useListScholarships, useGenerateScholarshipRecommendations } from '@workspace/api-client-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SkeletonCard } from '../components/SkeletonCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Filter, Calendar, DollarSign, ExternalLink, Sparkles, Building2, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { parseMarkdown } from '../lib/markdown';

export default function Scholarships() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [recoModalOpen, setRecoModalOpen] = useState(false);
  
  const { data, isLoading } = useListScholarships({
    search: searchTerm || undefined,
    category: category !== "all" ? category : undefined
  });
  
  const getRecommendations = useGenerateScholarshipRecommendations();
  const scholarships = data?.items || [];

  const handleGetRecommendations = async () => {
    try {
      await getRecommendations.mutateAsync({
        data: {
          userId,
          profile: "Female student in Computer Science looking for merit-based scholarships", // In real app, this would come from a form or profile
          careerStage: "student",
          fieldOfStudy: "Computer Science"
        }
      });
    } catch (error) {
      toast.error("Failed to generate recommendations.");
    }
  };

  const isExpired = (dateString?: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Scholarship Finder</h1>
          <p className="text-muted-foreground mt-1">Discover funding opportunities specifically for women in STEM.</p>
        </div>
        <Button 
          onClick={() => {
            setRecoModalOpen(true);
            handleGetRecommendations();
          }} 
          className="shadow-md hover-elevate bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get AI Recommendations
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search scholarships by name or provider..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select 
            className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="merit">Merit Based</option>
            <option value="need">Need Based</option>
            <option value="research">Research Grants</option>
            <option value="travel">Travel Grants</option>
          </select>
        </div>
      </div>

      {/* Scholarship Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : scholarships.length > 0 ? (
          scholarships.map((scholarship) => {
            const expired = isExpired(scholarship.deadline);
            return (
              <Card key={scholarship.id} className={`flex flex-col border-border shadow-sm hover:shadow-md transition-shadow group ${expired ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      <DollarSign className="w-3 h-3 mr-0.5" />
                      {scholarship.amount}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs font-normal shrink-0">
                      {scholarship.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 leading-tight text-lg mb-1 group-hover:text-primary transition-colors">
                    {scholarship.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{scholarship.provider}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {scholarship.description}
                  </p>
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-start gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-tight">{scholarship.eligibility}</span>
                    </div>
                    {scholarship.deadline && (
                      <div className={`flex items-center gap-2 text-sm font-medium ${expired ? 'text-destructive' : 'text-foreground'}`}>
                        <Calendar className="w-4 h-4 shrink-0" />
                        {expired ? 'Deadline Passed' : `Due: ${format(parseISO(scholarship.deadline), 'MMM d, yyyy')}`}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    className="w-full" 
                    variant={expired ? "secondary" : "default"}
                    disabled={expired}
                    asChild={!expired && !!scholarship.applicationUrl}
                  >
                    {expired ? (
                      "Closed"
                    ) : scholarship.applicationUrl ? (
                      <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer">
                        Apply Now
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    ) : (
                      "View Details"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">No scholarships found</h3>
            <p>Try adjusting your search or filters to find more opportunities.</p>
          </div>
        )}
      </div>

      {/* AI Recommendations Modal */}
      <Dialog open={recoModalOpen} onOpenChange={setRecoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
              <Sparkles className="w-6 h-6 text-accent" />
              AI Scholarship Matches
            </DialogTitle>
            <DialogDescription>
              Personalized recommendations based on your profile and career goals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-1 mt-4">
            {getRecommendations.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">Scanning thousands of opportunities...</p>
              </div>
            ) : getRecommendations.data ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none 
                  prose-h2:text-primary prose-h2:font-serif prose-h3:text-foreground
                  prose-a:text-accent prose-li:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(getRecommendations.data.content) }}
              />
            ) : null}
          </div>
          
          <div className="pt-4 border-t border-border mt-4 flex justify-end">
            <Button onClick={() => setRecoModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
