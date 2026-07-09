import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useListMentors, useGetMentorRequests, useCreateMentorRequest } from '@workspace/api-client-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Search, Star, MapPin, Building, Briefcase, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Mentors() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || "demo-user";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  
  const { data: mentorsData, isLoading: mentorsLoading } = useListMentors({
    search: searchTerm || undefined
  });
  
  const { data: requestsData } = useGetMentorRequests(userId, {
    query: { enabled: !!userId, queryKey: ['mentor-requests', userId] }
  });
  
  const createRequest = useCreateMentorRequest();
  
  const mentors = mentorsData?.items || [];
  const myRequests = requestsData?.items || [];

  const handleOpenRequest = (mentor: any) => {
    setSelectedMentor(mentor);
    setRequestMessage(`Hi ${mentor.name},\n\nI'm looking for guidance on...`);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedMentor || !requestMessage.trim()) return;
    
    try {
      await createRequest.mutateAsync({
        data: {
          userId,
          mentorId: selectedMentor.id,
          message: requestMessage,
        }
      });
      toast.success("Mentorship request sent successfully!");
      setRequestModalOpen(false);
    } catch (error) {
      toast.error("Failed to send request. Please try again.");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Check if user already requested this mentor
  const hasRequested = (mentorId: number) => {
    return myRequests.some((req: any) => req.mentorId === mentorId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Mentor Directory</h1>
          <p className="text-muted-foreground mt-1">Connect with experienced women in STEM who have walked your path.</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, role, company, or skill..." 
          className="pl-9 h-12 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentorsLoading ? (
          // Loading Skeletons
          [1,2,3,4,5,6].map(i => (
            <Card key={i} className="border-border shadow-sm p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-20 bg-muted animate-pulse rounded" />
            </Card>
          ))
        ) : mentors.length > 0 ? (
          mentors.map((mentor) => {
            const requested = hasRequested(mentor.id);
            return (
              <Card key={mentor.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20 relative">
                  <Badge 
                    variant="secondary" 
                    className={`absolute top-3 right-3 ${
                      mentor.availability === 'available' ? 'bg-emerald-500/10 text-emerald-600' : 
                      mentor.availability === 'limited' ? 'bg-amber-500/10 text-amber-600' : 
                      'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {mentor.availability}
                  </Badge>
                </div>
                
                <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col">
                  <div className="flex justify-between items-start -mt-10 mb-4">
                    <Avatar className="w-20 h-20 border-4 border-card shadow-sm bg-card">
                      <AvatarImage src={mentor.photoUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-serif text-xl font-bold">
                        {getInitials(mentor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-12 flex items-center bg-muted/50 px-2 py-1 rounded-md text-sm font-medium">
                      <Star className="w-3.5 h-3.5 text-accent fill-accent mr-1" />
                      {mentor.rating.toFixed(1)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                      {mentor.name}
                    </h3>
                    <div className="text-muted-foreground text-sm mt-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{mentor.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{mentor.organization}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed mb-4 line-clamp-3">
                    {mentor.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
                    {mentor.specializations.slice(0, 3).map((skill: string, i: number) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                    {mentor.specializations.length > 3 && (
                      <span className="text-[10px] font-semibold px-2 py-1 text-muted-foreground">
                        +{mentor.specializations.length - 3}
                      </span>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    variant={requested ? "outline" : "default"}
                    disabled={requested || mentor.availability === 'unavailable'}
                    onClick={() => handleOpenRequest(mentor)}
                  >
                    {requested ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                        Request Sent
                      </>
                    ) : mentor.availability === 'unavailable' ? (
                      "Currently Unavailable"
                    ) : (
                      "Request Mentorship"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">No mentors found</h3>
            <p>Try adjusting your search terms to find the right match.</p>
          </div>
        )}
      </div>

      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a message to {selectedMentor?.name} explaining what you're looking for.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMentor && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary">{getInitials(selectedMentor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedMentor.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMentor.title} at {selectedMentor.organization}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea 
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-[150px] resize-none"
                  placeholder="Introduce yourself and explain what specific guidance you are seeking..."
                />
                <p className="text-xs text-muted-foreground">
                  A thoughtful, specific message increases the chance of acceptance. Mention why you chose them specifically.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={createRequest.isPending || !requestMessage.trim()}>
              {createRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
