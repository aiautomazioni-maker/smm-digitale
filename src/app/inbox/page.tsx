"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send, Image as ImageIcon, Smile, MoreVertical, MessageCircle, User, FileText, CheckCheck, X, ChevronLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const COMMON_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂", "😢", "😡", "👍", "✨", "🚀", "💯", "🙏", "✅", "📍", "👋", "💬", "🎁"];

export default function InboxPage() {
    const { t } = useTranslation();
    const [chats, setChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<{ url: string, type: string, name: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEmojiClick = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleMediaClick = () => {
        console.log("[INBOX] Media icon clicked, triggering file input...");
        if (!fileInputRef.current) {
            console.error("[INBOX] fileInputRef.current is NULL!");
        }
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log("[INBOX] File selected:", file?.name);
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/instagram/upload-media', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setPendingMedia({
                    url: data.url,
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    name: file.name
                });
                toast.success("Media caricato con successo");
            } else {
                toast.error("Errore caricamento: " + data.error);
            }
        } catch (err) {
            toast.error("Errore di rete durante il caricamento.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Fetch real Instagram DMs on load
    useEffect(() => {
        async function loadInbox() {
            try {
                const res = await fetch('/api/instagram/inbox');
                const data = await res.json();
                if (data.success && data.chats) {
                    setChats(data.chats);
                    if (data.chats.length > 0) {
                        setActiveChatId(data.chats[0].id);
                    }
                } else if (data.error) {
                    toast.error("Errore nel caricamento messaggi: " + data.error);
                }
            } catch (err) {
                console.error("Failed to fetch inbox", err);
                toast.error("Errore di connessione a Instagram.");
            } finally {
                setIsLoading(false);
            }
        }
        loadInbox();
    }, []);

    // Mobile View State
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Stato per la modale delle note
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState("");

    const activeChat = chats.find(c => c.id === activeChatId);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !pendingMedia) || !activeChat || isSending) return;

        const messageText = newMessage;
        const media = pendingMedia;

        setNewMessage("");
        setPendingMedia(null);

        // Optimistically add message to UI
        const optimisticId = Date.now();
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const newMsg = {
                    id: optimisticId,
                    text: media ? `[Media: ${media.name}] ${messageText}` : messageText,
                    sender: "me",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                return {
                    ...chat,
                    messages: [...chat.messages, newMsg],
                    lastMessage: newMsg.text,
                    time: "Ora"
                };
            }
            return chat;
        }));

        setIsSending(true);
        try {
            const recipientId = activeChat.recipientId || activeChat.user.id;
            const res = await fetch('/api/instagram/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId,
                    message: messageText,
                    mediaUrl: media?.url,
                    mediaType: media?.type
                })
            });
            const data = await res.json();
            if (!data.success) {
                toast.error("Errore nell'invio: " + (data.error || 'Errore sconosciuto'));
                setChats(prev => prev.map(chat => ({
                    ...chat,
                    messages: chat.messages.filter((m: any) => m.id !== optimisticId)
                })));
            }
        } catch (err) {
            toast.error("Errore di rete nell'invio del messaggio.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectChat = (id: string) => {
        setActiveChatId(id);
        setShowMobileChat(true);
        // Segna come letto solo se apriamo la chat e ha focus
        setChats(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
    };

    const handleMarkAsUnread = () => {
        if (!activeChatId) return;
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unread: true } : c));
        toast.success("Chat segnata come non letta");
    };

    const handleSaveNote = () => {
        setIsNoteModalOpen(false);
        setCurrentNote("");
        toast.success("Nota salvata per questo utente");
    };

    const handleViewProfile = () => {
        toast.info(`Apertura profilo di ${activeChat?.user.name} su ${activeChat?.user.platform === 'instagram' ? 'Instagram' : 'Facebook'}...`);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex overflow-hidden bg-black/40 border border-white/10 rounded-xl backdrop-blur-xl">
            {/* INBOX LIST (Left Column) */}
            <div className={`w-full md:w-80 border-r border-white/10 flex flex-col bg-black/20 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold mb-4">{t("nav.inbox")}</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Cerca messaggi..." className="pl-9 bg-white/5 border-white/10" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                            <p className="text-sm">Caricamento messaggi...</p>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="flex flex-col items-center text-center justify-center h-full p-8 text-muted-foreground">
                            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">La cartella è vuota.</p>
                            <p className="text-xs mt-1">Non ci sono nuovi messaggi al momento.</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat.id)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 flex gap-3
                                    ${activeChatId === chat.id ? "bg-white/10" : ""}
                                    ${chat.unread ? "bg-white/[0.02]" : ""}
                                `}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 border border-white/10">
                                        <AvatarImage src={chat.user.avatar} />
                                        <AvatarFallback>{chat.user.name[0]?.toUpperCase() || "U"}</AvatarFallback>
                                    </Avatar>
                                    {chat.user.platform === 'instagram' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 border border-black flex items-center justify-center text-[8px] text-white">IG</div>}
                                    {chat.user.platform === 'facebook' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border border-black flex items-center justify-center text-[8px] text-white">f</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`truncate text-sm ${chat.unread ? "font-bold text-white" : "font-medium text-foreground"}`}>{chat.user.name}</h3>
                                        <span className={`text-xs ${chat.unread ? "text-blue-400 font-bold" : "text-muted-foreground"}`}>{chat.time}</span>
                                    </div>
                                    <p className={`truncate text-xs ${chat.unread ? "font-semibold text-white" : "text-muted-foreground"}`}>{chat.lastMessage}</p>
                                </div>
                                {chat.unread && <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ACTIVE CHAT (Right Column) */}
            <div className={`${showMobileChat ? "flex" : "hidden md:flex"} flex-col flex-1 bg-black/10 relative`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2 h-8 w-8"
                                    onClick={() => setShowMobileChat(false)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={activeChat.user.avatar} />
                                    <AvatarFallback>{activeChat.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-sm">{activeChat.user.name}</h3>
                                    <p className="text-xs text-muted-foreground">{activeChat.user.handle}</p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/10">
                                    <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
                                        <User className="w-4 h-4 mr-2" /> Vedi profilo social
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleMarkAsUnread} className="cursor-pointer">
                                        <CheckCheck className="w-4 h-4 mr-2" /> Segna come non letto
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem onClick={() => setIsNoteModalOpen(true)} className="cursor-pointer text-blue-400 focus:text-blue-300">
                                        <FileText className="w-4 h-4 mr-2" /> Aggiungi Nota Cliente
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeChat.messages.map((msg: any, idx: number) => {
                                const isMe = msg.sender === "me";
                                return (
                                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                            ? "bg-blue-600 text-white rounded-tr-sm"
                                            : "bg-white/10 text-white rounded-tl-sm border border-white/5"
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Message Composer */}
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                            {/* Media Preview */}
                            {pendingMedia && (
                                <div className="mb-3 p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                                            {pendingMedia.type === 'video' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{pendingMedia.name}</p>
                                            <p className="text-[10px] text-blue-300">Pronto per essere inviato</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-blue-500/30"
                                        onClick={() => setPendingMedia(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div className="mb-3 p-3 bg-zinc-900 border border-white/10 rounded-2xl grid grid-cols-10 gap-1 animate-in zoom-in-95 duration-200 origin-bottom-left shadow-2xl">
                                    {COMMON_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="text-xl hover:scale-125 transition-transform leading-none p-1 rounded hover:bg-white/10"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelected}
                            />
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-3xl p-2 px-4 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                                <div className="flex gap-2 pb-1 text-muted-foreground shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log("[INBOX] Smile clicked");
                                            setShowEmojiPicker(prev => !prev);
                                        }}
                                        className={`transition-colors ${showEmojiPicker ? 'text-blue-400' : 'hover:text-white'}`}
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleMediaClick}
                                            className={`transition-colors ${pendingMedia ? 'text-blue-400' : 'hover:text-white'}`}
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={pendingMedia ? "Aggiungi una didascalia..." : "Scrivi un messaggio..."}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8"
                                />
                                <Button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !pendingMedia) || isSending || isUploading}
                                    size="icon"
                                    className={`h-8 w-8 rounded-full shrink-0 transition-all ${((newMessage.trim() || pendingMedia) && !isSending && !isUploading)
                                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                                        : "bg-white/10 text-white/40"
                                        }`}
                                >
                                    {isSending
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4 ml-0.5" />
                                    }
                                </Button>
                            </form>
                            <p className="text-[10px] text-center text-muted-foreground mt-2">I messaggi verranno inviati come {activeChat.user.platform === 'instagram' ? '@automazioniai' : 'Automazioni AI Official'}</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p>Seleziona una chat per inviare un messaggio</p>
                    </div>
                )}
            </div>

            {/* Modal per prendere note */}
            <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-black border-white/10">
                    <DialogHeader>
                        <DialogTitle>Nota Cliente</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Aggiungi una nota interna per {activeChat?.user.name}. Solo tu e il tuo team potrete vederla.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Es. Cliente VIP, preferisce orari mattutini..."
                            className="bg-white/5 border-white/10 min-h-[120px] resize-none"
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)}>Annulla</Button>
                        <Button onClick={handleSaveNote} className="bg-blue-600 hover:bg-blue-500 text-white">Salva Nota</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
