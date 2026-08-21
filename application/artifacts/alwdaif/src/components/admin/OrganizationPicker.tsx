import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Search, Check, ChevronDown, Plus } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import { useToast } from "@/hooks/use-toast";
import type { Organization, OrganizationType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface OrganizationPickerProps {
  value: string;
  onChange: (orgId: string, orgName: string, orgType?: string) => void;
}

const fallbackOrgTypes = [
  { value: "government", label: "حكومية" },
  { value: "military",   label: "عسكرية" },
  { value: "company",    label: "شركة" },
];

export default function OrganizationPicker({ value, onChange }: OrganizationPickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    type: "",
    description: "",
    website: "",
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => fetch("/api/admin/organizations", { credentials: "include" }).then(r => r.json()),
  });

  const { data: fetchedOrgTypes = [] } = useQuery<OrganizationType[]>({
    queryKey: ["/api/admin/organization-types"],
    queryFn: () => fetch("/api/admin/organization-types", { credentials: "include" }).then(r => r.json()),
  });

  const orgTypes = fetchedOrgTypes.length > 0
    ? fetchedOrgTypes.map(t => ({ value: t.value, label: t.label }))
    : fallbackOrgTypes;

  const defaultType = orgTypes[0]?.value ?? "government";

  const getTypeLabel = (typeValue: string) => {
    return orgTypes.find(t => t.value === typeValue)?.label ?? typeValue;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const r = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.message || "فشل في إضافة الجهة");
      }
      return r.json();
    },
    onSuccess: (newOrg: Organization) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      onChange(newOrg.id.toString(), newOrg.name);
      setAddDialogOpen(false);
      setIsOpen(false);
      setSearchQuery("");
      resetForm();
      toast({ title: "تمت الإضافة", description: `تم إضافة "${newOrg.name}" وتحديدها` });
    },
    onError: (err: any) => toast({ title: "الجهة موجودة", description: err?.message || "فشل في إضافة الجهة", variant: "destructive" }),
  });

  const resetForm = () => setFormData({ name: "", logo: "", type: defaultType, description: "", website: "" });

  const selectedOrg = organizations.find(org => org.id.toString() === value);

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (org: Organization) => {
    onChange(org.id.toString(), org.name, org.type);
    setIsOpen(false);
    setSearchQuery("");
  };

  const openAddDialog = () => {
    if (searchQuery.trim()) {
      setFormData(prev => ({ ...prev, name: searchQuery.trim() }));
    }
    setIsOpen(false);
    setAddDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors text-right",
            "bg-muted/50 border-border text-foreground hover:bg-muted"
          )}
          data-testid="button-organization-picker"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className={cn("truncate", !selectedOrg && "text-muted-foreground")}>
              {selectedOrg ? selectedOrg.name : "-- اختر جهة --"}
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن جهة..."
                  className="bg-muted/50 border-border text-foreground pr-10"
                  autoFocus
                  data-testid="input-search-organization"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { onChange("", ""); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-muted/50 transition-colors",
                  !value && "bg-primary/10"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">-- بدون جهة --</span>
              </button>

              {filteredOrgs.length === 0 ? (
                <div className="px-3 py-3 text-center">
                  <p className="text-muted-foreground text-sm mb-2">لا توجد نتائج</p>
                  <button
                    type="button"
                    onClick={openAddDialog}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    data-testid="button-add-org-from-search"
                  >
                    <Plus className="h-4 w-4" />
                    {searchQuery.trim() ? `أضف "${searchQuery.trim()}" كجهة جديدة` : "إضافة جهة جديدة"}
                  </button>
                </div>
              ) : (
                filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelect(org)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-muted/50 transition-colors",
                      value === org.id.toString() && "bg-primary/10"
                    )}
                    data-testid={`organization-option-${org.id}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {org.logo ? (
                        <img src={org.logo} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(org.type)}
                      </p>
                    </div>
                    {value === org.id.toString() && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-border">
              <button
                type="button"
                onClick={openAddDialog}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors font-medium"
                data-testid="button-add-new-organization"
              >
                <Plus className="h-4 w-4" />
                إضافة جهة جديدة
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg rounded-2xl" dir="rtl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إضافة جهة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">اسم الجهة *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-11 text-base rounded-xl"
                placeholder="مثال: وزارة الموارد البشرية"
                data-testid="input-new-org-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">النوع *</Label>
              <Select value={formData.type || defaultType} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="h-11 text-base rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orgTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">شعار الجهة</Label>
              <MediaPicker
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                placeholder="اختر شعار الجهة"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">الموقع الإلكتروني</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="h-11 text-base rounded-xl"
                data-testid="input-new-org-website"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="text-base rounded-xl"
                data-testid="input-new-org-description"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="h-11 px-6 text-base rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 px-8 bg-primary hover:bg-primary/90 text-foreground font-bold text-base rounded-xl"
                data-testid="button-submit-new-org"
              >
                {createMutation.isPending ? "جاري الإضافة..." : "إضافة وتحديد"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
