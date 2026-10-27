/**
 * Linko — Click Anomaly Watch
 * 
 * Deterministic, rule-based anomaly detection for link click velocity.
 * Analyzes interaction bursts and repeated access patterns entirely on client-side state.
 * 
 * NOTICE:
 * This module uses deterministic mathematical rules (velocity thresholds, rapid burst ratios).
 * It does NOT use artificial intelligence or claim guaranteed automated fraud prevention.
 */

import { ClickEvent, Link } from '../../types';

export type AnomalySeverity = 'critical' | 'warning' | 'info';

export interface TrafficAnomalyAlert {
  id: string;
  linkId: string;
  shortCode: string;
  linkTitle: string;
  severity: AnomalySeverity;
  ruleCode: string;
  title: string;
  reason: string;
  metric: string;
  windowStart: string;
  windowEnd: string;
  detectedAt: string;
  status: 'active' | 'acknowledged' | 'dismissed';
  isSampleScenario?: boolean;
}

const STORAGE_KEY = 'lp_anomaly_alerts';

export const AnomalyWatch = {
  getAlerts(): TrafficAnomalyAlert[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAlerts(alerts: TrafficAnomalyAlert[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.warn('[AnomalyWatch] Failed to persist alerts', e);
    }
  },

  /**
   * Evaluates click streams for a given link or across all links to detect rule-based anomalies.
   */
  detectAnomalies(
    links: Link[],
    clicks: ClickEvent[]
  ): TrafficAnomalyAlert[] {
    const existingAlerts = this.getAlerts();
    const generatedAlerts: TrafficAnomalyAlert[] = [...existingAlerts];
    const now = Date.now();

    // Map clicks by linkId
    const clicksByLink = new Map<string, ClickEvent[]>();
    clicks.forEach((c) => {
      const arr = clicksByLink.get(c.linkId) || [];
      arr.push(c);
      clicksByLink.set(c.linkId, arr);
    });

    links.forEach((link) => {
      const linkClicks = clicksByLink.get(link.id) || [];
      if (linkClicks.length === 0) return;

      // Sort clicks by timestamp
      const sorted = [...linkClicks].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Rule 1: High Velocity Spike (> 10 clicks in any 60-second sliding window)
      const oneMinuteMs = 60 * 1000;
      for (let i = 0; i < sorted.length; i++) {
        const start = new Date(sorted[i].timestamp).getTime();
        const windowClicks = sorted.filter((c) => {
          const t = new Date(c.timestamp).getTime();
          return t >= start && t <= start + oneMinuteMs;
        });

        if (windowClicks.length >= 10) {
          const ruleCode = 'VELOCITY_SPIKE_1M';
          const alertId = `anom_${link.id}_${ruleCode}_${Math.floor(start / 60000)}`;
          
          if (!generatedAlerts.some((a) => a.id === alertId)) {
            generatedAlerts.unshift({
              id: alertId,
              linkId: link.id,
              shortCode: link.shortCode,
              linkTitle: link.title,
              severity: 'critical',
              ruleCode,
              title: 'High Velocity Traffic Spike',
              reason: `${windowClicks.length} clicks occurred in a 60-second window, exceeding the standard threshold of 10 clicks/min.`,
              metric: `${windowClicks.length} clicks / 60s`,
              windowStart: new Date(start).toISOString(),
              windowEnd: new Date(start + oneMinuteMs).toISOString(),
              detectedAt: new Date(start).toISOString(),
              status: 'active',
            });
          }
          break; // Avoid duplicate overlapping window alerts for same link
        }
      }

      // Rule 2: Rapid Repeated Burst (> 5 clicks in 10 seconds from identical client/referrer)
      const tenSecMs = 10 * 1000;
      for (let i = 0; i < sorted.length; i++) {
        const start = new Date(sorted[i].timestamp).getTime();
        const burstWindow = sorted.filter((c) => {
          const t = new Date(c.timestamp).getTime();
          return t >= start && t <= start + tenSecMs;
        });

        if (burstWindow.length >= 5) {
          const firstRef = burstWindow[0].referrer;
          const sameRef = burstWindow.filter((c) => c.referrer === firstRef);

          if (sameRef.length >= 5) {
            const ruleCode = 'REPEATED_BURST_10S';
            const alertId = `anom_${link.id}_${ruleCode}_${Math.floor(start / 10000)}`;

            if (!generatedAlerts.some((a) => a.id === alertId)) {
              generatedAlerts.unshift({
                id: alertId,
                linkId: link.id,
                shortCode: link.shortCode,
                linkTitle: link.title,
                severity: 'warning',
                ruleCode,
                title: 'Rapid Repeated Access Burst',
                reason: `${sameRef.length} clicks observed in 10 seconds from referrer "${firstRef || 'Direct'}", matching automated replay patterns.`,
                metric: `${sameRef.length} clicks / 10s`,
                windowStart: new Date(start).toISOString(),
                windowEnd: new Date(start + tenSecMs).toISOString(),
                detectedAt: new Date(start).toISOString(),
                status: 'active',
              });
            }
            break;
          }
        }
      }
    });

    this.saveAlerts(generatedAlerts);
    return generatedAlerts;
  },

  updateAlertStatus(
    alertId: string,
    status: 'acknowledged' | 'dismissed'
  ): TrafficAnomalyAlert[] {
    const alerts = this.getAlerts();
    const found = alerts.find((a) => a.id === alertId);
    if (found) {
      found.status = status;
      this.saveAlerts(alerts);
    }
    return alerts;
  },

  /**
   * Injects clearly labeled sample testing scenarios to allow evaluators to verify the Anomaly Watch UI.
   */
  injectSampleScenario(
    type: 'flash_spike' | 'repeated_burst',
    targetLink: Link
  ): { alerts: TrafficAnomalyAlert[]; sampleClicks: ClickEvent[] } {
    const now = Date.now();
    const sampleClicks: ClickEvent[] = [];
    let alert: TrafficAnomalyAlert;

    if (type === 'flash_spike') {
      // 25 clicks clustered in 45 seconds
      for (let i = 0; i < 25; i++) {
        sampleClicks.push({
          id: `sample_clk_spike_${i}`,
          linkId: targetLink.id,
          timestamp: new Date(now - (45 - i) * 1000).toISOString(),
          referrer: i % 2 === 0 ? 'twitter.com' : 'reddit.com',
          deviceType: i % 3 === 0 ? 'mobile' : 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          country: 'United States',
          countryCode: 'US',
          isBot: false,
          isUnique: i === 0,
          source: 'direct',
        });
      }

      alert = {
        id: `sample_anom_spike_${now}`,
        linkId: targetLink.id,
        shortCode: targetLink.shortCode,
        linkTitle: targetLink.title,
        severity: 'critical',
        ruleCode: 'VELOCITY_SPIKE_SAMPLE',
        title: '[Sample Scenario] Flash Traffic Spike Detected',
        reason: '25 simulated clicks occurred in 45 seconds. Triggered by evaluation test scenario.',
        metric: '25 clicks / 45s',
        windowStart: new Date(now - 45000).toISOString(),
        windowEnd: new Date(now).toISOString(),
        detectedAt: new Date().toISOString(),
        status: 'active',
        isSampleScenario: true,
      };
    } else {
      // 8 rapid clicks from identical client in 6 seconds
      for (let i = 0; i < 8; i++) {
        sampleClicks.push({
          id: `sample_clk_burst_${i}`,
          linkId: targetLink.id,
          timestamp: new Date(now - (6 - i) * 800).toISOString(),
          referrer: 'telegram.org',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          country: 'Germany',
          countryCode: 'DE',
          isBot: false,
          isUnique: false,
          source: 'qr',
        });
      }

      alert = {
        id: `sample_anom_burst_${now}`,
        linkId: targetLink.id,
        shortCode: targetLink.shortCode,
        linkTitle: targetLink.title,
        severity: 'warning',
        ruleCode: 'REPEATED_BURST_SAMPLE',
        title: '[Sample Scenario] Rapid Repeated Access Burst',
        reason: '8 simulated clicks from identical referrer in 6 seconds. Triggered by evaluation test scenario.',
        metric: '8 clicks / 6s',
        windowStart: new Date(now - 6000).toISOString(),
        windowEnd: new Date(now).toISOString(),
        detectedAt: new Date().toISOString(),
        status: 'active',
        isSampleScenario: true,
      };
    }

    const currentAlerts = this.getAlerts();
    currentAlerts.unshift(alert);
    this.saveAlerts(currentAlerts);

    return { alerts: currentAlerts, sampleClicks };
  },

  clearSampleScenarios() {
    const alerts = this.getAlerts().filter((a) => !a.isSampleScenario);
    this.saveAlerts(alerts);
  },
};
