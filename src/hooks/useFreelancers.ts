import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DbFreelancer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  tagline: string | null;
  category: string | null;
  location: string | null;
  avgRating: number;
  reviewCount: number;
}

export function useFreelancers(searchQuery = '') {
  const [freelancers, setFreelancers] = useState<DbFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFreelancers = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, tagline, category, location, reviews!reviews_freelancer_id_fkey(rating)')
          .eq('role', 'freelancer')
          .eq('is_public', true);

        const trimmed = searchQuery.trim();
        if (trimmed) {
          query = query.or(`full_name.ilike.%${trimmed}%,category.ilike.%${trimmed}%`);
        }

        const { data, error: supaErr } = await query;
        if (supaErr) throw supaErr;
        if (cancelled) return;

        const mapped: DbFreelancer[] = (data ?? []).map((p: any) => {
          const ratings: number[] = (p.reviews ?? []).map((r: any) => r.rating);
          const avg =
            ratings.length > 0
              ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
              : 0;
          return {
            id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            tagline: p.tagline,
            category: p.category,
            location: p.location,
            avgRating: avg,
            reviewCount: ratings.length,
          };
        });

        setFreelancers(mapped);
      } catch (err) {
        console.error('Error fetching freelancers:', err);
        if (!cancelled) setError('Connection error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFreelancers();
    return () => { cancelled = true; };
  }, [searchQuery]);

  return { freelancers, loading, error };
}
