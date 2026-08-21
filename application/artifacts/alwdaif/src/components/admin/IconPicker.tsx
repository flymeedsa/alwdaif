import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search, Shapes, X } from "lucide-react";
import { AD_ICON_MAP, AD_ICON_NAMES, ICON_LABELS } from "@/lib/adIconMap";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function IconPicker({ value, onChange, placeholder = "اختر أيقونة" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedName = value?.startsWith("icon:") ? value.slice(5) : null;
  const SelectedIcon = selectedName ? AD_ICON_MAP[selectedName] : null;

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return AD_ICON_NAMES;
    const q = search.toLowerCase();
    return AD_ICON_NAMES.filter(name =>
      name.toLowerCase().includes(q) ||
      (ICON_LABELS[name] || "").includes(q)
    );
  }, [search]);

  const select = (name: string) => {
    onChange(`icon:${name}`);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="flex gap-2">
      {selectedName && SelectedIcon && (
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-border bg-muted/30">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <SelectedIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm text-foreground flex-1">{ICON_LABELS[selectedName] || selectedName}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            data-testid="btn-clear-icon"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-border text-muted-foreground gap-2 flex-1 hover:text-foreground hover:border-foreground/30"
        data-testid="button-open-icon-picker"
      >
        {SelectedIcon
          ? <SelectedIcon className="h-4 w-4 text-primary" />
          : <Shapes className="h-4 w-4" />
        }
        {selectedName ? "تغيير الأيقونة" : placeholder}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>اختر أيقونة للإعلان</DialogTitle>
          </DialogHeader>

          <div className="relative flex-shrink-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث بالاسم أو الوصف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
              autoFocus
              data-testid="input-icon-search"
            />
          </div>

          <p className="text-xs text-muted-foreground flex-shrink-0">
            {filteredIcons.length} أيقونة متاحة
          </p>

          <div className="flex-1 overflow-y-auto">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                لا توجد أيقونات مطابقة للبحث
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-1">
                {filteredIcons.map(name => {
                  const Icon = AD_ICON_MAP[name];
                  const isSelected = selectedName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={ICON_LABELS[name] || name}
                      onClick={() => select(name)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-primary/5",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-muted-foreground"
                      )}
                      data-testid={`icon-option-${name}`}
                    >
                      <Icon className="h-5 w-5" />
                      {isSelected && (
                        <div className="absolute top-1 left-1">
                          <Check className="h-2.5 w-2.5 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
