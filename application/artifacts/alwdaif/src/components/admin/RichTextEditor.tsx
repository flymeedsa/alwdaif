import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Palette,
  Type,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from "@/components/theme-provider";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const colorOptions = [
  '#000000', '#374151', '#DC2626', '#EA580C', '#D97706', 
  '#65A30D', '#16A34A', '#0891B2', '#2563EB', '#7C3AED', '#DB2777'
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 27];

const arabicFonts = [
  { name: 'Cairo', label: 'القاهرة' },
  { name: 'Tajawal', label: 'تجول' },
  { name: 'Almarai', label: 'المراعي' },
  { name: 'Amiri', label: 'أميري' },
  { name: 'Changa', label: 'شانجا' },
  { name: 'El Messiri', label: 'المسيري' },
  { name: 'Lateef', label: 'لطيف' },
  { name: 'Scheherazade New', label: 'شهرزاد' },
];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    fontFamily: {
      setFontFamily: (family: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontFamily) return {};
            return { style: `font-family: ${attributes.fontFamily}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontFamily }).run();
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const { theme } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowFontSizePicker(false);
        setShowFontFamilyPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'اكتب المحتوى هنا...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[300px] p-4 focus:outline-none dark:prose-invert',
        dir: 'rtl',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('أدخل رابط URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('أدخل رابط الصورة:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const setFontSize = (size: number) => {
    editor.chain().focus().setFontSize(`${size}px`).run();
    setShowFontSizePicker(false);
  };

  const setFontFamily = (family: string) => {
    editor.chain().focus().setFontFamily(family).run();
    setShowFontFamilyPicker(false);
  };

  const ToolButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted",
        isActive && "bg-primary/10 text-primary"
      )}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div ref={toolbarRef} className="border-b border-border p-2 flex flex-wrap gap-1 bg-muted/50">
        <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-2">
          <ToolButton onClick={() => editor.chain().focus().undo().run()} title="تراجع">
            <Undo className="h-4 w-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().redo().run()} title="إعادة">
            <Redo className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowFontFamilyPicker(!showFontFamilyPicker); setShowFontSizePicker(false); setShowColorPicker(false); }}
              className="h-8 px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded text-sm"
              title="نوع الخط"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {showFontFamilyPicker && (
              <div className="absolute top-full right-0 mt-1 p-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
                {arabicFonts.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setFontFamily(font.name)}
                    className="w-full px-3 py-1.5 text-right text-muted-foreground hover:bg-muted rounded text-sm"
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowFontSizePicker(!showFontSizePicker); setShowFontFamilyPicker(false); setShowColorPicker(false); }}
              className="h-8 px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded text-sm min-w-[50px] justify-center"
              title="حجم الخط"
            >
              <span>16</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showFontSizePicker && (
              <div className="absolute top-full right-0 mt-1 p-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[60px]">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className="w-full px-3 py-1 text-center text-muted-foreground hover:bg-muted rounded text-sm"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })}
            title="عنوان رئيسي"
          >
            <Heading1 className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })}
            title="عنوان فرعي"
          >
            <Heading2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
            isActive={editor.isActive('heading', { level: 3 })}
            title="عنوان ثالث"
          >
            <Heading3 className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')}
            title="عريض"
          >
            <Bold className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')}
            title="مائل"
          >
            <Italic className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            isActive={editor.isActive('underline')}
            title="تحته خط"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            isActive={editor.isActive('strike')}
            title="يتوسطه خط"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolButton>
          <div className="relative">
            <ToolButton 
              onClick={() => { setShowColorPicker(!showColorPicker); setShowFontSizePicker(false); setShowFontFamilyPicker(false); }} 
              title="لون النص"
            >
              <Palette className="h-4 w-4" />
            </ToolButton>
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-50 flex gap-1 flex-wrap w-32">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColor(color)}
                    className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            isActive={editor.isActive({ textAlign: 'right' })}
            title="محاذاة لليمين"
          >
            <AlignRight className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            isActive={editor.isActive({ textAlign: 'center' })}
            title="توسيط"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            isActive={editor.isActive({ textAlign: 'left' })}
            title="محاذاة لليسار"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="ضبط"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')}
            title="قائمة نقطية"
          >
            <List className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')}
            title="قائمة مرقمة"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-2">
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            isActive={editor.isActive('blockquote')}
            title="اقتباس"
          >
            <Quote className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
            isActive={editor.isActive('codeBlock')}
            title="كود"
          >
            <Code className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setHorizontalRule().run()} 
            title="خط فاصل"
          >
            <Minus className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolButton onClick={addLink} isActive={editor.isActive('link')} title="رابط">
            <LinkIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton onClick={addImage} title="صورة">
            <ImageIcon className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>

      <EditorContent editor={editor} className="text-foreground" />

      <style>{`
        .ProseMirror {
          min-height: 300px;
          padding: 1rem;
          direction: rtl;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground) / 0.5);
          content: attr(data-placeholder);
          float: right;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        .ProseMirror ul { list-style: disc; padding-right: 1.5em; margin: 0.5em 0; }
        .ProseMirror ol { list-style: decimal; padding-right: 1.5em; margin: 0.5em 0; }
        .ProseMirror blockquote {
          border-right: 3px solid hsl(var(--primary));
          padding-right: 1em;
          margin: 0.5em 0;
          color: hsl(var(--muted-foreground));
        }
        .ProseMirror pre {
          background: hsl(var(--muted));
          padding: 1em;
          border-radius: 0.5em;
          direction: ltr;
          text-align: left;
          font-family: monospace;
        }
        .ProseMirror hr { border-color: hsl(var(--border)); margin: 1em 0; }
        .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5em; margin: 0.5em 0; }
      `}</style>
    </div>
  );
}
