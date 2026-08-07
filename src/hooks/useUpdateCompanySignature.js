import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

// Convertit un dataURL (base64) en Blob pour l'upload Supabase Storage
function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function useUpdateCompanySignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, dataUrl }) => {
      // dataUrl === null => on retire la signature
      if (!dataUrl) {
        const { error } = await supabase
          .from("companies")
          .update({ signature_url: null })
          .eq("id", companyId);
        if (error) throw error;
        return null;
      }

      const blob = dataUrlToBlob(dataUrl);
      const path = `${companyId}/company-signature-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("signatures").getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ signature_url: publicUrl })
        .eq("id", companyId);
      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}