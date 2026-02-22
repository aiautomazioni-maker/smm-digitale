import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/lib/users.json');

export interface MockUser {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    workspace_name: string;
    email_verified: boolean;
    email_verification_token_hash: string | null;
    email_verification_expires_at: string | null;
    credits?: number;
    plan?: string;
}

function ensureDb() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
}

export function getAllUsers(): MockUser[] {
    ensureDb();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export function saveUser(user: MockUser) {
    const users = getAllUsers();
    users.push(user);
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): MockUser | undefined {
    const users = getAllUsers();
    return users.find(u => u.email === email);
}

export function updateUser(email: string, updates: Partial<MockUser>) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return users[index];
    }
    return null;
}
