import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Sliders,
  Palette,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { linksApi } from '../lib/api';
import { Link as LinkType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatCompactNumber, getBaseShortUrl } from '../lib/utils';

export function QrCenterPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const [searchParams] = useSearchParams();

  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [mode, setMode] = useState<'existing' | 'custom'>('existing');

  // Customizer styling
  const [fgColor, setFgColor] = useState('#171717');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(220);
  const [includeMargin, setIncludeMargin] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      if (!user) return;
      try {
        const data = await linksApi.getLinks({ userId: user.role === 'admin' ? undefined : user.id });
        setLinks(data);

        const paramLinkId = searchParams.get('linkId');
        if (paramLinkId && data.some((l) => l.id === paramLinkId)) {
          setSelectedLinkId(paramLinkId);
          setMode('existing');
        } else if (data.length > 0) {
          setSelectedLinkId(data[0].id);
        }
      } catch {
        toastError('Failed to load links');
      }
    }
    loadLinks();
  }, [user, searchParams]);

  const activeLink = links.find((l) => l.id === selectedLinkId);

  const finalQrValue =
    mode === 'existing' && activeLink
      ? `${getBaseShortUrl()}/r/${activeLink.shortCode}?src=qr`
      : customUrl || `${getBaseShortUrl()}`;

  function handleDownloadSvg() {
    const svgEl = document.getElementById('qr-center-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linko-qr-${mode === 'existing' && activeLink ? activeLink.shortCode : 'custom'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('QR Code exported as vector SVG');
  }

  function handleDownloadPng() {
    const svgEl = document.getElementById('qr-center-svg') as SVGElement | null;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `linko-qr-${mode === 'existing' && activeLink ? activeLink.shortCode : 'custom'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        success('QR Code exported as high-res PNG');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Vector QR Code Studio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate, customize, and export production-ready vector QR codes with embedded scan analytics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-neutral-900 dark:text-white" />
              <span>Target & Source Configuration</span>
            </h3>

            {/* Target mode toggle */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                  mode === 'existing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Existing Short Link
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                  mode === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Custom URL
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <Select
                  label="Select Short Link"
                  options={links.map((l) => ({
                    value: l.id,
                    label: `/${l.shortCode} — ${l.title}`,
                  }))}
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                />

                {activeLink && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Telemetry Tracking:
                    </p>
                    <p className="text-slate-500 font-mono text-[11px] truncate">
                      {getBaseShortUrl()}/r/{activeLink.shortCode}?src=qr
                    </p>
                    <p className="text-neutral-900 dark:text-white font-mono text-[11px] pt-1 font-semibold">
                      Current QR scans: {formatCompactNumber(activeLink.qrScansCount)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Input
                label="Custom Target URL"
                placeholder="https://example.com/promo"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                helperText="Enter any destination URL for direct unrouted QR generation"
              />
            )}
          </Card>

          {/* Color & Size Customization */}
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-neutral-900 dark:text-white" />
              <span>Color & Styling Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Foreground Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    isMono
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    isMono
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Export Size</span>
                <span className="font-mono">{size} x {size} px</span>
              </div>
              <input
                type="range"
                min="120"
                max="400"
                step="20"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="margin-toggle"
                checked={includeMargin}
                onChange={(e) => setIncludeMargin(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
              />
              <label htmlFor="margin-toggle" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Include quiet safety margin around code
              </label>
            </div>
          </Card>
        </div>

        {/* Right Side: Live Canvas Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Canvas Preview
            </span>

            <div
              style={{
                backgroundColor: bgColor,
                padding: includeMargin ? '24px' : '0px',
                borderRadius: '16px',
              }}
              className="shadow-md border border-slate-200 dark:border-slate-700 transition-all"
            >
              <QRCodeSVG
                id="qr-center-svg"
                value={finalQrValue}
                size={size > 260 ? 260 : size}
                fgColor={fgColor}
                bgColor={bgColor}
                level="H"
                includeMargin={includeMargin}
              />
            </div>

            <div className="space-y-1 max-w-xs">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Encoded Value:
              </p>
              <p className="text-[11px] font-mono text-slate-500 break-all">
                {finalQrValue}
              </p>
            </div>

            {/* Export buttons */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <Button variant="outline" size="md" onClick={handleDownloadSvg} className="w-full text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export SVG</span>
              </Button>
              <Button variant="primary" size="md" onClick={handleDownloadPng} className="w-full text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export PNG</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
