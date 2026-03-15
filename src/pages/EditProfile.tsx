import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { validateTagline } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ServiceForm from '@/components/ServiceForm';
import PortfolioManager from '@/components/PortfolioManager';
import ProfileBasicsForm from '@/components/profile/ProfileBasicsForm';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AboutForm from '@/components/profile/AboutForm';

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

  async function handleSave() {
    const taglineV = validateTagline(tagline);
    if (!taglineV.valid) {
      toast({ title: 'Invalid tagline', description: taglineV.error, variant: 'destructive' });
      return;
    }
    setSaving(true);
    let avatar_url: string | undefined;
    if (avatarFile && user?.id) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('portfolio-media')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (!uploadErr) {
        avatar_url = supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
      }
    }
    const updates: Record<string, string | null> = {
      full_name: fullName.trim(),
      tagline: tagline.trim() || null,
      category: category || null,
      location: location.trim() || null,
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
            <AvatarUpload
              previewUrl={avatarPreview}
              onChange={(f, url) => { setAvatarFile(f); setAvatarPreview(url); }}
            />
            <ProfileBasicsForm
              fullName={fullName} onFullNameChange={setFullName}
              category={category} onCategoryChange={setCategory}
            />
            <AboutForm
              tagline={tagline} onTaglineChange={setTagline}
              location={location} onLocationChange={setLocation}
            />
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
