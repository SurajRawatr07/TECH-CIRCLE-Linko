import React, { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, Shield, Search, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { adminApi } from '../../lib/api';
import { BlocklistEntry } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function AdminBlocklistPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [entries, setEntries] = useState<BlocklistEntry[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newReason, setNewReason] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBlocklist() {
      setIsLoading(true);
      try {
        const data = await adminApi.getBlocklist();
        setEntries(data);
      } catch {
        toastError('Failed to load blocklist');
      } finally {
        setIsLoading(false);
      }
    }
    loadBlocklist();
  }, []);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim() || !newReason.trim() || !user) return;

    try {
      const entry = await adminApi.addToBlocklist(newDomain.trim(), newReason.trim(), user.name);
      setEntries([entry, ...entries]);
      setNewDomain('');
      setNewReason('');
      success(`Domain "${entry.domain}" added to safety blocklist`);
    } catch {
      toastError('Failed to add domain to blocklist');
    }
  }

  async function handleRemoveEntry(id: string) {
    try {
      await adminApi.removeFromBlocklist(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      success('Domain removed from blocklist');
    } catch {
      toastError('Failed to remove domain');
    }
  }

  const filteredEntries = entries.filter((e) =>
    e.domain.toLowerCase().includes(search.toLowerCase()) ||
    e.reason.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Domain Safety Blocklist
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Global domain deny-list. All traffic targeting these domains is blocked immediately at redirect resolution.
        </p>
      </div>

      {/* Add to Blocklist Form */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Add Domain to Blocklist
        </h3>
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Domain"
            placeholder="e.g. malicious-portal.xyz"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            required
            isMono
          />
          <Input
            label="Security Rationale"
            placeholder="e.g. Verified credential phishing campaign"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            required
          />
          <Button type="submit" variant="danger" size="md" className="h-9.5">
            <Ban className="w-4 h-4 mr-1.5" />
            <span>Block Domain</span>
          </Button>
        </form>
      </Card>

      {/* Blocklist Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Input
            placeholder="Search blocklisted domains or reasons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Blocked Domain</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Added By</th>
                <th className="py-3 px-4">Added Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                    {entry.domain}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-sm truncate">
                    {entry.reason}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {entry.addedBy}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove from blocklist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
