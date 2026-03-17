import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import donutLogo from '@/assets/donut-logo.png';
import PortfolioUploadStep from '@/components/PortfolioUploadStep';
import ServiceForm from '@/components/ServiceForm';
import ProfileBasicsForm from '@/components/profile/ProfileBasicsForm';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AboutForm from '@/components/profile/AboutForm';
import SocialLinksForm, { type SocialLinks } from '@/components/profile/SocialLinksForm';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES: Record<Step, string> = {
  1: 'Profile Basics', 2: 'Profile Photo', 3: 'About You', 4: 'Your Services', 5: 'Portfolio',
};
const STEP_DESCS: Record<Step, string> = {
  1: 'Tell clients who you are. Category is required.',
  2: 'Add a profile photo so clients can recognise you.',
  3: 'A tagline and location help clients find you.',
  4: 'Add the services clients can book you for.',
  5: 'Show clients your best work.',
};

export default function FreelancerOnboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tagline, setTagline] = useState('');
  const [location, setLocation] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('full_name, category, tagline, location, avatar_url')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return;
        setFullName(data.full_name ?? '');
        setCategory(data.category ?? '');
        setTagline(data.tagline ?? '');
        setLocation(data.location ?? '');
        setAvatarPreview(data.avatar_url ?? null);
      });
  }, [user?.id]);

  const goToProfile = () => navigate(`/profile/${user?.id}`);

  async function saveStep1() {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName.trim(), category }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: 'Connection error. Please try again.', variant: 'destructive' }); return; }
    setStep(2);
  }

  async function saveStep2() {
    if (!user?.id) return;
    if (avatarFile) {
      setSaving(true);
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('portfolio-media').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (!uploadErr) {
        const url = supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      }
      setSaving(false);
    }
    setStep(3);
  }

  async function saveStep3() {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ tagline: tagline.trim() || null, location: location.trim() || null, social_links: socialLinks }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: 'Connection error. Please try again.', variant: 'destructive' }); return; }
    setStep(4);
  }

  async function handleStep4Continue() {
    if (!user?.id) return;
    const { data } = await supabase.from('freelancer_services').select('id').eq('freelancer_id', user.id);
    if (!data || data.length === 0) {
      toast({ title: 'Add a service', description: 'Please add at least one service before continuing.', variant: 'destructive' });
      return;
    }
    setStep(5);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity cursor-pointer">
        <img src={donutLogo} alt="Glaze" className="h-8 w-8" />
        <span className="font-heading text-xl font-bold">Glaze</span>
        <Home className="h-4 w-4 text-muted-foreground ml-1" />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex gap-1 mb-2">
            {([1, 2, 3, 4, 5] as Step[]).map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 5</p>
          <CardTitle>{STEP_TITLES[step]}</CardTitle>
          <CardDescription>{STEP_DESCS[step]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <ProfileBasicsForm fullName={fullName} onFullNameChange={setFullName} category={category} onCategoryChange={setCategory} />
              <Button className="w-full" disabled={saving || !category || !fullName.trim()} onClick={saveStep1}>
                {saving ? 'Saving...' : 'Next'}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <AvatarUpload previewUrl={avatarPreview} onChange={(f, url) => { setAvatarFile(f); setAvatarPreview(url); }} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Skip</Button>
                <Button className="flex-1" disabled={saving} onClick={saveStep2}>{saving ? 'Uploading...' : 'Next'}</Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <AboutForm tagline={tagline} onTaglineChange={setTagline} location={location} onLocationChange={setLocation} />
              <SocialLinksForm value={socialLinks} onChange={setSocialLinks} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Skip</Button>
                <Button className="flex-1" disabled={saving} onClick={saveStep3}>{saving ? 'Saving...' : 'Next'}</Button>
              </div>
            </>
          )}
          {step === 4 && user?.id && (
            <>
              <ServiceForm freelancerId={user.id} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(5)}>Skip</Button>
                <Button className="flex-1" onClick={handleStep4Continue}>Continue to Portfolio</Button>
              </div>
            </>
          )}
          {step === 5 && user?.id && (
            <PortfolioUploadStep freelancerId={user.id} onSkip={goToProfile} onDone={goToProfile} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
