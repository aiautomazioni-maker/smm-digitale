import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/mock-db';

export async function GET() {
    // Simulate real-time data calculation
    const now = new Date();

    // Get real user credits
    // In a real app, get user from session. Here default to testuser.
    const users = getAllUsers();
    const user = users.find(u => u.email === "testuser@example.com");
    const userCredits = user ? user.credits || 0 : 0;

    // 1. Chart Data (Last 7 days)
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            name: d.toLocaleDateString('it-IT', { weekday: 'short' }),
            value: Math.floor(Math.random() * 2000) + 1000, // Random engagement 1000-3000
            impressions: Math.floor(Math.random() * 5000) + 2000
        };
    });

    // 2. Headliner Stats
    const stats = {
        followers: 12450 + Math.floor(Math.random() * 10), // Slight variation
        engagement_rate: "4.8%",
        posts_active: 3,
        credits: userCredits // Dynamic from DB
    };

    // 3. Recent Activity (Mock log)
    const recent_activity = [
        { id: 1, type: "post", title: "Post pubblicato: 'Summer Vibes'", time: "2 ore fa", status: "success" },
        { id: 2, type: "login", title: "Nuovo accesso da Milano", time: "5 ore fa", status: "info" },
        { id: 3, type: "ai", title: "Generati 3 caption con AI", time: "Ieri", status: "success" },
        { id: 4, type: "ticket", title: "Ticket #tkt_094724 aperto", time: "Ieri", status: "warning" }
    ];

    // 4. Upcoming Posts (Mock from Calendar)
    const upcoming_posts = [
        { id: 101, title: "Lancio Prodotto", date: "Domani, 10:00", platform: "instagram" },
        { id: 102, title: "Quote Motivazionale", date: "17 Feb, 14:00", platform: "linkedin" },
        { id: 103, title: "Reel Dietro le Quinte", date: "18 Feb, 18:30", platform: "instagram" }
    ];

    return NextResponse.json({
        chartData,
        stats,
        recent_activity,
        upcoming_posts
    });
}
