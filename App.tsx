
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Copy,
  Download,
  FileCode
} from 'lucide-react';
import { FileInput, DiffResult, DiffLine } from './types';

const App: React.FC = () => {
  const [fileA, setFileA] = useState<FileInput | null>(null);
  const [fileB, setFileB] = useState<FileInput | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Synchronized scrolling for side-by-side view
  const handleScroll = (source: 'left' | 'right') => {
    const sourceEl = source === 'left' ? leftRef.current : rightRef.current;
    const targetEl = source === 'left' ? rightRef.current : leftRef.current;
    if (sourceEl && targetEl) {
      targetEl.scrollTop = sourceEl.scrollTop;
      targetEl.scrollLeft = sourceEl.scrollLeft;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (side === 'A') setFileA({ name: file.name, content });
      else setFileB({ name: file.name, content });
      setError(null);
    };
    reader.readAsText(file);
  };

  const compareFiles = useCallback(() => {
    if (!fileA || !fileB) return;

    try {
      const linesA = fileA.content.split(/\r?\n/).map(l => l.trim());
      const linesB = fileB.content.split(/\r?\n/).map(l => l.trim());

      const leftDiff: DiffLine[] = [];
      const rightDiff: DiffLine[] = [];
      let added = 0;
      let removed = 0;
      let changed = 0;

      const maxLength = Math.max(linesA.length, linesB.length);
      
      for (let i = 0; i < maxLength; i++) {
        const lineA = linesA[i];
        const lineB = linesB[i];

        if (lineA === lineB) {
          leftDiff.push({ type: 'unchanged', content: lineA || '', lineNumber: i + 1 });
          rightDiff.push({ type: 'unchanged', content: lineB || '', lineNumber: i + 1 });
        } else if (lineA !== undefined && lineB === undefined) {
          leftDiff.push({ type: 'removed', content: lineA, lineNumber: i + 1 });
          rightDiff.push({ type: 'added', content: '', lineNumber: i + 1 });
          removed++;
        } else if (lineA === undefined && lineB !== undefined) {
          leftDiff.push({ type: 'removed', content: '', lineNumber: i + 1 });
          rightDiff.push({ type: 'added', content: lineB, lineNumber: i + 1 });
          added++;
        } else {
          leftDiff.push({ type: 'removed', content: lineA, lineNumber: i + 1 });
          rightDiff.push({ type: 'added', content: lineB, lineNumber: i + 1 });
          changed++;
        }
      }

      setDiffResult({
        left: leftDiff,
        right: rightDiff,
        summary: { added, removed, changed }
      });
    } catch (err) {
      setError("Không thể so sánh file. Vui lòng kiểm tra lại định dạng file.");
    }
  }, [fileA, fileB]);

  const clearFiles = () => {
    setFileA(null);
    setFileB(null);
    setDiffResult(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">XML Diff Studio</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">So sánh file XML chuyên dụng</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {diffResult && (
            <button 
              onClick={clearFiles}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Làm mới
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Drop Zones */}
        {!diffResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
            {[
              { side: 'A' as const, file: fileA, title: 'File Gốc (A)' },
              { side: 'B' as const, file: fileB, title: 'File Thay Thế (B)' }
            ].map(({ side, file, title }) => (
              <div 
                key={side}
                className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all h-full
                  ${file ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
              >
                <input 
                  type="file" 
                  accept=".xml,.txt"
                  onChange={(e) => handleFileUpload(e, side)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
                      <FileCode className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{(file.content.length / 1024).toFixed(2)} KB</p>
                    <button className="text-xs text-indigo-600 font-medium underline mt-2">Thay đổi file</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <Upload className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-600 uppercase text-xs tracking-widest">{title}</p>
                    <p className="text-sm text-slate-400">Chọn hoặc kéo thả file XML vào đây</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {!diffResult && (
          <div className="flex justify-center">
            <button 
              onClick={compareFiles}
              disabled={!fileA || !fileB}
              className="group flex items-center gap-3 px-12 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              SO SÁNH NGAY
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in shake duration-500">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Diff View */}
        {diffResult && (
          <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in fade-in duration-700">
            {/* Stats Summary */}
            <div className="flex flex-wrap gap-6 items-center px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thống kê:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  +{diffResult.summary.added} Thêm mới
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  -{diffResult.summary.removed} Đã xóa
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {diffResult.summary.changed} Thay đổi
                </span>
              </div>
              <div className="ml-auto flex items-center gap-6 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded bg-slate-200" />
                  <span>A: {fileA?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded bg-slate-200" />
                  <span>B: {fileB?.name}</span>
                </div>
              </div>
            </div>

            {/* Side by Side Diff Container */}
            <div className="flex-1 grid grid-cols-2 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl min-h-0">
              {/* Left Side */}
              <div 
                ref={leftRef}
                onScroll={() => handleScroll('left')}
                className="overflow-auto border-r border-slate-100 bg-slate-50/30"
              >
                <div className="sticky top-0 bg-white px-4 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 z-10 flex justify-between items-center uppercase tracking-widest">
                  <span>FILE GỐC (A)</span>
                  <button 
                    onClick={() => copyToClipboard(fileA?.content || '')}
                    className="p-1 hover:text-indigo-600 transition-colors"
                    title="Copy toàn bộ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="code-font text-[12px] leading-relaxed whitespace-pre font-medium">
                  {diffResult.left.map((line, i) => (
                    <div 
                      key={i} 
                      className={`group flex items-start min-h-[1.5rem] ${
                        line.type === 'removed' ? 'bg-red-50 text-red-700' : 
                        line.type === 'added' ? 'bg-slate-100/50 opacity-40' : 'text-slate-600'
                      }`}
                    >
                      <span className="w-10 flex-shrink-0 text-right pr-2 text-[10px] text-slate-300 select-none pt-0.5 border-r border-slate-200/50 mr-2 group-hover:text-slate-400">
                        {line.lineNumber}
                      </span>
                      <span className="flex-1 break-all pr-4">
                        {line.content || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side */}
              <div 
                ref={rightRef}
                onScroll={() => handleScroll('right')}
                className="overflow-auto bg-white"
              >
                <div className="sticky top-0 bg-white px-4 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 z-10 flex justify-between items-center uppercase tracking-widest">
                  <span>FILE THAY THẾ (B)</span>
                  <button 
                    onClick={() => copyToClipboard(fileB?.content || '')}
                    className="p-1 hover:text-indigo-600 transition-colors"
                    title="Copy toàn bộ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="code-font text-[12px] leading-relaxed whitespace-pre font-medium">
                  {diffResult.right.map((line, i) => (
                    <div 
                      key={i} 
                      className={`group flex items-start min-h-[1.5rem] ${
                        line.type === 'added' ? 'bg-green-50 text-green-700 font-semibold' : 
                        line.type === 'removed' ? 'bg-slate-100/50 opacity-40' : 'text-slate-600'
                      }`}
                    >
                      <span className="w-10 flex-shrink-0 text-right pr-2 text-[10px] text-slate-300 select-none pt-0.5 border-r border-slate-200/50 mr-2 group-hover:text-slate-400">
                        {line.lineNumber}
                      </span>
                      <span className="flex-1 break-all pr-4">
                        {line.content || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium">
        Công cụ so sánh XML dòng-theo-dòng
      </footer>
    </div>
  );
};

export default App;
