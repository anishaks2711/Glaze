import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingFinish } from '@/hooks/useOnboardingFinish';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import donutLogo from '@/assets/Donut.svg';
import ProfileBasicsForm from '@/components/profile/ProfileBasicsForm';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AboutForm from '@/components/profile/AboutForm';
import SocialLinksForm, { type SocialLinks } from '@/components/profile/SocialLinksForm';
import ServiceForm from '@/components/ServiceForm';
import PortfolioUploadStep from '@/components/PortfolioUploadStep';
import ReviewPromptForm from '@/components/profile/ReviewPromptForm';
import OnboardStep7Review from '@/components/OnboardStep7Review';
import VerificationStep from '@/components/profile/VerificationStep';
import { validateSocialUrl, validateUsername } from '@/lib/validation';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
interface PortfolioPhoto { file: File; preview: string; caption: string | null; }

const TITLES: Record<Step, string> = {
  1: 'Profile Basics', 2: 'Profile Photo', 3: 'About You',
  4: 'Your Services', 5: 'Portfolio', 6: 'Review Prompt', 7: 'Review & Complete',
};
const DESCS: Record<Step, string> = {
  1: 'Tell clients who you are. All fields required.',
  2: 'Add a profile photo so clients can recognise you.',
  3: 'A tagline and location help clients find you. At least one social link is required.',
  4: 'Add at least one service clients can book you for.',
  5: 'Show clients your best work.',
  6: 'What would you like clients to mention in their Glazes?',
  7: 'Review your profile before publishing.',
};

export default function FreelancerOnboard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { finish, finishing } = useOnboardingFinish();
  const [step, setStep] = useState<Step>(1);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const [fullName, setFullName] = useState<string>((user?.user_metadata?.full_name as string | undefined) ?? '');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isShy, setIsShy] = useState(false);
  const [tagline, setTagline] = useState('');
  const [location, setLocation] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [socialError, setSocialError] = useState<string | null>(null);
  const [verifiedInstagram, setVerifiedInstagram] = useState(false);
  const [verifiedLinkedin, setVerifiedLinkedin] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [services, setServices] = useState<{ id: string; service_name: string }[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);
  const [reviewPrompt, setReviewPrompt] = useState('');

  async function handleFinish() {
    if (!user?.id) return;
    const err = await finish({
      userId: user.id, fullName, username, category, avatarFile, isShy,
      tagline, location, socialLinks, services,
      photos: portfolioPhotos.map(p => ({ file: p.file, caption: p.caption })),
      reviewPrompt, verifiedInstagram, verifiedLinkedin, verifiedIdentity,
    });
    if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); return; }
    await refreshProfile();
    navigate(`/profile/${user.id}`, { replace: true });
  }

  function checkVerification(): boolean {
    if (!verifiedInstagram && !verifiedLinkedin && !verifiedIdentity) {
      setVerifyError('At least one verification is required.');
      return false;
    }
    setVerifyError(null);
    return true;
  }

  function handleNextStep3() {
    if (!checkVerification()) return;
    const filled = Object.values(socialLinks).filter(v => v?.trim());
    if (filled.length === 0) { setSocialError('At least one social link is required.'); return; }
    const bad = filled.find(v => !validateSocialUrl(v!).valid);
    if (bad) { setSocialError('All links must start with https://'); return; }
    setSocialError(null);
    setStep(4);
  }

  function handleSkipStep3() {
    if (!checkVerification()) return;
    setSocialError(null);
    setStep(4);
  }

  function handleNextStep4() {
    if (services.length === 0) {
      toast({ title: 'Add a service', description: 'Please add at least one service before continuing.', variant: 'destructive' });
      return;
    }
    setStep(5);
  }

  const step1Valid = !!category && !!fullName.trim() && validateUsername(username).valid;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave onboarding?</AlertDialogTitle>
            <AlertDialogDescription>Your progress will be lost and your profile won't be created.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/')}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button onClick={() => setLeaveOpen(true)} className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity cursor-pointer">
        <img src={donutLogo} alt="Glaze" className="h-8 w-8" />
        <span className="font-heading text-xl font-bold">Glaze</span>
      </button>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex gap-1 mb-2">
            {([1,2,3,4,5,6,7] as Step[]).map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 7</p>
          <CardTitle>{TITLES[step]}</CardTitle>
          <CardDescription>{DESCS[step]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (<>
            <ProfileBasicsForm fullName={fullName} onFullNameChange={setFullName} username={username} onUsernameChange={setUsername} category={category} onCategoryChange={setCategory} />
            <Button className="w-full" disabled={!step1Valid || finishing} onClick={() => setStep(2)}>Next</Button>
          </>)}
          {step === 2 && (<>
            <AvatarUpload previewUrl={avatarPreview} onChange={(f, url) => { setAvatarFile(f); setAvatarPreview(url); }} isShy={isShy} onIsShyChange={setIsShy} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Skip</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next</Button>
            </div>
          </>)}
          {step === 3 && (<>
            <AboutForm tagline={tagline} onTaglineChange={setTagline} location={location} onLocationChange={setLocation} />
            <SocialLinksForm value={socialLinks} onChange={v => { setSocialLinks(v); setSocialError(null); }} />
            {socialError && <p className="text-sm text-destructive">{socialError}</p>}
            <VerificationStep
              verifiedInstagram={verifiedInstagram} verifiedLinkedin={verifiedLinkedin} verifiedIdentity={verifiedIdentity}
              onVerifiedInstagramChange={v => { setVerifiedInstagram(v); setVerifyError(null); }}
              onVerifiedLinkedinChange={v => { setVerifiedLinkedin(v); setVerifyError(null); }}
              onVerifiedIdentityChange={v => { setVerifiedIdentity(v); setVerifyError(null); }}
            />
            {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button variant="outline" className="flex-1" onClick={handleSkipStep3}>Skip</Button>
              <Button className="flex-1" onClick={handleNextStep3}>Next</Button>
            </div>
          </>)}
          {step === 4 && (<>
            <ServiceForm localServices={services} onLocalAdd={n => setServices(p => [...p, { id: crypto.randomUUID(), service_name: n }])} onLocalRemove={id => setServices(p => p.filter(s => s.id !== id))} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
              <Button className="flex-1" onClick={handleNextStep4}>Next</Button>
            </div>
          </>)}
          {step === 5 && (<>
            <Button variant="outline" size="sm" onClick={() => setStep(4)}>← Back</Button>
            <PortfolioUploadStep freelancerId={user?.id ?? ''} onSkip={() => setStep(6)} onDone={() => setStep(6)}
              onCollect={photos => { setPortfolioPhotos(photos.map(p => ({ ...p, preview: URL.createObjectURL(p.file) }))); setStep(6); }} />
          </>)}
          {step === 6 && (<>
            <ReviewPromptForm value={reviewPrompt} onChange={setReviewPrompt} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(5)}>Back</Button>
              <Button variant="outline" className="flex-1" onClick={() => setStep(7)}>Skip</Button>
              <Button className="flex-1" onClick={() => setStep(7)}>Next</Button>
            </div>
          </>)}
          {step === 7 && (
            <OnboardStep7Review fullName={fullName} username={username} category={category} avatarPreview={avatarPreview}
              isShy={isShy} tagline={tagline} location={location} socialLinks={socialLinks} services={services}
              portfolioPhotos={portfolioPhotos} reviewPrompt={reviewPrompt}
              verifiedInstagram={verifiedInstagram} verifiedLinkedin={verifiedLinkedin} verifiedIdentity={verifiedIdentity}
              onEdit={s => setStep(s as Step)} onComplete={handleFinish} finishing={finishing} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
