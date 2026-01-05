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
  Loader2,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface SlashCommand {
  id: string;
  label: string;
  shortcut: string;
  icon: typeof Type;
  action: () => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요... ('/'를 입력하여 블록 선택)",
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
  const [imageStartWidth, setImageStartWidth] = useState(0);
  const [resizeStartX, setResizeStartX] = useState(0);
  const lastEnterTime = useRef<number>(0);
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

  const slashCommands: SlashCommand[] = [
    { id: "text", label: "텍스트", shortcut: "", icon: Type, action: () => removeSlashTextAndFormat("p") },
    { id: "h1", label: "제목1", shortcut: "#", icon: Heading1, action: () => removeSlashTextAndFormat("h1") },
    { id: "h2", label: "제목2", shortcut: "##", icon: Heading2, action: () => removeSlashTextAndFormat("h2") },
    { id: "h3", label: "제목3", shortcut: "###", icon: Heading3, action: () => removeSlashTextAndFormat("h3") },
    { id: "bullet", label: "글머리 기호 목록", shortcut: "-", icon: List, action: () => removeSlashTextAndInsertList(false) },
    { id: "numbered", label: "번호 매기기 목록", shortcut: "1.", icon: ListOrdered, action: () => removeSlashTextAndInsertList(true) },
    { id: "quote", label: "인용", shortcut: ">", icon: Quote, action: () => removeSlashTextAndFormat("blockquote") },
  ];

  const filteredCommands = slashCommands.filter((cmd: SlashCommand) => 
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.id.toLowerCase().includes(slashFilter.toLowerCase())
  );

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || "<p><br></p>";
      isInitialized.current = true;
      setIsEmpty(!value || value === "<br>" || value.trim() === "" || value === "<p><br></p>");
    }
  }, [value]);

  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [slashFilter]);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || "";
      setIsEmpty(!textContent.trim() && !content.includes("<img"));
      onChange(content);
    }
  }, [onChange]);

  const getCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    
    if (!editorRect) return null;
    
    return {
      top: rect.top - editorRect.top + rect.height + 8,
      left: rect.left - editorRect.left,
    };
  }, []);

  const removeSlashTextAndFormat = useCallback((tag: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || "";
      const cursorPos = range.startOffset;
      const slashIndex = text.lastIndexOf("/", cursorPos - 1);
      
      if (slashIndex !== -1) {
        const deleteRange = document.createRange();
        deleteRange.setStart(textNode, slashIndex);
        deleteRange.setEnd(textNode, cursorPos);
        deleteRange.deleteContents();
      }
    }
    
    document.execCommand("formatBlock", false, tag);
    
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (sel && editorRef.current) {
        const focusNode = sel.focusNode;
        if (focusNode) {
          const newRange = document.createRange();
          if (focusNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(focusNode, sel.focusOffset);
          } else if (focusNode.firstChild) {
            newRange.setStart(focusNode.firstChild, 0);
          } else {
            newRange.setStart(focusNode, 0);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
      updateContent();
    });
  }, [updateContent]);

  const removeSlashTextAndInsertList = useCallback((ordered: boolean) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || "";
      const cursorPos = range.startOffset;
      const slashIndex = text.lastIndexOf("/", cursorPos - 1);
      
      if (slashIndex !== -1) {
        const deleteRange = document.createRange();
        deleteRange.setStart(textNode, slashIndex);
        deleteRange.setEnd(textNode, cursorPos);
        deleteRange.deleteContents();
      }
    }
    
    document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
    updateContent();
  }, [updateContent]);

  const executeCommand = useCallback((command: SlashCommand) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    editorRef.current?.focus();
    command.action();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedCommandIndex]) {
          executeCommand(filteredCommands[selectedCommandIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashFilter("");
      } else if (e.key === "Backspace") {
        if (slashFilter.length === 0) {
          setShowSlashMenu(false);
        } else {
          setSlashFilter(prev => prev.slice(0, -1));
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setSlashFilter(prev => prev + e.key);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      const now = Date.now();
      const timeSinceLastEnter = now - lastEnterTime.current;
      lastEnterTime.current = now;

      if (timeSinceLastEnter < 500) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "p");
        updateContent();
        return;
      }
    }
  }, [showSlashMenu, filteredCommands, selectedCommandIndex, executeCommand, slashFilter, updateContent]);

  const handleInput = useCallback((e: React.FormEvent) => {
    updateContent();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || "";
      const cursorPos = range.startOffset;
      
      if (cursorPos > 0 && text[cursorPos - 1] === "/") {
        const pos = getCaretPosition();
        if (pos) {
          setSlashMenuPosition(pos);
          setShowSlashMenu(true);
          setSlashFilter("");
          setSelectedCommandIndex(0);
        }
      }
    }
  }, [updateContent, getCaretPosition]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateContent();
  }, [updateContent]);

  const insertImage = useCallback((src: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "100%";
    img.style.width = "400px";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.margin = "8px 0";
    img.style.cursor = "pointer";
    img.setAttribute("data-resizable", "true");
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.appendChild(img);
    }
    
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

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && target.getAttribute("data-resizable")) {
      setResizingImage(target as HTMLImageElement);
    } else {
      setResizingImage(null);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (resizingImage && (e.target as HTMLElement).classList.contains("resize-handle")) {
      e.preventDefault();
      setImageStartWidth(resizingImage.offsetWidth);
      setResizeStartX(e.clientX);
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - resizeStartX;
        const newWidth = Math.max(100, imageStartWidth + deltaX);
        resizingImage.style.width = `${newWidth}px`;
      };
      
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        updateContent();
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  }, [resizingImage, imageStartWidth, resizeStartX, updateContent]);

  const handleImageResize = useCallback((direction: "smaller" | "larger") => {
    if (!resizingImage) return;
    const currentWidth = resizingImage.offsetWidth;
    const newWidth = direction === "smaller" 
      ? Math.max(100, currentWidth - 50)
      : Math.min(800, currentWidth + 50);
    resizingImage.style.width = `${newWidth}px`;
    updateContent();
  }, [resizingImage, updateContent]);

  return (
    <div className={`border rounded-xl overflow-hidden bg-white/50 dark:bg-black/20 ${className}`}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
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

        {resizingImage && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground px-2">이미지 크기:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImageResize("smaller")}
                data-testid="button-image-smaller"
              >
                -
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImageResize("larger")}
                data-testid="button-image-larger"
              >
                +
              </Button>
            </div>
          </>
        )}
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
          className="p-4 outline-none"
          style={{ minHeight }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleEditorClick}
          onMouseDown={handleMouseDown}
          data-testid="editor-content"
        />

        <AnimatePresence>
          {showSlashMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 bg-popover border rounded-lg shadow-lg py-2 min-w-[220px]"
              style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
              data-testid="slash-menu"
            >
              <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                블록 유형
              </div>
              {filteredCommands.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  일치하는 명령이 없습니다
                </div>
              ) : (
                filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover-elevate ${
                      index === selectedCommandIndex ? "bg-accent" : ""
                    }`}
                    onClick={() => executeCommand(cmd)}
                    data-testid={`slash-cmd-${cmd.id}`}
                  >
                    <cmd.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                    )}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        [data-testid="editor-content"] {
          line-height: 1.6;
        }
        [data-testid="editor-content"] p {
          margin: 0;
          min-height: 1.6em;
        }
        [data-testid="editor-content"] h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0.5em 0 0.25em 0;
        }
        [data-testid="editor-content"] h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.5em 0 0.25em 0;
        }
        [data-testid="editor-content"] h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.5em 0 0.25em 0;
        }
        [data-testid="editor-content"] blockquote {
          border-left: 3px solid hsl(var(--muted-foreground));
          padding-left: 1em;
          margin: 0.5em 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        [data-testid="editor-content"] ul,
        [data-testid="editor-content"] ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        [data-testid="editor-content"] li {
          margin: 0.25em 0;
        }
        [data-testid="editor-content"] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
          cursor: pointer;
        }
        [data-testid="editor-content"] img[data-resizable]:hover {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
