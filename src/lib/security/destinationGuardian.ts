/**
 * LinkPulse 2.0 — Destination Change Guardian
 * 
 * Tracks and audits changes made to short link destinations inside the application.
 * Protects users and audience from silent redirection hijacking or unintentional destination swaps.
 * 
 * NOTICE:
 * This module monitors changes made within LinkPulse. It does not monitor external server-side
 * HTTP redirects or downstream website modifications occurring independently on target hosts.
 */

export interface DestinationChangeRecord {
  id: string;
  linkId: string;
  shortCode: string;
  linkTitle: string;
  oldUrl: string;
  newUrl: string;
  timestamp: string;
  status: 'pending_review' | 'approved' | 'paused';
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

const STORAGE_KEY = 'lp_destination_changes';

export const DestinationGuardian = {
  getChangeHistory(linkId?: string): DestinationChangeRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: DestinationChangeRecord[] = JSON.parse(raw);
      if (linkId) {
        return parsed.filter((item) => item.linkId === linkId);
      }
      return parsed;
    } catch (e) {
      console.warn('[DestinationGuardian] Failed to load change history', e);
      return [];
    }
  },

  saveChangeHistory(records: DestinationChangeRecord[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('[DestinationGuardian] Storage quota exceeded', e);
    }
  },

  recordChange(params: {
    linkId: string;
    shortCode: string;
    linkTitle: string;
    oldUrl: string;
    newUrl: string;
  }): DestinationChangeRecord {
    const records = this.getChangeHistory();
    const newRecord: DestinationChangeRecord = {
      id: 'dchg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      linkId: params.linkId,
      shortCode: params.shortCode,
      linkTitle: params.linkTitle,
      oldUrl: params.oldUrl,
      newUrl: params.newUrl,
      timestamp: new Date().toISOString(),
      status: 'pending_review',
    };

    records.unshift(newRecord);
    this.saveChangeHistory(records);
    return newRecord;
  },

  updateChangeStatus(
    changeId: string,
    status: 'approved' | 'paused',
    reviewedBy: string = 'Current User'
  ): DestinationChangeRecord | null {
    const records = this.getChangeHistory();
    const record = records.find((r) => r.id === changeId);
    if (!record) return null;

    record.status = status;
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = reviewedBy;
    this.saveChangeHistory(records);
    return record;
  },

  clearHistory(linkId?: string) {
    if (!linkId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const filtered = this.getChangeHistory().filter((r) => r.linkId !== linkId);
    this.saveChangeHistory(filtered);
  },
};
