import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  service_name: string;
}

export function useServices(freelancerId: string | undefined) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!freelancerId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('freelancer_services')
      .select('id, service_name')
      .eq('freelancer_id', freelancerId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setServices(data ?? []);
        setLoading(false);
      });
  }, [freelancerId]);

  async function addService(name: string): Promise<string | null> {
    if (!freelancerId) return 'Not authenticated';
    const trimmed = name.trim();
    if (!trimmed) return 'Service name cannot be empty';
    const { data, error } = await supabase
      .from('freelancer_services')
      .insert({ freelancer_id: freelancerId, service_name: trimmed })
      .select('id, service_name')
      .single();
    if (error) return error.message;
    setServices(prev => [...prev, data]);
    return null;
  }

  async function removeService(id: string): Promise<string | null> {
    const { error } = await supabase
      .from('freelancer_services')
      .delete()
      .eq('id', id);
    if (error) return error.message;
    setServices(prev => prev.filter(s => s.id !== id));
    return null;
  }

  return { services, loading, error, addService, removeService };
}
