import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { 
  Bold, 
  Italic, 
  Underline, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  className = "",
  minHeight = "300px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
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
      if (value) {
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = "<p><br></p>";
      }
      isInitialized.current = true;
      checkEmpty();
    }
  }, [value]);

  const checkEmpty = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || "";
      const hasImages = editorRef.current.querySelector("img") !== null;
      setIsEmpty(!text.trim() && !hasImages);
    }
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkEmpty();
    }
  }, [onChange, checkEmpty]);

  const handleInput = useCallback(() => {
    syncContent();
  }, [syncContent]);

  const execCommand = useCallback((cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    syncContent();
  }, [syncContent]);

  const insertImage = useCallback((src: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "100%";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.margin = "12px 0";
    img.setAttribute("data-resizable", "true");
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.appendChild(img);
    }
    syncContent();
  }, [syncContent]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await uploadFile(file);
        return;
      }
    }
  }, [uploadFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && target.getAttribute("data-resizable")) {
      setResizingImage(target as HTMLImageElement);
    } else {
      setResizingImage(null);
    }
  }, []);

  const resizeImage = useCallback((delta: number) => {
    if (!resizingImage) return;
    const current = resizingImage.offsetWidth;
    const newWidth = Math.max(100, Math.min(800, current + delta));
    resizingImage.style.width = `${newWidth}px`;
    syncContent();
  }, [resizingImage, syncContent]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-1 p-3 border-b bg-muted/20 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => execCommand("bold")} data-testid="button-bold">
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => execCommand("italic")} data-testid="button-italic">
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => execCommand("underline")} data-testid="button-underline">
          <Underline className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-insert-image"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await uploadFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="hidden"
        />
        {resizingImage && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <span className="text-xs text-muted-foreground px-1">이미지:</span>
            <Button variant="outline" size="sm" onClick={() => resizeImage(-50)}>-</Button>
            <Button variant="outline" size="sm" onClick={() => resizeImage(50)}>+</Button>
          </>
        )}
      </div>

      <div className="relative flex-1 overflow-auto">
        {isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className="p-4 outline-none h-full"
          style={{ minHeight }}
          onInput={handleInput}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
          data-testid="editor-content"
        />
      </div>

      <style>{`
        [data-testid="editor-content"] { line-height: 1.7; }
        [data-testid="editor-content"] p { margin: 0 0 0.5em 0; min-height: 1.5em; }
        [data-testid="editor-content"] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
          cursor: pointer;
        }
        [data-testid="editor-content"] img[data-resizable]:hover,
        [data-testid="editor-content"] img[data-resizable]:focus {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
