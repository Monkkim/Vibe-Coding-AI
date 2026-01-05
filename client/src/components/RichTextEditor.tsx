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
  CheckSquare
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
  icon: typeof Type;
  tag: string;
  isList?: boolean;
  ordered?: boolean;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: "text", label: "텍스트", icon: Type, tag: "p" },
  { id: "h1", label: "제목 1", icon: Heading1, tag: "h1" },
  { id: "h2", label: "제목 2", icon: Heading2, tag: "h2" },
  { id: "h3", label: "제목 3", icon: Heading3, tag: "h3" },
  { id: "bullet", label: "글머리 기호 목록", icon: List, tag: "ul", isList: true, ordered: false },
  { id: "numbered", label: "번호 매기기 목록", icon: ListOrdered, tag: "ol", isList: true, ordered: true },
  { id: "todo", label: "할 일 목록", icon: CheckSquare, tag: "ul", isList: true, ordered: false },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "'/'를 입력하여 블록 유형을 선택하세요",
  className = "",
  minHeight = "300px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isInitialized = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
  const lastEmptyListEnter = useRef(false);
  const savedSelection = useRef<Range | null>(null);
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

  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.label.includes(slashFilter) || cmd.id.includes(slashFilter.toLowerCase())
  );

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

  useEffect(() => {
    setSelectedIndex(0);
  }, [slashFilter, showSlashMenu]);

  useEffect(() => {
    if (showSlashMenu && menuItemRefs.current[selectedIndex]) {
      menuItemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex, showSlashMenu]);

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

  const getCaretCoords = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return null;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom - editorRect.top + 4,
      left: Math.max(0, rect.left - editorRect.left),
    };
  }, []);

  const getCurrentBlock = useCallback((): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (["p", "h1", "h2", "h3", "li", "blockquote"].includes(tag)) {
          return el;
        }
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  const isInList = useCallback((): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === "ul" || tag === "ol") return true;
      }
      node = node.parentNode;
    }
    return false;
  }, []);

  const isInHeading = useCallback((): string | null => {
    const block = getCurrentBlock();
    if (!block) return null;
    const tag = block.tagName.toLowerCase();
    if (["h1", "h2", "h3"].includes(tag)) return tag;
    return null;
  }, [getCurrentBlock]);

  const deleteSlashCommand = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    
    const text = node.textContent || "";
    const pos = range.startOffset;
    const slashIdx = text.lastIndexOf("/", pos - 1);
    if (slashIdx === -1) return;

    const delRange = document.createRange();
    delRange.setStart(node, slashIdx);
    delRange.setEnd(node, pos);
    delRange.deleteContents();
  }, []);

  const insertParagraphAfter = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    
    const currentBlock = getCurrentBlock();
    if (!currentBlock) return;

    const p = document.createElement("p");
    p.innerHTML = "<br>";
    
    if (currentBlock.parentNode) {
      currentBlock.parentNode.insertBefore(p, currentBlock.nextSibling);
    }
    
    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    
    syncContent();
  }, [getCurrentBlock, syncContent]);

  const exitListAndInsertParagraph = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    
    let node: Node | null = sel.anchorNode;
    let listItem: HTMLElement | null = null;
    let list: HTMLElement | null = null;
    
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === "li") listItem = node as HTMLElement;
        if (tag === "ul" || tag === "ol") {
          list = node as HTMLElement;
          break;
        }
      }
      node = node.parentNode;
    }
    
    if (list && listItem) {
      listItem.remove();
      
      if (list.children.length === 0) {
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        list.parentNode?.insertBefore(p, list.nextSibling);
        list.remove();
        
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        list.parentNode?.insertBefore(p, list.nextSibling);
        
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    
    syncContent();
  }, [syncContent]);

  const applyBlockFormat = useCallback((cmd: SlashCommand) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    
    editorRef.current?.focus();
    
    if (savedSelection.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelection.current);
      }
    }
    
    deleteSlashCommand();
    
    setTimeout(() => {
      if (cmd.isList) {
        document.execCommand(cmd.ordered ? "insertOrderedList" : "insertUnorderedList", false);
      } else {
        document.execCommand("formatBlock", false, cmd.tag);
      }
      syncContent();
    }, 0);
  }, [deleteSlashCommand, syncContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (filteredCommands.length > 0) {
            setSelectedIndex(i => (i + 1) % filteredCommands.length);
          }
          return;
        case "ArrowUp":
          e.preventDefault();
          if (filteredCommands.length > 0) {
            setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
          }
          return;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            applyBlockFormat(filteredCommands[selectedIndex]);
          }
          return;
        case "Escape":
          e.preventDefault();
          setShowSlashMenu(false);
          setSlashFilter("");
          return;
        case "Backspace":
          if (!slashFilter) {
            setShowSlashMenu(false);
          } else {
            setSlashFilter(f => f.slice(0, -1));
          }
          return;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setSlashFilter(f => f + e.key);
            e.preventDefault();
          }
          return;
      }
    }

    if (e.key === "Enter") {
      const headingType = isInHeading();
      const inList = isInList();
      
      if (headingType && !e.shiftKey) {
        e.preventDefault();
        insertParagraphAfter();
        return;
      }
      
      if (inList && !e.shiftKey) {
        const currentBlock = getCurrentBlock();
        const blockText = currentBlock?.textContent?.trim() || "";
        
        if (blockText === "") {
          if (lastEmptyListEnter.current) {
            e.preventDefault();
            lastEmptyListEnter.current = false;
            exitListAndInsertParagraph();
            return;
          } else {
            lastEmptyListEnter.current = true;
          }
        } else {
          lastEmptyListEnter.current = false;
        }
      }
    } else {
      lastEmptyListEnter.current = false;
    }
  }, [showSlashMenu, filteredCommands, selectedIndex, applyBlockFormat, slashFilter, isInHeading, isInList, getCurrentBlock, insertParagraphAfter, exitListAndInsertParagraph]);

  const handleInput = useCallback(() => {
    syncContent();
    
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const pos = range.startOffset;
      if (pos > 0 && text[pos - 1] === "/") {
        const coords = getCaretCoords();
        if (coords) {
          savedSelection.current = range.cloneRange();
          setSlashMenuPosition(coords);
          setShowSlashMenu(true);
          setSlashFilter("");
        }
      }
    }
  }, [syncContent, getCaretCoords]);

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
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
          data-testid="editor-content"
        />

        <AnimatePresence>
          {showSlashMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[220px] max-h-[300px] overflow-auto"
              style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
            >
              <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-b">블록 유형 선택</div>
              {filteredCommands.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">결과 없음</div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    ref={(el) => { menuItemRefs.current[idx] = el; }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      idx === selectedIndex ? "bg-accent" : "hover:bg-muted/50"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyBlockFormat(cmd);
                    }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded bg-muted/50">
                      <cmd.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium">{cmd.label}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        [data-testid="editor-content"] { line-height: 1.7; }
        [data-testid="editor-content"] p { margin: 0 0 0.5em 0; min-height: 1.5em; }
        [data-testid="editor-content"] h1 { font-size: 2em; font-weight: 700; margin: 0.75em 0 0.25em; min-height: 1.2em; }
        [data-testid="editor-content"] h2 { font-size: 1.5em; font-weight: 600; margin: 0.6em 0 0.2em; min-height: 1.2em; }
        [data-testid="editor-content"] h3 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0 0.15em; min-height: 1.2em; }
        [data-testid="editor-content"] blockquote {
          border-left: 3px solid hsl(var(--muted-foreground));
          padding-left: 1em;
          margin: 0.5em 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        [data-testid="editor-content"] ul, [data-testid="editor-content"] ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        [data-testid="editor-content"] li { margin: 0.25em 0; min-height: 1.5em; }
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
