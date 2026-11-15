import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../pwa/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'top-banner' | 'header' | 'card';
  deviceLabel?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  deviceLabel,
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isSupportedContext,
    isBannerDismissed,
    promptInstall,
    dismissBanner,
  } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareableUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://dario-assistant.app';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedUrl(true);
      globalThis.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  // Aciona o evento prompt() nativo do navegador ('beforeinstallprompt').
  // Caso o navegador ainda não tenha emitido o evento (ex.: preview em iframe ou iOS),
  // abre o guia direto de instalação no Android.
  const handleInstallDarioClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'unavailable') {
      setShowInstallGuide(true);
    }
  };

  // Se a PWA já estiver instalada (display-mode: standalone ou appinstalled):
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-500/30 bg-teal-950/20 px-4 py-3 text-xs text-teal-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
            <span>
              <strong>Dario Assistant Instalado</strong> — Executando como aplicativo nativo
              (Standalone) com Service Worker e banco IndexedDB offline.
            </span>
          </div>
          <span className="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-300">
            INSTALADO
          </span>
        </div>
      );
    }
    return null;
  }

  // Se o contexto não suportar instalação ou o banner de topo tiver sido dispensado:
  if (!isSupportedContext) {
    return null;
  }

  if (variant === 'top-banner' && isBannerDismissed) {
    return null;
  }

  return (
    <>
      {variant === 'top-banner' ? (
        <div
          role="region"
          aria-label="Banner de instalação do aplicativo Dario Assistant"
          className="border-b border-teal-500/25 bg-[#0A1114]/95 px-4 py-2 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5 text-xs text-zinc-200">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-teal-500/30 bg-teal-500/15 text-teal-300">
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="truncate">
                <span className="font-semibold text-teal-300">
                  {isInstallable ? 'Pronto para instalar no Android:' : 'App Android / PWA Offline:'}
                </span>{' '}
                adicione o <strong>Dario Assistant</strong> à tela inicial para{' '}
                <span className="text-zinc-300">{deviceLabel || 'este aparelho'}</span>.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleInstallDarioClick}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Instalar Dario</span>
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Ocultar aviso de instalação"
                title="Ocultar banner"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : variant === 'header' ? (
        <button
          type="button"
          onClick={handleInstallDarioClick}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-1.5 text-xs font-medium text-teal-200 transition-colors hover:border-teal-400 hover:bg-teal-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 whitespace-nowrap"
          title="Instalar Dario Assistant na tela inicial do Android"
        >
          <Download className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
          <span>Instalar Dario</span>
        </button>
      ) : (
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-teal-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Instalação no Celular Android / PWA Offline
                </h3>
                <span className="rounded border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                  {isInstallable ? 'beforeinstallprompt ativo' : 'PWA pronta'}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Instale o <strong>Dario Assistant</strong> com ícone próprio na tela inicial para{' '}
                <span className="text-teal-300">{deviceLabel || 'este aparelho'}</span>, tela cheia
                e funcionamento offline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstallDarioClick}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Instalar Dario</span>
            </button>
          </div>
        </div>
      )}

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0B0F14] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="pwa-install-modal-title" className="text-base font-semibold text-zinc-100">
                    Instalar Dario Assistant no Celular
                  </h3>
                  <p className="text-xs text-zinc-400">
                    PWA oficial com ícone na tela inicial, tela cheia e banco offline isolado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Fechar guia de instalação"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-zinc-300">
              {isInstallable && (
                <div className="rounded-lg border border-teal-500/40 bg-teal-950/30 p-3.5">
                  <p className="font-medium text-teal-200">
                    Diálogo nativo do Android detectado (`beforeinstallprompt`):
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallDarioClick}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Instalar Dario</span>
                  </button>
                </div>
              )}

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-2">
                <p className="font-semibold text-zinc-100">
                  1. Instalar direto no Android (Google Chrome — Recomendado)
                </p>
                <ol className="list-decimal space-y-1.5 pl-4 text-zinc-300">
                  <li>
                    Abra o link direto do app no <strong>Google Chrome</strong> do celular Android
                    (ao abrir fora do preview, o botão <strong>&ldquo;Instalar Dario&rdquo;</strong>{' '}
                    dispara automaticamente o diálogo nativo do Android).
                  </li>
                  <li>
                    Ou toque no menu de três pontos (<strong>⋮</strong>) no canto superior direito e
                    selecione <strong>&ldquo;Instalar aplicativo&rdquo;</strong>.
                  </li>
                  <li>
                    O ícone do <strong>Dario</strong> será criado na tela inicial e abrirá em tela
                    cheia.
                  </li>
                </ol>

                <div className="mt-2 flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    aria-label="URL direta para instalação no celular"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-1.5">
                <p className="font-semibold text-zinc-100">
                  2. Gerar arquivo <code className="text-teal-300">.apk</code> físico (Opcional)
                </p>
                <p className="text-zinc-400">
                  Com o <code className="text-zinc-300">manifest.webmanifest</code> e o Service
                  Worker ativos, você pode colar a URL acima no{' '}
                  <strong className="text-zinc-200">PWABuilder.com</strong> (Package for Store →
                  Android) para baixar um <code className="text-teal-300">.apk</code> assinado via
                  Trusted Web Activity.
                </p>
              </div>

              {isIOS && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-1.5">
                  <p className="font-semibold text-zinc-100">Instalar no iPhone / iPad (Safari)</p>
                  <p className="text-zinc-400">
                    1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.
                    <br />
                    2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
