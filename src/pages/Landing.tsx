import React from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Leaf, ArrowRight, Star, BookOpen, MessageSquare, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Redirect to="/dashboard" />;
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 lg:px-12 border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="w-6 h-6" />
          <span className="font-serif font-bold text-2xl tracking-tight">SakhiPath</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
            Log In
          </Link>
          <Button asChild className="rounded-full shadow-md hover-elevate">
            <Link href="/register">Join the Community</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 px-6 lg:px-12 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-96 h-96 rounded-full bg-accent/20 blur-3xl opacity-50" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium"
          >
            Built for Women in STEM, by Women in STEM
          </motion.div>
          <motion.h1 
            {...fadeIn}
            className="text-5xl lg:text-7xl font-bold font-serif leading-[1.1] mb-6 text-foreground"
          >
            Your brilliantly capable <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">career companion.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Navigate transitions, discover scholarships, find mentors, and build unshakable confidence with an AI mentor trained on the lived experiences of successful women in tech.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="rounded-full h-14 px-8 text-lg w-full sm:w-auto shadow-lg hover-elevate group" asChild>
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg w-full sm:w-auto hover-elevate" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-muted/30 px-6 lg:px-12 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4">Everything you need to thrive</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">SakhiPath surrounds you with the tools, knowledge, and support to reach your highest potential.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Career Mentor</h3>
              <p className="text-muted-foreground leading-relaxed">A compassionate, 24/7 AI companion that helps you prep for interviews, negotiate salary, and overcome imposter syndrome.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Targeted Learning</h3>
              <p className="text-muted-foreground leading-relaxed">Bite-sized modules on financial literacy, leadership, and technical skills curated specifically for women navigating STEM.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Resume AI</h3>
              <p className="text-muted-foreground leading-relaxed">Upload your resume and get instant, actionable feedback to highlight your true impact and pass ATS filters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 lg:px-12 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Star className="w-12 h-12 mx-auto mb-8 text-accent fill-accent" />
          <h2 className="text-3xl lg:text-5xl font-serif font-bold mb-8 leading-tight">
            "SakhiPath feels less like software and more like a brilliant older sister who knows exactly what I'm going through."
          </h2>
          <p className="text-xl opacity-90">— Priya M., Software Engineer</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-border text-center text-muted-foreground text-sm flex-shrink-0">
        <div className="flex items-center justify-center gap-2 mb-4 text-primary">
          <Leaf className="w-5 h-5" />
          <span className="font-serif font-bold text-lg">SakhiPath</span>
        </div>
        <p>© {new Date().getFullYear()} SakhiPath. Built to empower.</p>
      </footer>
    </div>
  );
}
