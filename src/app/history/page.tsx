import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cronologia</h1>
                <p className="text-muted-foreground">Lo storico di tutti i tuoi contenuti generati.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nessun post recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Inizia a creare il tuo primo post!</p>
                </CardContent>
            </Card>
        </div>
    );
}
