import { Link, User, ClickEvent } from '../../types';

// Simple client-side hash for demo/local mode
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export const LocalStore = {
  isLocalMode: false,

  getUsers(): User[] {
    try {
      const data = localStorage.getItem('lp_local_users');
      if (!data) {
        return [];
      }
      return JSON.parse(data) as User[];
    } catch {
      return [];
    }
  },

  saveUsers(users: User[]) {
    try {
      localStorage.setItem('lp_local_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },

  registerUser(name: string, email: string, passwordPlain: string): User {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: simpleHash(passwordPlain),
      salt: 'local',
      role: 'user', // Always user role
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    this.isLocalMode = true;
    return newUser;
  },

  loginUser(email: string, passwordPlain: string): User {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found || found.passwordHash !== simpleHash(passwordPlain)) {
      throw new Error('Invalid email or password.');
    }

    this.setCurrentUser(found);
    this.isLocalMode = true;
    return found;
  },

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem('lp_current_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null, token?: string) {
    if (user) {
      localStorage.setItem('lp_current_user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('lp_token', token);
      } else {
        const existing = localStorage.getItem('lp_token');
        // Only set local placeholder if no session token exists
        if (!existing || existing === 'undefined' || existing === 'null') {
          localStorage.setItem('lp_token', 'local_tok_' + user.id);
        }
      }
    } else {
      localStorage.removeItem('lp_current_user');
      localStorage.removeItem('lp_token');
    }
  },

  getLinks(): Link[] {
    try {
      const data = localStorage.getItem('lp_local_links');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLinks(links: Link[]) {
    try {
      localStorage.setItem('lp_local_links', JSON.stringify(links));
    } catch (e) {
      console.warn('Failed to save links to localStorage:', e);
    }
  },

  createLink(link: Link): Link {
    const links = this.getLinks();
    links.unshift(link);
    this.saveLinks(links);
    return link;
  },

  updateLink(id: string, updates: Partial<Link>): Link {
    const links = this.getLinks();
    const idx = links.findIndex((l) => l.id === id);
    if (idx >= 0) {
      links[idx] = { ...links[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveLinks(links);
      return links[idx];
    }
    throw new Error('Link not found');
  },

  deleteLink(id: string) {
    const links = this.getLinks().filter((l) => l.id !== id);
    this.saveLinks(links);
  },

  recordClick(code: string): boolean {
    const links = this.getLinks();
    const link = links.find((l) => l.shortCode.toLowerCase() === code.toLowerCase());
    if (link) {
      link.clicksCount = (link.clicksCount || 0) + 1;
      this.saveLinks(links);
      return true;
    }
    return false;
  },
};
