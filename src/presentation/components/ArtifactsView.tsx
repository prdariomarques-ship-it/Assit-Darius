import { useState } from 'react';
import { Database, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { ArtifactFormat, ArtifactItem } from '../../domain/models';

interface ArtifactsViewProps {
  artifacts: ArtifactItem[];
  selectedArtifact: ArtifactItem | null;
  formatFilter: ArtifactFormat | 'TODOS';
  searchQuery: string;
  onFormatFilterChange: (format: ArtifactFormat | 'TODOS') => void;
  onSearchChange: (value: string) => void;
  onSelectArtifact: (id: string) => void;
  onAddArtifact: (
    title: string,
    format: ArtifactFormat,
    source: string,
    extractedPreview: string
  ) => void;
  onDeleteArtifact: (id: string) => void;
}

const FORMAT_OPTIONS: Array<ArtifactFormat | 'TODOS'> = [
  'TODOS',
  'PDF',
  'XML',
  'XLSX',
  'AUDIO',
  'DOCX',
  'IMAGEM',
];

const CREATE_FORMATS: ArtifactFormat[] = ['PDF', 'XML', 'XLSX', 'AUDIO', 'DOCX', 'IMAGEM'];

export function ArtifactsView({
  artifacts,
  selectedArtifact,
  formatFilter,
  searchQuery,
  onFormatFilterChange,
  onSearchChange,
  onSelectArtifact,
  onAddArtifact,
  onDeleteArtifact,
}: ArtifactsViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<ArtifactFormat>('PDF');
  const [newSource, setNewSource] = useState('Armazenamento local Room (ArtifactDao)');
  const [newPreview, setNewPreview] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddArtifact(newTitle, newFormat, newSource, newPreview);
    setNewTitle('');
    setNewPreview('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/90 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Artefatos e Documentos</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Persistidos localmente via <span className="font-mono text-zinc-300">ArtifactDao</span> (Room / IndexedDB). Registros adicionados ou removidos são mantidos entre reinicializações do app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filtrar artefatos persistidos..."
              className="min-h-[40px] w-full rounded-xl border border-zinc-800 bg-[#0D1117] pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Novo artefato (Room)</span>
          </button>
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={handleCreateSubmit}
          className="grid gap-3 rounded-2xl border border-zinc-800 bg-[#0D1117] p-4 sm:grid-cols-3"
        >
          <div>
            <label className="block text-xs text-zinc-400">Nome do arquivo / artefato</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex.: Relatorio_Trimestral_2026.pdf"
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400">Formato</label>
            <select
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value as ArtifactFormat)}
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            >
              {CREATE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400">Origem</label>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs text-zinc-400">
              Resumo estruturado / metadados extraídos
            </label>
            <input
              type="text"
              value={newPreview}
              onChange={(e) => setNewPreview(e.target.value)}
              placeholder="Ex.: Cláusulas principais, tabelas ou campos fiscais identificados..."
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <Database className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
              <span>Será gravado na tabela local <code className="font-mono text-zinc-300">artifacts</code></span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="min-h-[38px] rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[38px] rounded-lg bg-sky-500 px-3.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
              >
                Persistir no Room
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {FORMAT_OPTIONS.map((fmt) => {
          const active = formatFilter === fmt;
          return (
            <button
              key={fmt}
              type="button"
              onClick={() => onFormatFilterChange(fmt)}
              className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-teal-500 text-zinc-950'
                  : 'border border-zinc-800 bg-[#0D1117] text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {fmt === 'TODOS' ? 'Todos' : fmt}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          {artifacts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#0D1117] p-6 text-center">
              <p className="text-sm text-zinc-300">Nenhum artefato persistido corresponde ao filtro.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Adicione um artefato acima ou restaure os dados iniciais em Configurações.
              </p>
            </div>
          ) : (
            artifacts.map((item) => {
              const selected = selectedArtifact?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                    selected
                      ? 'border-teal-500/60 bg-zinc-900/90'
                      : 'border-zinc-800/90 bg-[#0D1117] hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectArtifact(item.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                        <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-teal-400">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {item.extractedPreview}
                    </p>
                    <p className="mt-2.5 text-[11px] text-zinc-500">
                      {item.format} · {item.source} · {item.processedAt}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteArtifact(item.id)}
                    title={`Excluir artefato ${item.title}`}
                    aria-label={`Excluir artefato ${item.title}`}
                    className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-5">
          {selectedArtifact ? (
            <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
              <p className="text-xs text-sky-400">Entidade persistida · ArtifactEntity (Room)</p>
              <h2 className="mt-1 break-all text-base font-semibold text-zinc-100">
                {selectedArtifact.title}
              </h2>

              <dl className="mt-4 divide-y divide-zinc-800/80 text-xs">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Chave primária (@PrimaryKey)</dt>
                  <dd className="font-mono text-zinc-300">{selectedArtifact.id}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Formato</dt>
                  <dd className="font-mono text-zinc-200">{selectedArtifact.format}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Origem</dt>
                  <dd className="text-right text-zinc-200">{selectedArtifact.source}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Data de processamento</dt>
                  <dd className="font-mono tabular-nums text-zinc-200">
                    {selectedArtifact.processedAt}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Confiança estimada</dt>
                  <dd className="font-mono tabular-nums text-teal-400">
                    {(selectedArtifact.confidence * 100).toFixed(0)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-400">Fase alvo</dt>
                  <dd className="text-right text-zinc-200">{selectedArtifact.targetPhase}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <p className="text-xs font-medium text-zinc-200">Conteúdo extraído</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {selectedArtifact.extractedPreview}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <p className="text-xs font-medium text-zinc-200">Erros ou pendências</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {selectedArtifact.errorsFound ?? 'Nenhum erro estrutural registrado neste item.'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
