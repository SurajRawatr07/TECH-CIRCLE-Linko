import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { linksApi, adminApi, importsApi } from '../lib/api';
import { validateUrl, validateAlias } from '../lib/validators';
import { generateShortCode } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface CsvRow {
  url: string;
  alias?: string;
  title?: string;
  tags?: string;
}

interface ParsedRowResult {
  url: string;
  alias: string;
  title: string;
  tags: string[];
  status: 'valid' | 'invalid_url' | 'duplicate_alias' | 'blocklisted';
  error?: string;
}

export function BulkImportPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
  } | null>(null);

  function handleDownloadTemplate() {
    const csvContent =
      'data:text/csv;charset=utf-8,url,alias,title,tags\n' +
      'https://github.com/facebook/react,react-repo,React GitHub Repository,OpenSource|Frontend\n' +
      'https://vite.dev,vitejs,Vite Next-Gen Tooling,DevTools|Vite\n' +
      'https://tailwindcss.com,tailwind,Tailwind CSS Framework,CSS|Design\n';
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = 'linko_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Template CSV downloaded');
  }

  async function processCsvFile(file: File) {
    setIsProcessing(true);
    setImportSummary(null);

    try {
      const [existingLinks, blocklist] = await Promise.all([
        linksApi.getLinks(),
        adminApi.getBlocklist(),
      ]);

      const existingCodes = existingLinks.map((l) => l.shortCode.toLowerCase());
      const blocklistDomains = blocklist.map((b) => b.domain);

      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows: ParsedRowResult[] = [];
          const currentBatchAliases = new Set<string>();

          for (const raw of results.data) {
            const rawUrl = (raw.url || '').trim();
            if (!rawUrl) continue;

            let targetUrl = rawUrl;
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
              targetUrl = 'https://' + targetUrl;
            }

            // URL check
            const urlValidation = validateUrl(targetUrl, blocklistDomains);
            let rowStatus: ParsedRowResult['status'] = 'valid';
            let rowError: string | undefined;

            if (!urlValidation.valid) {
              rowStatus = urlValidation.isBlocklisted ? 'blocklisted' : 'invalid_url';
              rowError = urlValidation.error;
            }

            // Alias check or auto-generate
            let alias = (raw.alias || '').trim();
            if (!alias) {
              alias = generateShortCode(6);
            }

            if (rowStatus === 'valid') {
              const aliasValidation = validateAlias(alias, existingCodes);
              if (!aliasValidation.valid) {
                rowStatus = 'duplicate_alias';
                rowError = aliasValidation.error;
              } else if (currentBatchAliases.has(alias.toLowerCase())) {
                rowStatus = 'duplicate_alias';
                rowError = 'Duplicate alias within the uploaded CSV batch';
              }
            }

            currentBatchAliases.add(alias.toLowerCase());

            const tagsList = (raw.tags || '')
              .split('|')
              .map((t) => t.trim())
              .filter(Boolean);

            rows.push({
              url: targetUrl,
              alias,
              title: (raw.title || '').trim() || urlValidation.hostname || targetUrl,
              tags: tagsList,
              status: rowStatus,
              error: rowError,
            });
          }

          setParsedRows(rows);
          setIsProcessing(false);
          success(`Parsed ${rows.length} rows from CSV`);
        },
        error: () => {
          toastError('Failed to parse CSV file');
          setIsProcessing(false);
        },
      });
    } catch {
      toastError('Error inspecting links and blocklists');
      setIsProcessing(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  }

  async function handleImportValid() {
    if (!user) return;
    const validRows = parsedRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      toastError('No valid rows available to import');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importsApi.importBulk(
        validRows.map((r) => ({
          url: r.url,
          alias: r.alias,
          title: r.title,
          tags: r.tags.join('|'),
        }))
      );

      const importedCount = result.summary?.imported || 0;
      setImportSummary({
        total: parsedRows.length,
        imported: importedCount,
        skipped: parsedRows.length - importedCount,
      });
      success(`Successfully imported ${importedCount} links!`);
    } catch (err: any) {
      toastError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  function handleDownloadErrorReport() {
    const errorRows = parsedRows.filter((r) => r.status !== 'valid');
    const csvContent =
      'data:text/csv;charset=utf-8,url,alias,error_reason\n' +
      errorRows.map((r) => `"${r.url}","${r.alias}","${r.error || r.status}"`).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = 'linko_import_errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bulk CSV Link Import
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Migrate or create hundreds of short links simultaneously with automatic validation
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-xs">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Download Sample CSV</span>
        </Button>
      </div>

      {/* Drag & Drop Area */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`p-8 sm:p-12 text-center border-2 border-dashed transition-colors cursor-pointer rounded-2xl ${
          isDragging
            ? 'border-neutral-900 bg-neutral-100 dark:bg-neutral-800/40'
            : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processCsvFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 stroke-[1.8]" />
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Drop your .CSV file here, or click to browse
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          CSV columns: <span className="font-mono">url, alias, title, tags</span> (pipe-separated).
        </p>
      </Card>

      {/* Parsed Preview Table */}
      {parsedRows.length > 0 && (
        <Card className="p-0 overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Batch Validation Preview
              </span>
              <Badge variant="success" size="sm">
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="danger" size="sm">
                  {invalidCount} Rejected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {invalidCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleDownloadErrorReport} className="text-xs">
                  Download Errors
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={validCount === 0 || isImporting}
                isLoading={isImporting}
                onClick={handleImportValid}
                className="text-xs"
              >
                <span>Import {validCount} Valid Links</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Destination Target</th>
                  <th className="py-2.5 px-4">Short Code</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.status === 'valid'
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-rose-50/40 dark:bg-rose-950/20'
                    }
                  >
                    <td className="py-2.5 px-4">
                      {row.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 text-neutral-900 dark:text-neutral-100 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium" title={row.error}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{row.error || 'Invalid'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {row.url}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      /{row.alias}
                    </td>
                    <td className="py-2.5 px-4 truncate max-w-xs text-slate-800 dark:text-slate-200">
                      {row.title}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {row.tags.length > 0 ? row.tags.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Import Summary Report */}
      {importSummary && (
        <Card className="p-6 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Import Completed Successfully
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Imported {importSummary.imported} links ({importSummary.skipped} rows skipped due to duplicate or invalid syntax).
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="primary" size="sm" onClick={() => navigate('/app/links')}>
              View Imported Links
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
