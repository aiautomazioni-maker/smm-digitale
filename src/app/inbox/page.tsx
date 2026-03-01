"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send, Image as ImageIcon, Smile, MoreVertical, MessageCircle, User, FileText, CheckCheck, X, ChevronLeft } from "lucide-react";
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

// Dati Mockati per le Chat
const MOCK_CHATS = [
    {
        id: "chat-1",
        user: { name: "Marco Rossi", handle: "@marcorossi", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d", platform: "instagram" },
        lastMessage: "Potete integrare ChatGPT nel mio CRM?",
        time: "10:42",
        unread: true,
        messages: [
            { id: 1, text: "Ciao! Ho visto il vostro ultimo video sulle automazioni CRM.", sender: "user", time: "10:40" },
            { id: 2, text: "Potete integrare ChatGPT nel mio CRM Salesforce?", sender: "user", time: "10:42" }
        ]
    },
    {
        id: "chat-2",
        user: { name: "Giulia Bianchi", handle: "Giulia Bianchi", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", platform: "facebook" },
        lastMessage: "Grazie mille per le informazioni!",
        time: "Ieri",
        unread: false,
        messages: [
            { id: 1, text: "Salve, create anche chatbot per la gestione appuntamenti?", sender: "user", time: "Ieri 15:30" },
            { id: 2, text: "Certamente! Abbiamo sistemi AI che si collegano direttamente a Google Calendar o Calendly.", sender: "me", time: "Ieri 16:00" },
            { id: 3, text: "Grazie mille per le informazioni!", sender: "user", time: "Ieri 16:05" }
        ]
    },
    {
        id: "chat-3",
        user: { name: "Tech Advisor Italy", handle: "@techadvisor_it", avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d", platform: "instagram" },
        lastMessage: "Sarebbe fantastico collaborare sulle nuove soluzioni AI per PMI.",
        time: "Lun",
        unread: false,
        messages: [
            { id: 1, text: "Complimenti per i vostri contenuti! Sarebbe fantastico collaborare sulle nuove soluzioni AI per PMI.", sender: "user", time: "Lun 09:15" }
        ]
    }
];

export default function InboxPage() {
    const { t } = useTranslation();
    const [chats, setChats] = useState(MOCK_CHATS);
    const [activeChatId, setActiveChatId] = useState(MOCK_CHATS[0].id);
    const [newMessage, setNewMessage] = useState("");

    // Mobile View State
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Stato per la modale delle note
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState("");

    const activeChat = chats.find(c => c.id === activeChatId);

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const updatedChats = chats.map(chat => {
            if (chat.id === activeChatId) {
                return {
                    ...chat,
                    messages: [
                        ...chat.messages,
                        { id: Date.now(), text: newMessage, sender: "me", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                    ],
                    lastMessage: newMessage,
                    time: "Ora"
                };
            }
            return chat;
        });

        setChats(updatedChats);
        setNewMessage("");
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
                    {chats.map(chat => (
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
                                    <AvatarFallback>{chat.user.name[0]}</AvatarFallback>
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
                    ))}
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
                            {activeChat.messages.map((msg, idx) => {
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
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-3xl p-2 px-4 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                                <div className="flex gap-2 pb-1 text-muted-foreground shrink-0">
                                    <Smile className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                                    <ImageIcon className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                                </div>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Scrivi un messaggio..."
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    size="icon"
                                    className={`h-8 w-8 rounded-full shrink-0 transition-all ${newMessage.trim()
                                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                                        : "bg-white/10 text-white/40"
                                        }`}
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
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
