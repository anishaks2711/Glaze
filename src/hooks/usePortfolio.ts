import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

export function usePortfolio(freelancerId: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!freelancerId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('freelancer_portfolio')
      .select('id, image_url, caption, display_order')
      .eq('freelancer_id', freelancerId)
      .order('display_order')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPortfolio(data ?? []);
        setLoading(false);
      });
  }, [freelancerId]);

  async function addPhoto(file: File, caption: string | null, displayOrder?: number): Promise<string | null> {
    if (!freelancerId) return 'Not authenticated';
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}.${ext}`;
    const path = `${freelancerId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(path, file);
    if (uploadError) {
      console.error('[usePortfolio] storage upload error:', uploadError.message);
      return 'Upload failed. Please try again.';
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(path);

    const order = displayOrder ?? portfolio.length;
    const { data, error: insertError } = await supabase
      .from('freelancer_portfolio')
      .insert({ freelancer_id: freelancerId, image_url: publicUrl, caption: caption || null, display_order: order })
      .select('id, image_url, caption, display_order')
      .single();
    if (insertError) return insertError.message;
    setPortfolio(prev => [...prev, data]);
    return null;
  }

  async function deletePhoto(id: string): Promise<string | null> {
    const { error } = await supabase
      .from('freelancer_portfolio')
      .delete()
      .eq('id', id);
    if (error) return error.message;
    setPortfolio(prev => prev.filter(p => p.id !== id));
    return null;
  }

  return { portfolio, loading, error, addPhoto, deletePhoto };
}
