import { Link } from "wouter";
import { Clock, Building2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Job, Organization } from "@shared/schema";
import { formatRelativeDate } from "@/lib/formatDate";
import { isJobClosed } from "@/lib/jobUtils";
import { toDisplayUrl } from "@/lib/mediaUrl";
export { isJobClosed };

interface JobWithOrg extends Job {
  organization?: Organization | null;
  isResult?: boolean;
}

interface JobCardProps {
  job: JobWithOrg;
  variant?: "default" | "compact" | "featured";
}

export default function JobCard({ job }: JobCardProps) {
  const orgLogo = toDisplayUrl(job.organization?.logo || job.logo);
  const formattedDate = formatRelativeDate(job.date, job.createdAt);
  const closed = isJobClosed(job);
  
  const jobLink = job.isResult ? `/jobs/post/${job.id}?isResult=true` : `/jobs/post/${job.id}`;
  
  return (
    <Card className={`border-0 md:border transition-all duration-200 group overflow-hidden ${
      closed
        ? "bg-muted/60 md:bg-muted/40 border-border/40 opacity-80"
        : "md:bg-card/80 bg-transparent md:glass border-border/60 md:shadow-lg shadow-none md:shadow-black/10 md:hover:shadow-xl md:hover:border-primary/35"
    }`}>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <Link href={jobLink} data-testid={`link-job-mobile-${job.id}`}>
          <div className={`rounded-2xl p-3 border shadow-sm flex flex-col justify-center ${
            closed ? "bg-muted/50 border-border/40" : "bg-card border-border"
          }`}>
            <div className="flex gap-3 items-center">
              <div className="shrink-0 self-center">
                <div className="w-14 h-14 bg-muted rounded-xl border-2 border-dashed border-border p-1 flex items-center justify-center overflow-hidden">
                  {orgLogo ? (
                    <img src={orgLogo} alt={job.company} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-[13px] font-heading leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
                    closed ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {job.title}
                  </h3>
                  {closed && (
                    <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" />
                      مغلقة
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-body text-muted-foreground truncate">{job.company}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-body text-muted-foreground">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0">
              <div className={`w-14 h-14 rounded-xl border p-2 flex items-center justify-center shadow-sm ${
                closed ? "bg-muted border-border/40" : "bg-background border-border"
              }`}>
                {orgLogo ? (
                  <img src={orgLogo} alt={job.company} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className={`h-7 w-7 ${closed ? "text-muted-foreground" : "text-primary"}`} />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h3 className={`font-bold font-heading text-[14px] leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1 ${
                  closed ? "text-muted-foreground" : "text-foreground"
                }`}>
                  <Link href={jobLink} data-testid={`link-job-${job.id}`}>{job.title}</Link>
                </h3>
                {closed && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    <Lock className="h-3 w-3" />
                    مغلقة
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className={`h-4 w-4 ${closed ? "text-muted-foreground" : "text-primary"}`} />
                  <Link
                    href={job.organizationId ? `/jobs/organizations/${job.organizationId}` : `/jobs/company/${encodeURIComponent(job.company)}`}
                    className="font-medium text-foreground/80 truncate hover:text-primary transition-colors"
                    data-testid={`link-company-${job.id}`}
                    title={job.company}
                  >
                    {job.company}
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${closed ? "text-muted-foreground" : "text-primary"}`} />
                  <span className="text-muted-foreground">{formattedDate}</span>
                </div>
                
              </div>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
}
