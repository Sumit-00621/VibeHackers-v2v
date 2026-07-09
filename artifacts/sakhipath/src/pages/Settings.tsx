import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Bell, Moon, Sun, Monitor, Lock, User as UserIcon, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { currentUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [name, setName] = useState(currentUser?.displayName || "SakhiPath User");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    // In a real app, update firebase profile
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile updated successfully");
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background shadow-sm">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-background shadow-sm">
            <Sun className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and how others see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-2 border-border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-serif font-bold">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Current Role</Label>
                  <Input id="role" defaultValue="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company / University</Label>
                  <Input id="company" defaultValue="Tech Corp" />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions related to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1">Permanently delete your data and all associated content.</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 focus-visible:outline-none">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Select the theme for the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 ring-4 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                >
                  <Sun className={`w-8 h-8 mb-3 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 ring-4 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                >
                  <Moon className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5 ring-4 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                >
                  <Monitor className={`w-8 h-8 mb-3 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">System</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose what updates you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mentorship Requests</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when a mentor accepts or declines your request.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Scholarship Deadlines</Label>
                  <p className="text-sm text-muted-foreground">Get reminders 3 days before a saved scholarship closes.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">A weekly digest of your progress and new opportunities.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
