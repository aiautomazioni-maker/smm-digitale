import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/mock-db';

export async function GET() {
    const users = getAllUsers();
    const user = users.find(u => u.email === "testuser@example.com");
    const userCredits = user ? user.credits || 0 : 0;

    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            name: d.toLocaleDateString('it-IT', { weekday: 'short' }),
            instagram: Math.floor(Math.random() * 1000) + 500,
            facebook: Math.floor(Math.random() * 800) + 300,
            tiktok: Math.floor(Math.random() * 1500) + 700,
            impressions: Math.floor(Math.random() * 5000) + 2000
        };
    });

    const stats = {
        followers: 12450 + Math.floor(Math.random() * 10),
        engagement_rate: "4.8%",
        posts_active: 3,
        credits: userCredits
    };

    const recent_activity = [
        { id: 1, type: "post", title: "Post pubblicato: 'AI Future'", time: "2 ore fa", status: "success" },
        { id: 2, type: "login", title: "Nuovo accesso da Milano", time: "5 ore fa", status: "info" },
        { id: 3, type: "ai", title: "Generati 3 caption con AI", time: "Ieri", status: "success" },
        { id: 4, type: "ticket", title: "Ticket #tkt_094724 aperto", time: "Ieri", status: "warning" }
    ];

    const upcoming_posts = [
        { id: 101, title: "Lancio AI Bot", date: "Domani, 10:00", platform: "instagram" },
        { id: 102, title: "Case Study Automazione", date: "17 Feb, 14:00", platform: "facebook" },
        { id: 103, title: "Tutorial TikTok AI", date: "18 Feb, 18:30", platform: "tiktok" }
    ];

    return NextResponse.json({
        chartData,
        stats,
        recent_activity,
        upcoming_posts
    });
}
