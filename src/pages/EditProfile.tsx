import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { validateTagline } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ServiceForm from '@/components/ServiceForm';
import PortfolioManager from '@/components/PortfolioManager';

const CATEGORIES = ['Baker', 'Makeup Artist', 'Photographer', 'DJ', 'Florist', 'Personal Chef', 'Other'];

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taglineError, setTaglineError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('full_name, tagline, category, location, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setFullName(data.full_name ?? '');
        setTagline(data.tagline ?? '');
        setCategory(data.category ?? '');
        setLocation(data.location ?? '');
        setAvatarPreview(data.avatar_url ?? null);
      });
  }, [user?.id]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    const taglineV = validateTagline(tagline);
    if (!taglineV.valid) { setTaglineError(taglineV.error ?? 'Invalid tagline'); return; }
    setSaving(true);
    let avatar_url: string | undefined;
    if (avatarFile && user?.id) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('portfolio-media')
        .upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        avatar_url = supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
      }
    }
    const updates: Record<string, string> = {
      full_name: fullName.trim(),
      tagline: tagline.trim(),
      category,
      location: location.trim(),
    };
    if (avatar_url) updates.avatar_url = avatar_url;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: 'Connection error. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Profile saved!' });
      navigate(`/profile/${user!.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-lg font-bold">Edit Profile</h1>
        </div>
      </header>
      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {avatarPreview && (
              <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
            )}
            <div>
              <Label htmlFor="avatar">Profile Photo</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={e => { setTagline(e.target.value); setTaglineError(null); }}
                maxLength={150}
                className="mt-1"
                placeholder="e.g. 5-star baker in NYC"
              />
              {taglineError && <p className="text-sm text-destructive mt-1">{taglineError}</p>}
              <p className="text-xs text-muted-foreground mt-1">{tagline.length}/150</p>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="mt-1"
                placeholder="e.g. New York, NY"
              />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Manage Services</CardTitle></CardHeader>
          <CardContent>
            <ServiceForm freelancerId={user?.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Manage Portfolio</CardTitle></CardHeader>
          <CardContent>
            <PortfolioManager freelancerId={user?.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
