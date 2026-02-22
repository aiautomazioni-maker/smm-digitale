export interface EmailGeneratorInput {
    lang: string;
    ticket: {
        id: string;
        workspace_name: string;
        category: string;
        summary: string;
    };
    customer: {
        email: string;
        name: string;
    };
    agent_input: {
        goal: string;
        message_points: string[];
        asks: string[];
    };
}

export function generateSupportEmail(input: EmailGeneratorInput) {
    const { ticket, customer, agent_input } = input;

    const subject = `Aggiornamento richiesta ${ticket.id} - ${ticket.workspace_name}`;

    const firstName = customer.name.split(' ')[0];

    let body = `Ciao ${firstName},\n\n`;
    body += `In merito alla tua richiesta #${ticket.id} (${ticket.summary}), ecco gli aggiornamenti.\n\n`;

    if (agent_input.goal) {
        body += `Il nostro obiettivo è: ${agent_input.goal}\n\n`;
    }

    if (agent_input.message_points && agent_input.message_points.length > 0) {
        body += `Ti suggeriamo di seguire questi passaggi:\n`;
        agent_input.message_points.forEach((point, index) => {
            body += `${index + 1}. ${point}\n`;
        });
        body += `\n`;
    }

    if (agent_input.asks && agent_input.asks.length > 0) {
        body += `Per procedere, avremmo bisogno di alcune informazioni:\n`;
        agent_input.asks.forEach(ask => {
            body += `- ${ask}\n`;
        });
        body += `\n`;
    }

    body += `Rimaniamo a tua completa disposizione.\n\n`;
    body += `Un cordiale saluto,\n`;
    body += `Support Team`;

    return {
        email: {
            to: customer.email,
            subject: subject,
            body_text: body
        }
    };
}
