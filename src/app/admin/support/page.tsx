"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Filter,
    Clock,
    AlertTriangle,
    ChevronRight,
    ExternalLink,
    RefreshCw,
    MoreVertical
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterSla, setFilterSla] = useState("all");

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterPriority !== 'all') params.append('priority', filterPriority);
            if (search) params.append('q', search);

            const res = await fetch(`/api/admin/tickets?${params.toString()}`);
            const data = await res.json();
            if (data.tickets) setTickets(data.tickets);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filterStatus, filterPriority]); // Re-fetch when filters change (search handles separately or via button)

    // FilteredTickets remains for local search or as a fallback, 
    // but the API now returns mostly filtered results.
    const filteredTickets = tickets;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open": return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">Aperto</Badge>;
            case "in_progress": return <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10">In Lavoro</Badge>;
            case "waiting_user": return <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10">In Attesa Utente</Badge>;
            case "resolved": return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Risolto</Badge>;
            case "closed": return <Badge variant="secondary" className="opacity-50">Chiuso</Badge>;
            case "investigating": return <Badge variant="destructive" className="animate-pulse">Analisi 🚀</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high": return <Badge className="bg-red-500 hover:bg-red-600">High</Badge>;
            case "medium": return <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-white">Med</Badge>;
            case "low": return <Badge variant="secondary">Low</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support Admin</h1>
                    <p className="text-muted-foreground">Gestione ticket e assistenza clienti SMM Digitale.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchTickets} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Aggiorna
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Totale Ticket</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tickets.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-red-600">SLA Breach</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {tickets.filter(t => t.is_sla_breached).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Aperti</CardTitle>
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'investigating').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Risolti (Oggi)</CardTitle>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tickets.filter(t => t.status === 'resolved' && new Date(t.created_at_iso).toDateString() === new Date().toDateString()).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-muted/30 p-4 rounded-xl flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per ID, Workspace o Email..."
                        className="pl-10 bg-background border-none shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-background border-none shadow-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="open">Aperto</SelectItem>
                        <SelectItem value="in_progress">In Lavoro</SelectItem>
                        <SelectItem value="waiting_user">In Attesa Utente</SelectItem>
                        <SelectItem value="resolved">Risolto</SelectItem>
                        <SelectItem value="closed">Chiuso</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[180px] bg-background border-none shadow-sm">
                        <SelectValue placeholder="Priorità" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutte le priorità</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant={filterSla === "breached" ? "destructive" : "outline"}
                    className="border-none shadow-sm"
                    onClick={() => setFilterSla(filterSla === "all" ? "breached" : "all")}
                >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    SLA Scadute
                </Button>
            </div>

            {/* Main Table */}
            <div className="border rounded-xl bg-background shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[120px]">Ticket ID</TableHead>
                            <TableHead>Workspace</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Priorità</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Creato</TableHead>
                            <TableHead>Deadline SLA</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Caricamento ticket...
                                </TableCell>
                            </TableRow>
                        ) : filteredTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                                    Nessun ticket trovato con i filtri attuali.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTickets.map((t) => (
                                <TableRow key={t.id} className="group cursor-pointer hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-primary">
                                        {t.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{t.workspace_name || "N/A"}</span>
                                            <span className="text-xs text-muted-foreground">{t.user_email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{t.category?.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getPriorityBadge(t.priority)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(t.status)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(t.created_at_iso), "dd MMM HH:mm", { locale: it })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`text-xs ${t.is_sla_breached ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                {t.response_deadline_iso ? format(new Date(t.response_deadline_iso), "dd MMM HH:mm", { locale: it }) : "-"}
                                            </span>
                                            {t.is_sla_breached && (
                                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">SCADUTO</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/support/${t.id.trim()}`}>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                Apri <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
