import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingPosts } from "@/components/dashboard/UpcomingPosts";
import Link from "next/link";
import { Plus, Calendar as CalendarIcon, Heart, MessageCircle, Share2, MoreHorizontal, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Mock Data
const RECENT_COMMENTS = [
  { id: 1, user: { name: "Giulia B.", handle: "@giuliab", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" }, text: "Bellissimo locale, verrò sicuramente a trovarvi!", time: "2h fa", postImg: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=100" },
  { id: 2, user: { name: "Marco Rossi", handle: "@marcorossi", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" }, text: "Che bontà 😍", time: "5h fa", postImg: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=100" },
  { id: 3, user: { name: "Anna Verdi", handle: "@anna.v12", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026034d" }, text: "A che ora aprite domenica?", time: "1g fa", postImg: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100" },
];

const RECENT_MESSAGES = [
  { id: 1, user: { name: "Food Advisor Milano", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d" }, text: "Complimenti per i vostri nuovi scatti! Sarebbe f...", time: "10:42", unread: true },
  { id: 2, user: { name: "Luca Bianchi", platform: "facebook", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026714d" }, text: "Salve, fate opzioni senza glutine?", time: "Ieri", unread: false },
  { id: 3, user: { name: "Sara Neri", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026724d" }, text: "Grazie mille!", time: "Lun", unread: false },
];

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-instagram-gradient p-10 text-white shadow-2xl">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-md">
            Bentornato, Creator! 🚀
          </h1>
          <p className="text-xl font-medium text-white/90">
            Il tuo assistente AI è pronto. Oggi è il giorno perfetto per lanciare il prossimo trend.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/new-post">
              <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center">
                <Plus className="mr-2 w-5 h-5" /> Crea Subito
              </button>
            </Link>
            <Link href="/calendar">
              <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full font-bold hover:bg-white/30 transition-all flex items-center">
                <CalendarIcon className="mr-2 w-5 h-5" /> Vedi Calendario
              </button>
            </Link>
          </div>
        </div>

        {/* Abstract Shapes Decoration */}
        <div className="absolute -right-20 -top-40 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-pulse" />
        <div className="absolute -right-20 bottom-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-50" />
      </section>

      {/* Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
        {/* Main Chart */}
        <EngagementChart />

        {/* Side Column / Bottom Row */}
        <RecentActivity />
        <UpcomingPosts />

        {/* WIDGET 1: Ultimi Commenti */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Ultimi Commenti</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Interazioni recenti sui tuoi post</p>
            </div>
            <Link href="/profiles">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 h-8 text-xs">
                Vedi tutti <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {RECENT_COMMENTS.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Avatar className="w-8 h-8 border border-white/10">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs truncate">{comment.user.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{comment.time}</span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-1">{comment.text}</p>
                </div>
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-white/10">
                  <img src={comment.postImg} alt="Post" className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* WIDGET 2: Ultimi Messaggi (Direct) */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Messaggi Diretti</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Chat in attesa di risposta</p>
            </div>
            <Link href="/inbox">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 h-8 text-xs">
                Apri Inbox <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {RECENT_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${msg.unread ? 'bg-white/10 border border-white/5' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <div className="relative shrink-0">
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={msg.user.avatar} />
                    <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                  </Avatar>
                  {msg.user.platform === 'instagram' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 border border-black flex items-center justify-center text-[6px] text-white font-bold">IG</div>
                  )}
                  {msg.user.platform === 'facebook' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-600 border border-black flex items-center justify-center text-[6px] text-white font-bold">f</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${msg.unread ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>{msg.user.name}</span>
                    <span className={`text-[10px] ml-1 shrink-0 ${msg.unread ? 'text-blue-400 font-bold' : 'text-muted-foreground'}`}>{msg.time}</span>
                  </div>
                  <p className={`text-xs truncate ${msg.unread ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>{msg.text}</p>
                </div>
                {msg.unread && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
