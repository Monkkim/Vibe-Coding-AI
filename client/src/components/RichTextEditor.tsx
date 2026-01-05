import { useState, useRef, useCallback, useEffect } from "react";
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
  { label: "작게", value: "1", displaySize: "12px" },
  { label: "보통", value: "3", displaySize: "16px" },
  { label: "크게", value: "5", displaySize: "20px" },
  { label: "매우 크게", value: "6", displaySize: "24px" },
  { label: "제목", value: "7", displaySize: "32px" },
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
  const isInitialized = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);
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

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
      setIsEmpty(!value || value === "<br>" || value.trim() === "");
    }
  }, [value]);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || "";
      setIsEmpty(!textContent.trim() && !content.includes("<img"));
      onChange(content);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateContent();
  }, [updateContent]);

  const handleFontSize = useCallback((sizeValue: string) => {
    editorRef.current?.focus();
    document.execCommand("fontSize", false, sizeValue);
    updateContent();
  }, [updateContent]);

  const insertImage = useCallback((src: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand("insertImage", false, src);
    updateContent();
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
              <span className="text-xs">크기</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {FONT_SIZES.map((size) => (
              <DropdownMenuItem
                key={size.value}
                onClick={() => handleFontSize(size.value)}
                style={{ fontSize: size.displaySize }}
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

      <div className="relative">
        {isEmpty && (
          <div 
            className="absolute top-4 left-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className="p-4 outline-none min-h-[150px]"
          style={{ minHeight }}
          onInput={updateContent}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-testid="editor-content"
        />
      </div>

      <style>{`
        [data-testid="editor-content"] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
        [data-testid="editor-content"] font[size="1"] { font-size: 12px; }
        [data-testid="editor-content"] font[size="3"] { font-size: 16px; }
        [data-testid="editor-content"] font[size="5"] { font-size: 20px; }
        [data-testid="editor-content"] font[size="6"] { font-size: 24px; }
        [data-testid="editor-content"] font[size="7"] { font-size: 32px; }
      `}</style>
    </div>
  );
}
