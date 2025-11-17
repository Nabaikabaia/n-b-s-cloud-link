import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Upload {
  id: string;
  short_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  expire_at: string | null;
  created_at: string;
  download_count: number;
  custom_name: string | null;
}

export const useUploads = () => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUploads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching uploads:', error);
    } else {
      setUploads(data || []);
    }
    setIsLoading(false);
  };

  const uploadFile = async (file: File, expiration: string, customName?: string) => {
    try {
      setIsLoading(true);

      // Generate unique short ID
      const { data: shortIdData, error: shortIdError } = await supabase
        .rpc('generate_short_id');

      if (shortIdError) throw shortIdError;
      const shortId = shortIdData;

      // Calculate expiration date
      let expireAt: string | null = null;
      if (expiration !== 'never') {
        const hours = {
          '1h': 1,
          '24h': 24,
          '7d': 168,
        }[expiration] || 24;
        
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);
        expireAt = expiryDate.toISOString();
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const storagePath = `${shortId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { data: uploadData, error: dbError } = await supabase
        .from('uploads')
        .insert({
          short_id: shortId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          expire_at: expireAt,
          custom_name: customName || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "✨ Upload Successful!",
        description: "Your file has been uploaded to the cloud",
      });

      await fetchUploads();
      return uploadData;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUpload = async (upload: Upload) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([upload.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', upload.id);

      if (dbError) throw dbError;

      toast({
        title: "Deleted",
        description: "Upload removed successfully",
      });

      await fetchUploads();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete upload",
        variant: "destructive",
      });
    }
  };

  const getPublicUrl = (shortId: string): string => {
    return `${window.location.origin}/d/${shortId}`;
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  return {
    uploads,
    isLoading,
    uploadFile,
    deleteUpload,
    getPublicUrl,
    fetchUploads,
  };
};
