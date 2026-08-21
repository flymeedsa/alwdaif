import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image, Upload, Search, Check, X } from "lucide-react";
import type { Media } from "@shared/schema";
import { cn } from "@/lib/utils";

function toDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `/api/objects${url.replace(/^\/objects/, "")}`;
}

interface MediaPickerProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function MediaPicker({ value, onChange, placeholder = "اختر صورة" }: MediaPickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ["/api/admin/media"],
    queryFn: async () => {
      const res = await fetch("/api/admin/media", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create media");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
  });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];
    
    try {
      const urlResponse = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!urlResponse.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlResponse.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      const created = await createMutation.mutateAsync({
        name: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        objectPath: objectPath,
        url: objectPath,
        mimeType: file.type,
        size: file.size,
      });

      onChange(created.url);
      setIsOpen(false);
      toast({ title: "تم الرفع", description: "تم رفع الصورة واختيارها" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في رفع الملف", variant: "destructive" });
    }
    
    setIsUploading(false);
    e.target.value = "";
  }, [createMutation, onChange, toast]);

  const selectMedia = (media: Media) => {
    onChange(media.url);
    setIsOpen(false);
  };

  const filteredMedia = mediaItems.filter((item) =>
    item.mimeType?.startsWith("image/") &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.filename.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {value ? (
          <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border bg-muted flex-shrink-0 shadow-sm">
            <img src={toDisplayUrl(value)} alt="" className="w-full h-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange("")}
              className="absolute top-1 left-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="border-border text-muted-foreground gap-2 flex-1 hover:text-foreground hover:border-foreground/30"
          data-testid="button-open-media-picker"
        >
          <Image className="h-4 w-4" />
          {value ? "تغيير الصورة" : placeholder}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>اختر صورة من مكتبة الوسائط</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white pr-10"
              />
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button asChild disabled={isUploading} className="gap-2">
                <span>
                  <Upload className="h-4 w-4" />
                  {isUploading ? "جاري الرفع..." : "رفع صورة"}
                </span>
              </Button>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">لا توجد صور</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => selectMedia(item)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                      "border-2 border-transparent hover:border-primary/50",
                      value === item.url && "border-primary ring-2 ring-primary/30"
                    )}
                  >
                    <img
                      src={toDisplayUrl(item.url)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {value === item.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
