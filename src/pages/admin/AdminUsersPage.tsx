import React, { useState, useEffect } from 'react';
import { Users, Shield, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminApi, linksApi } from '../../lib/api';
import { User, Link as LinkType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TableRowSkeleton } from '../../components/ui/Skeleton';

export function AdminUsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [userLinkCounts, setUserLinkCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const [userData, linksData] = await Promise.all([
          adminApi.getUsers(),
          linksApi.getLinks(),
        ]);
        setUsers(userData);

        const counts: Record<string, number> = {};
        linksData.forEach((l) => {
          counts[l.userId] = (counts[l.userId] || 0) + 1;
        });
        setUserLinkCounts(counts);
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform Users Directory
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Directory of registered workspace accounts, roles, and link ownership
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Workspace</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Links Owned</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {u.workspaceName || 'Personal Workspace'}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'danger' : 'info'} size="sm">
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {userLinkCounts[u.id] || 0}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
