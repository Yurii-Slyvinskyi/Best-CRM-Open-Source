import type { FormEvent } from 'react';
import { MessageSquareText, Pencil, Send, Trash2 } from 'lucide-react';
import type { ChatMessage } from '../../../entities/chat';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { FormError } from '../../../shared/ui/form';
import { LoadingState } from '../../../shared/ui/loading-state';
import { cn } from '../../../shared/lib/cn';
import { formatMessageTimestamp } from '../lib/project-detail-helpers';
import { SectionPanel } from './section-panel';

type MessagesPanelProps = {
  hasChatRoom: boolean;
  messages: ChatMessage[];
  currentUsername: string | undefined;
  isLoading: boolean;
  error: string;
  editingMessageId: number | null;
  editMessageDraft: string;
  updatingMessageId: number | null;
  deletingMessageId: number | null;
  messageDraft: string;
  messageFormError: string;
  isSubmitting: boolean;
  onStartEdit: (message: ChatMessage) => void;
  onEditDraftChange: (value: string) => void;
  onCancelEdit: () => void;
  onUpdate: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onDraftChange: (value: string) => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessagesPanel({
  hasChatRoom,
  messages,
  currentUsername,
  isLoading,
  error,
  editingMessageId,
  editMessageDraft,
  updatingMessageId,
  deletingMessageId,
  messageDraft,
  messageFormError,
  isSubmitting,
  onStartEdit,
  onEditDraftChange,
  onCancelEdit,
  onUpdate,
  onDelete,
  onDraftChange,
  onCreateSubmit,
}: MessagesPanelProps) {
  return (
    <SectionPanel icon={MessageSquareText} title="Project messages">
      {!hasChatRoom && (
        <EmptyState
          icon={MessageSquareText}
          title="Project chat room is unavailable"
          description="Messages cannot be loaded because this project does not expose a chat room."
          compact
        />
      )}

      {hasChatRoom && (
        <div className="space-y-4">
          {isLoading && <LoadingState title="Loading messages" compact />}
          {!isLoading && error && (
            <ErrorState title="Unable to load messages" message={error} />
          )}

          {!isLoading && !error && messages.length === 0 && (
            <EmptyState
              icon={MessageSquareText}
              title="No messages yet"
              description="Send the first project message to start the thread."
              compact
            />
          )}

          {!isLoading && !error && messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.sender_username === currentUsername;
                const isEditing = editingMessageId === message.id;
                const isUpdating = updatingMessageId === message.id;
                const isDeletingMessage = deletingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      isOwnMessage ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div className={cn(
                      'max-w-[min(100%,38rem)] rounded-lg border px-3 py-2.5 shadow-sm',
                      isOwnMessage
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50',
                    )}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-950">
                          {message.sender_username}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatMessageTimestamp(message.timestamp)}
                        </p>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editMessageDraft}
                            onChange={(event) => onEditDraftChange(event.target.value)}
                            className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            disabled={isUpdating}
                          />
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={onCancelEdit}
                              disabled={isUpdating}
                              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdate(message)}
                              disabled={isUpdating || !editMessageDraft.trim()}
                              className="inline-flex h-8 items-center rounded-md bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                          {message.content}
                        </p>
                      )}

                      {isOwnMessage && !isEditing && (
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onStartEdit(message)}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(message)}
                            disabled={isDeletingMessage}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {isDeletingMessage ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {messageFormError && <FormError message={messageFormError} />}

          <form className="space-y-3 border-t border-gray-100 pt-4" onSubmit={onCreateSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Message</span>
              <textarea
                value={messageDraft}
                onChange={(event) => onDraftChange(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="Write a project message..."
                disabled={isSubmitting || !hasChatRoom}
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!messageDraft.trim() || isSubmitting || !hasChatRoom}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </SectionPanel>
  );
}
