import { ArtifactsView } from './presentation/components/ArtifactsView';
import { ConnectorsView } from './presentation/components/ConnectorsView';
import { ConversationsView } from './presentation/components/ConversationsView';
import { Header } from './presentation/components/Header';
import { DesktopSidebar, MobileBottomNav } from './presentation/components/NavigationShell';
import { NotificationsDrawer } from './presentation/components/NotificationsDrawer';
import { OfflineIndicator } from './presentation/components/OfflineIndicator';
import { PWAInstallButton } from './presentation/components/PWAInstallButton';
import { RadarView } from './presentation/components/RadarView';
import { ScheduledView } from './presentation/components/ScheduledView';
import { SettingsView } from './presentation/components/SettingsView';
import { useDarioAssistantViewModel } from './presentation/viewmodels/useDarioAssistantViewModel';

export default function App() {
  const vm = useDarioAssistantViewModel();
  const pendingRadarCount = vm.radarSignals.filter((s) => !s.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#07090B] text-zinc-100 flex flex-col">
      <Header
        userName={vm.settings.userName}
        deviceLabel={vm.settings.deviceLabel}
        instanceId={vm.settings.instanceId}
        connectionState={vm.connectionState}
        unreadCount={vm.unreadNotificationsCount}
        onOpenNotifications={() => vm.setNotificationsOpen(true)}
        onOpenSettings={() => vm.setSettingsOpen(true)}
        onGoHome={() => {
          vm.setSettingsOpen(false);
          vm.setActiveTab('conversas');
        }}
      />

      {!vm.settingsOpen && (
        <PWAInstallButton variant="top-banner" deviceLabel={vm.settings.deviceLabel} />
      )}

      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        <DesktopSidebar
          activeTab={vm.activeTab}
          onSelectTab={(tab) => {
            vm.setSettingsOpen(false);
            vm.setActiveTab(tab);
          }}
          unreadRadarCount={pendingRadarCount}
          onOpenSettings={() => vm.setSettingsOpen(true)}
        />

        <main className="min-w-0 flex-1 px-4 pb-20 pt-5 sm:px-6 lg:pb-8 lg:pt-6">
          {vm.settingsOpen ? (
            <SettingsView
              settings={vm.settings}
              lastHealthResult={vm.lastHealthResult}
              checkingConnection={vm.connectionState === 'checking'}
              dbDiagnostics={vm.dbDiagnostics}
              dataStoreDiagnostics={vm.dataStoreDiagnostics}
              onUpdateSettings={vm.updateSettings}
              onReconfigureInstallation={vm.reconfigureInstallation}
              onTestConnection={vm.testVpsConnection}
              onResetDatabase={vm.resetLocalDatabase}
              onResetPreferences={vm.resetUserPreferences}
              onClose={() => vm.setSettingsOpen(false)}
            />
          ) : vm.activeTab === 'conversas' ? (
            <ConversationsView
              conversations={vm.conversations}
              selectedConversation={vm.selectedConversation}
              assistants={vm.assistants}
              scheduledTasks={vm.scheduledTasks}
              radarSignals={vm.radarSignals}
              searchQuery={vm.conversationSearch}
              showArchived={vm.showArchivedConversations}
              composerDraft={vm.composerDraft}
              composerFeedback={vm.composerFeedback}
              onSearchChange={vm.setConversationSearch}
              onToggleArchivedFilter={vm.setShowArchivedConversations}
              onSelectConversation={vm.selectConversation}
              onClearSelectedConversationOnMobile={() => {}}
              onArchiveConversation={vm.toggleArchiveConversation}
              onDeleteConversation={vm.deleteConversation}
              onCreateThread={vm.createLocalDemoThread}
              onComposerDraftChange={vm.setComposerDraft}
              onSubmitDraft={vm.submitDraftPhase1}
              onNavigateTab={(tab) => vm.setActiveTab(tab)}
            />
          ) : vm.activeTab === 'artefatos' ? (
            <ArtifactsView
              artifacts={vm.artifacts}
              selectedArtifact={vm.selectedArtifact}
              formatFilter={vm.artifactFormatFilter}
              searchQuery={vm.artifactSearch}
              onFormatFilterChange={vm.setArtifactFormatFilter}
              onSearchChange={vm.setArtifactSearch}
              onSelectArtifact={vm.setSelectedArtifactId}
              onAddArtifact={vm.addLocalArtifact}
              onDeleteArtifact={vm.deleteLocalArtifact}
            />
          ) : vm.activeTab === 'agendados' ? (
            <ScheduledView
              tasks={vm.scheduledTasks}
              onToggleTask={vm.toggleScheduledTask}
              onAddTask={vm.addLocalDemoSchedule}
              onRemoveTask={vm.removeScheduledTask}
            />
          ) : vm.activeTab === 'radar' ? (
            <RadarView
              signals={vm.radarSignals}
              priorityFilter={vm.radarPriorityFilter}
              preferences={vm.radarPrefs}
              onPriorityFilterChange={vm.setRadarPriorityFilter}
              onTogglePreference={vm.toggleRadarPreference}
              onToggleAcknowledge={vm.toggleRadarSignalAcknowledged}
            />
          ) : (
            <ConnectorsView
              connectors={vm.connectors}
              selectedConnector={vm.selectedConnector}
              vpsBaseUrl={vm.settings.vpsBaseUrl}
              requestTimeoutMs={vm.settings.requestTimeoutMs}
              onSelectConnector={vm.setSelectedConnectorId}
              onOpenSettings={() => vm.setSettingsOpen(true)}
            />
          )}
        </main>
      </div>

      {!vm.settingsOpen && (
        <MobileBottomNav
          activeTab={vm.activeTab}
          onSelectTab={(tab) => vm.setActiveTab(tab)}
        />
      )}

      <NotificationsDrawer
        open={vm.notificationsOpen}
        notifications={vm.notifications}
        onClose={() => vm.setNotificationsOpen(false)}
        onMarkRead={vm.markNotificationRead}
        onMarkAllRead={vm.markAllNotificationsRead}
        onNavigateTab={(tab) => {
          vm.setSettingsOpen(false);
          vm.setActiveTab(tab);
        }}
      />

      <OfflineIndicator />
    </div>
  );
}
