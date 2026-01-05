import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Image as ImageIcon,
  Type,
  ChevronDown,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const FONT_SIZES = [
  { label: "작게", value: "12px", class: "text-xs" },
  { label: "보통", value: "14px", class: "text-sm" },
  { label: "중간", value: "16px", class: "text-base" },
  { label: "크게", value: "18px", class: "text-lg" },
  { label: "매우 크게", value: "24px", class: "text-2xl" },
  { label: "제목", value: "32px", class: "text-3xl" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState("16px");
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      insertImage(response.objectPath);
    },
    onError: (error) => {
      toast({
        title: "이미지 업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  }, []);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFontSize = useCallback((size: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement("span");
        span.style.fontSize = size;
        range.surroundContents(span);
        updateContent();
      }
    }
    setCurrentFontSize(size);
  }, [updateContent]);

  const insertImage = useCallback((src: string) => {
    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.margin = "8px 0";
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (editorRef.current) {
      editorRef.current.appendChild(img);
    }
    
    updateContent();
    editorRef.current?.focus();
  }, [updateContent]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        return;
      }
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const currentSizeLabel = FONT_SIZES.find(s => s.value === currentFontSize)?.label || "보통";

  return (
    <div className={`border rounded-xl overflow-hidden bg-white/50 dark:bg-black/20 ${className}`}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 px-2"
              data-testid="button-font-size"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">{currentSizeLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {FONT_SIZES.map((size) => (
              <DropdownMenuItem
                key={size.value}
                onClick={() => handleFontSize(size.value)}
                className={size.class}
                data-testid={`menu-font-size-${size.value}`}
              >
                {size.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => execCommand("bold")}
          data-testid="button-bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => execCommand("italic")}
          data-testid="button-italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => execCommand("underline")}
          data-testid="button-underline"
        >
          <Underline className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => execCommand("insertUnorderedList")}
          data-testid="button-bullet-list"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => execCommand("insertOrderedList")}
          data-testid="button-numbered-list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-insert-image"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-image-file"
        />
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="p-4 outline-none prose prose-sm dark:prose-invert max-w-none"
        style={{ minHeight }}
        onInput={updateContent}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        data-testid="editor-content"
      />

      <style>{`
        [data-testid="editor-content"]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [data-testid="editor-content"] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
