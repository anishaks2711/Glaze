import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SocialLinks } from '@/components/profile/SocialLinksForm';

export interface OnboardData {
  userId: string;
  fullName: string;
  username: string;
  category: string;
  avatarFile: File | null;
  isShy: boolean;
  tagline: string;
  location: string;
  socialLinks: SocialLinks;
  services: { id: string; service_name: string }[];
  photos: { file: File; caption: string | null }[];
  reviewPrompt: string;
  verifiedInstagram: boolean;
  verifiedLinkedin: boolean;
  verifiedIdentity: boolean;
}

export function useOnboardingFinish() {
  const [finishing, setFinishing] = useState(false);

  async function finish(data: OnboardData): Promise<string | null> {
    const { userId, fullName, username, category, avatarFile, isShy, tagline, location, socialLinks, services, photos, reviewPrompt, verifiedInstagram, verifiedLinkedin, verifiedIdentity } = data;
    setFinishing(true);
    try {
      // 1. Upload avatar (best-effort — failure doesn't block profile creation)
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `${userId}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('portfolio-media')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (!upErr) {
          avatarUrl = supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
        }
      }

      // 2. Refresh the JWT before writing to the DB.
      //    On deployed sites, a long onboarding session can outlive the JWT expiry.
      //    refreshSession() renews the token using the refresh token (still valid for days).
      //    Without this, the RLS policy auth.uid() = id silently rejects the insert.
      const { data: sessionData, error: sessionErr } = await supabase.auth.refreshSession();
      if (sessionErr || !sessionData.session) {
        console.error('[useOnboardingFinish] session refresh failed:', sessionErr?.message);
        return 'Your session expired before your profile could be saved. Please reload the page and try again.';
      }

      // 3. Insert the profile row (first DB write of the entire onboarding)
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userId,
        role: 'freelancer' as const,
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        category,
        tagline: tagline.trim() || null,
        location: location.trim() || null,
        social_links: socialLinks,
        avatar_url: avatarUrl,
        is_shy: isShy,
        review_prompt: reviewPrompt.trim() || null,
        verified_instagram: verifiedInstagram,
        verified_linkedin: verifiedLinkedin,
        verified_identity: verifiedIdentity,
      });
      if (profileErr) {
        console.error('[useOnboardingFinish] profile insert:', profileErr.code, profileErr.message);
        if (profileErr.code === '23505') return 'That username is already taken. Please choose a different one.';
        return 'Connection error. Please try again.';
      }

      // 4. Insert services (best-effort — partial failure is acceptable)
      if (services.length > 0) {
        const { error: svcErr } = await supabase.from('freelancer_services').insert(
          services.map(s => ({ freelancer_id: userId, service_name: s.service_name }))
        );
        if (svcErr) console.error('[useOnboardingFinish] services insert:', svcErr.message);
      }

      // 5. Upload portfolio photos + insert records (best-effort per photo)
      for (let i = 0; i < photos.length; i++) {
        const { file, caption } = photos[i];
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${userId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from('portfolio-media').upload(path, file);
        if (upErr) { console.error('[useOnboardingFinish] photo upload:', upErr.message); continue; }
        const url = supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
        const { error: insErr } = await supabase.from('freelancer_portfolio').insert({
          freelancer_id: userId,
          image_url: url,
          caption: caption || null,
          display_order: i,
        });
        if (insErr) console.error('[useOnboardingFinish] portfolio insert:', insErr.message);
      }

      return null; // success
    } catch (e) {
      console.error('[useOnboardingFinish] unexpected error:', e);
      return 'Connection error. Please try again.';
    } finally {
      setFinishing(false);
    }
  }

  return { finish, finishing };
}
