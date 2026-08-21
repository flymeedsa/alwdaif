import { useState, useMemo, Fragment } from "react";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  ClipboardCheck, Calendar, Building2, ExternalLink,
  ChevronDown, ChevronUp, Archive, Clock, Search, FileText, X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Result } from "@shared/schema";
import { formatRelativeDate } from "@/lib/formatDate";
import { usePageTitle } from "@/hooks/usePageTitle";

const ARCHIVE_DAYS = 14;

function isArchived(result: Result): boolean {
  const created = result.createdAt ? new Date(result.createdAt) : null;
  if (!created) return false;
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > ARCHIVE_DAYS;
}

function ResultDetailsSheet({ item, open, onClose }: { item: Result; open: boolean; onClose: () => void }) {
  const archived = isArchived(item);
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" dir="rtl" className="max-h-[88vh] rounded-t-2xl px-0 pb-0 flex flex-col">
        <div className="overflow-y-auto flex-1">
          <SheetHeader className="px-4 pb-3 pt-4 border-b border-border/60 text-right">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                archived
                  ? "bg-muted/50 border-border/50"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <ClipboardCheck className={`h-5 w-5 ${archived ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-black text-foreground text-right leading-snug">
                  {item.title}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 mt-1 justify-start">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item.org}</span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="px-4 py-4 space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`text-xs px-2.5 py-1 border-none font-semibold ${
                  archived
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {item.type || "نتائج توظيف"}
              </Badge>
              {!archived && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  إعلان حالي
                </span>
              )}
              {archived && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border/60 px-2 py-1 rounded-full">
                  <Archive className="h-3 w-3" />
                  في الأرشيف
                </span>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2.5">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span>{formatRelativeDate(item.date, item.createdAt)}</span>
              {item.date && (
                <span className="text-muted-foreground/60 mr-auto text-xs">{item.date}</span>
              )}
            </div>

            {/* Details */}
            {item.details ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/70">
                  <FileText className="h-3.5 w-3.5" />
                  تفاصيل الإعلان
                </div>
                <div className={`rounded-xl px-4 py-3 text-sm leading-loose text-foreground border ${
                  archived ? "bg-muted/30 border-border/40" : "bg-amber-500/5 border-amber-500/15"
                }`}>
                  {item.details}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl border border-dashed border-border bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد تفاصيل إضافية لهذا الإعلان</p>
              </div>
            )}
          </div>

          <SheetFooter className="px-4 pb-8 pt-0 flex-col gap-3">
            {item.inquiryUrl ? (
              <a
                href={item.inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  archived
                    ? "bg-muted hover:bg-accent text-foreground border border-border"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                }`}
                data-testid={`result-sheet-inquiry-${item.id}`}
              >
                <Search className="h-4 w-4" />
                الاستعلام عن النتائج
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-muted-foreground bg-muted/50 border border-border/50">
                <Clock className="h-4 w-4" />
                رابط الاستعلام غير متاح
              </div>
            )}
            <SheetClose asChild>
              <Button variant="outline" className="w-full" data-testid="close-result-sheet">
                <X className="h-4 w-4 ml-1" />
                إغلاق
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResultCard({ item }: { item: Result }) {
  const archived = isArchived(item);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={`group relative bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-md ${
          archived
            ? "border-border/50 hover:border-border"
            : "border-border hover:border-amber-500/40"
        }`}
        data-testid={`result-card-${item.id}`}
      >
        {/* Right accent bar */}
        <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl ${archived ? "bg-muted-foreground/20" : "bg-amber-500/70"}`} />

        <div className="px-4 py-4 pr-5">
          {/* Type badge + date row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Badge
                className={`text-[10px] px-2 py-0.5 border-none font-semibold ${
                  archived
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {item.type || "نتائج توظيف"}
              </Badge>
              {!archived && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  جديد
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatRelativeDate(item.date, item.createdAt)}
            </span>
          </div>

          {/* Icon + Title row */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              archived
                ? "bg-muted/50 border-border/50"
                : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <ClipboardCheck className={`h-5 w-5 ${archived ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`} />
            </div>
            <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors flex-1">
              {item.title}
            </h3>
          </div>

          {/* Org row */}
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{item.org}</span>
          </div>

          {/* Details preview */}
          {item.details && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {item.details}
            </p>
          )}

          {/* CTA buttons row */}
          <div className="flex gap-2">
            {/* Details button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                archived
                  ? "bg-muted/50 hover:bg-muted text-muted-foreground border-border/60"
                  : "bg-card hover:bg-amber-500/5 text-foreground border-amber-500/30 hover:border-amber-500/60"
              }`}
              data-testid={`result-details-${item.id}`}
            >
              <FileText className="h-3.5 w-3.5" />
              التفاصيل
            </button>

            {/* Inquiry button */}
            {item.inquiryUrl ? (
              <a
                href={item.inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  archived
                    ? "bg-muted hover:bg-accent text-foreground border border-border"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                }`}
                data-testid={`result-inquiry-${item.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Search className="h-3.5 w-3.5" />
                الاستعلام
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs text-muted-foreground bg-muted/50 border border-border/50">
                <Clock className="h-3.5 w-3.5" />
                غير متاح
              </div>
            )}
          </div>
        </div>
      </div>

      <ResultDetailsSheet item={item} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

export default function Results() {
  usePageTitle("نتائج التوظيف");
  const [showArchive, setShowArchive] = useState(false);
  const [visibleActive, setVisibleActive] = useState(12);
  const [visibleArchive, setVisibleArchive] = useState(8);

  const { data: dbResults = [], isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
    queryFn: () => fetch("/api/results").then(r => r.json()),
  });

  const { activeResults, archivedResults } = useMemo(() => {
    const active: Result[] = [];
    const archived: Result[] = [];
    for (const r of dbResults) {
      if (isArchived(r)) archived.push(r);
      else active.push(r);
    }
    return { activeResults: active, archivedResults: archived };
  }, [dbResults]);

  return (
    <Layout>
      <Helmet>
        <title>نتائج التوظيف الحكومي والعسكري | إعلانات الوظائف</title>
        <meta name="description" content="تابع أحدث نتائج التوظيف الحكومي والعسكري في المملكة العربية السعودية. نتائج المسابقات الوظيفية محدّثة فور صدورها." />
        <link rel="canonical" href="https://www.alwdaif.com/results" />
      </Helmet>
      <div dir="rtl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-8">

          {/* ── Page Header ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-sm">
                <ClipboardCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground">نتائج التوظيف</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  إعلانات نتائج القبول والترشيح الرسمية — فور صدورها مباشرةً
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {activeResults.length} إعلان حالي
              </div>
              {archivedResults.length > 0 && (
                <button
                  onClick={() => setShowArchive(true)}
                  className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  data-testid="open-archive-badge"
                >
                  <Archive className="h-3 w-3" />
                  {archivedResults.length} في الأرشيف
                </button>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                الإعلانات الحالية تُنقل للأرشيف بعد {ARCHIVE_DAYS} يوماً
              </div>
            </div>
          </div>

          {/* ── Loading ──────────────────────────────────────────── */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Active Results ─────────────────────────────────── */}
          {!isLoading && (
            <>
              {activeResults.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                      <ClipboardCheck className="h-3 w-3" />
                      الإعلانات الحالية
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeResults.slice(0, visibleActive).map((r, index) => (
                      <Fragment key={r.id}>
                        <ResultCard item={r} />
                      </Fragment>
                    ))}
                  </div>

                  {visibleActive < activeResults.length && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        className="w-full max-w-sm border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5"
                        onClick={() => setVisibleActive(v => v + 12)}
                        data-testid="load-more-active"
                      >
                        عرض المزيد ({activeResults.length - visibleActive} متبقية)
                        <ChevronDown className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  )}
                </section>
              ) : (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
                  <ClipboardCheck className="h-14 w-14 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-bold text-foreground mb-1">لا توجد إعلانات حالية</p>
                  <p className="text-sm text-muted-foreground">ستظهر هنا إعلانات نتائج التوظيف فور صدورها</p>
                </div>
              )}

              {/* ── Archive ──────────────────────────────────────── */}
              {archivedResults.length > 0 && (
                <section className="space-y-4">
                  <button
                    onClick={() => setShowArchive(!showArchive)}
                    className="w-full flex items-center gap-3 group"
                    data-testid="toggle-archive"
                  >
                    <div className="h-px flex-1 bg-border/50 group-hover:bg-border transition-colors" />
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted border border-border/60 px-3 py-1.5 rounded-full group-hover:bg-accent transition-colors">
                      <Archive className="h-3 w-3" />
                      الأرشيف ({archivedResults.length} إعلان)
                      {showArchive
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />}
                    </span>
                    <div className="h-px flex-1 bg-border/50 group-hover:bg-border transition-colors" />
                  </button>

                  {showArchive && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {archivedResults.slice(0, visibleArchive).map(r => (
                          <ResultCard key={r.id} item={r} />
                        ))}
                      </div>

                      {visibleArchive < archivedResults.length && (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            className="w-full max-w-sm"
                            onClick={() => setVisibleArchive(v => v + 8)}
                            data-testid="load-more-archive"
                          >
                            عرض المزيد ({archivedResults.length - visibleArchive} متبقية)
                            <ChevronDown className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
