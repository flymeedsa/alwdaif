import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Code, Quote, Heading1, Heading2, Heading3, Minus,
  Palette, Type, ChevronDown, ArrowRight, Save, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const colorOptions = [
  '#000000', '#374151', '#DC2626', '#EA580C', '#D97706',
  '#65A30D', '#16A34A', '#0891B2', '#2563EB', '#7C3AED', '#DB2777'
];

const fontSizes = [10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28];

const arabicFonts = [
  { name: 'Almarai', label: 'المراعي' },
  { name: 'Cairo', label: 'القاهرة' },
  { name: 'Tajawal', label: 'تجول' },
  { name: 'Amiri', label: 'أميري' },
  { name: 'El Messiri', label: 'المسيري' },
];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize2: { setFontSize: (size: string) => ReturnType; unsetFontSize: () => ReturnType; };
    fontFamily2: { setFontFamily: (family: string) => ReturnType; unsetFontFamily: () => ReturnType; };
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: { fontSize: { default: null, parseHTML: el => el.style.fontSize?.replace(/['"]+/g, ''), renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {} } } }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: { fontFamily: { default: null, parseHTML: el => el.style.fontFamily?.replace(/['"]+/g, ''), renderHTML: attrs => attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {} } } }];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }) => chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }) => chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    };
  },
});

function CommunityEditor({ content, onChange }: { content: string; onChange: (v: string) => void }) {
  const [showColor, setShowColor] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColor(false); setShowFontSize(false); setShowFontFamily(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, strike: {} }),
      Underline, TextStyle, Color, FontSize, FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      ImageExtension.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      Placeholder.configure({ placeholder: 'اكتب محتوى موضوعك هنا...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose dark:prose-invert max-w-none min-h-[350px] p-5 focus:outline-none text-foreground', dir: 'rtl' },
    },
  });

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  const TB = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} title={title}
      className={cn('h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-foreground/60 hover:text-foreground hover:bg-accent', active && 'bg-primary/10 text-primary')}>
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-border mx-1 self-center" />;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div ref={toolbarRef} className="border-b border-border p-2 flex flex-wrap gap-0.5 items-center bg-muted/30">
        <TB onClick={() => editor.chain().focus().undo().run()} title="تراجع"><Undo className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="إعادة"><Redo className="h-4 w-4" /></TB>
        <Divider />
        <div className="relative">
          <button type="button" onClick={() => { setShowFontFamily(!showFontFamily); setShowFontSize(false); setShowColor(false); }}
            className="h-8 px-2 flex items-center gap-1 text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg text-sm transition-colors" title="نوع الخط">
            <Type className="h-4 w-4" /><ChevronDown className="h-3 w-3" />
          </button>
          {showFontFamily && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[150px] p-1">
              {arabicFonts.map(f => (
                <button key={f.name} type="button" onClick={() => { editor.chain().focus().setFontFamily(f.name).run(); setShowFontFamily(false); }}
                  className="w-full px-3 py-1.5 text-right text-foreground/70 hover:bg-accent rounded-lg text-sm" style={{ fontFamily: f.name }}>{f.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" onClick={() => { setShowFontSize(!showFontSize); setShowFontFamily(false); setShowColor(false); }}
            className="h-8 px-2 flex items-center gap-1 text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg text-sm transition-colors min-w-[48px] justify-center" title="حجم الخط">
            <span>16</span><ChevronDown className="h-3 w-3" />
          </button>
          {showFontSize && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 p-1 max-h-48 overflow-y-auto min-w-[60px]">
              {fontSizes.map(s => (
                <button key={s} type="button" onClick={() => { editor.chain().focus().setFontSize(`${s}px`).run(); setShowFontSize(false); }}
                  className="w-full px-3 py-1 text-center text-foreground/70 hover:bg-accent rounded-lg text-sm">{s}</button>
              ))}
            </div>
          )}
        </div>
        <Divider />
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="عنوان 1"><Heading1 className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="عنوان 2"><Heading2 className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="عنوان 3"><Heading3 className="h-4 w-4" /></TB>
        <Divider />
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="عريض"><Bold className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="مائل"><Italic className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="تحته خط"><UnderlineIcon className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="يتوسطه خط"><Strikethrough className="h-4 w-4" /></TB>
        <div className="relative">
          <TB onClick={() => { setShowColor(!showColor); setShowFontSize(false); setShowFontFamily(false); }} title="لون النص"><Palette className="h-4 w-4" /></TB>
          {showColor && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 p-2 flex gap-1 flex-wrap w-36">
              {colorOptions.map(c => (
                <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColor(false); }}
                  className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
        </div>
        <Divider />
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="يمين"><AlignRight className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="توسيط"><AlignCenter className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="يسار"><AlignLeft className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="ضبط"><AlignJustify className="h-4 w-4" /></TB>
        <Divider />
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="قائمة نقطية"><List className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="قائمة مرقمة"><ListOrdered className="h-4 w-4" /></TB>
        <Divider />
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="اقتباس"><Quote className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="كود"><Code className="h-4 w-4" /></TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط فاصل"><Minus className="h-4 w-4" /></TB>
        <Divider />
        <TB onClick={() => { const url = window.prompt('أدخل الرابط:'); if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); }} active={editor.isActive('link')} title="رابط"><LinkIcon className="h-4 w-4" /></TB>
        <TB onClick={() => { const url = window.prompt('أدخل رابط الصورة:'); if (url) editor.chain().focus().setImage({ src: url }).run(); }} title="صورة"><ImageIcon className="h-4 w-4" /></TB>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror { min-height: 350px; padding: 1.25rem; direction: rtl; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before { color: hsl(var(--muted-foreground)); content: attr(data-placeholder); float: right; height: 0; pointer-events: none; }
        .ProseMirror h1 { font-size: 1.75em; font-weight: 800; margin: 0.6em 0; }
        .ProseMirror h2 { font-size: 1.4em; font-weight: 700; margin: 0.5em 0; }
        .ProseMirror h3 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0; }
        .ProseMirror ul { list-style: disc; padding-right: 1.5em; margin: 0.5em 0; }
        .ProseMirror ol { list-style: decimal; padding-right: 1.5em; margin: 0.5em 0; }
        .ProseMirror blockquote { border-right: 4px solid hsl(var(--primary)); padding-right: 1em; margin: 0.75em 0; color: hsl(var(--muted-foreground)); font-style: italic; }
        .ProseMirror pre { background: hsl(var(--muted)); padding: 1em; border-radius: 0.5em; direction: ltr; text-align: left; font-family: monospace; font-size: 0.9em; }
        .ProseMirror hr { border-color: hsl(var(--border)); margin: 1em 0; }
        .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5em; margin: 0.5em 0; }
        .ProseMirror p { margin: 0.4em 0; line-height: 1.8; }
      `}</style>
    </div>
  );
}

export default function EditCommunityPost() {
  usePageTitle("تعديل الموضوع");
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: authData } = useCommunityAuth();

  const { data: post, isLoading } = useQuery<any>({
    queryKey: [`/api/community/posts/${id}`],
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/community/categories"] });

  // Pre-fill form when post loads
  useEffect(() => {
    if (post && !initialized) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setCategoryId(post.categoryId?.toString() || "");
      setInitialized(true);
    }
  }, [post, initialized]);

  // Check ownership and 3-hour window
  const isOwner = authData?.authenticated && post && authData.member?.id === post.memberId;
  const hoursElapsed = post ? (Date.now() - new Date(post.createdAt).getTime()) / 3600000 : 0;
  const canEdit = isOwner && hoursElapsed <= 3;
  const minutesLeft = post ? Math.max(0, Math.floor((3 * 60) - (hoursElapsed * 60))) : 0;

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; categoryId: string }) => {
      const res = await apiRequest("PUT", `/api/community/posts/${id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل في تعديل الموضوع");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم التعديل بنجاح!", description: "تم حفظ التعديلات على موضوعك" });
      setLocation(`/community/post/${id}`);
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل في تعديل الموضوع", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!title.trim()) return toast({ title: "خطأ", description: "أدخل عنوان الموضوع", variant: "destructive" });
    if (!categoryId) return toast({ title: "خطأ", description: "اختر قسم الموضوع", variant: "destructive" });
    if (!content || content === '<p></p>') return toast({ title: "خطأ", description: "اكتب محتوى الموضوع", variant: "destructive" });
    updateMutation.mutate({ title: title.trim(), content, categoryId });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!canEdit) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center max-w-lg" dir="rtl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {!authData?.authenticated ? "يجب تسجيل الدخول" : !isOwner ? "ليس موضوعك" : "انتهت مهلة التعديل"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {!authData?.authenticated
              ? "سجّل الدخول للوصول إلى هذه الصفحة"
              : !isOwner
              ? "لا يمكنك تعديل موضوع شخص آخر"
              : "مهلة التعديل هي 3 ساعات فقط من وقت نشر الموضوع"}
          </p>
          <Button onClick={() => setLocation(`/community/post/${id}`)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للموضوع
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setLocation(`/community/post/${id}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="h-5 w-5" />
            <span className="font-medium">العودة للموضوع</span>
          </button>
          <h1 className="text-xl md:text-2xl font-black text-foreground">تعديل الموضوع</h1>
          <Button onClick={handleSave} disabled={updateMutation.isPending}
            className="gap-2 flex-row-reverse font-bold rounded-xl shadow-lg shadow-primary/20" data-testid="button-save">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>

        {/* Time remaining notice */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl px-4 py-3 mb-6 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            متبقي <strong>{minutesLeft} دقيقة</strong> من مهلة التعديل — بعد انتهاء المهلة لن تتمكن من تعديل الموضوع
          </span>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">عنوان الموضوع <span className="text-red-500">*</span></label>
            <Input placeholder="عنوان الموضوع..." value={title} onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base rounded-xl border-border focus:border-primary" data-testid="input-post-title" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">القسم <span className="text-red-500">*</span></label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 rounded-xl border-border focus:border-primary" data-testid="select-category">
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                {(categories as any[]).map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80">المحتوى <span className="text-red-500">*</span></label>
            {initialized && <CommunityEditor content={content} onChange={setContent} />}
          </div>

          <div className="flex gap-4 justify-end pt-2">
            <Button variant="outline" onClick={() => setLocation(`/community/post/${id}`)} className="h-12 px-8 rounded-xl font-bold">
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}
              className="h-12 px-8 rounded-xl font-bold gap-2 flex-row-reverse shadow-lg shadow-primary/20" data-testid="button-save-bottom">
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
