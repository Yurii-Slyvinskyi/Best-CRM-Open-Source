import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, FolderKanban } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteProject,
  getProject,
  updateProject,
  type Project,
  type ProjectFormPayload,
} from '../../entities/project';
import {
  createChatMessage,
  deleteChatMessage,
  getChatMessagesByRoom,
  updateChatMessage,
  type ChatMessage,
} from '../../entities/chat';
import { getPayments, type Payment } from '../../entities/finance';
import {
  createReview,
  deleteReview,
  getReviews,
  updateReview,
  type Review,
  type ReviewRating,
} from '../../entities/review';
import { getTeams, type Team } from '../../entities/team';
import { getUsers, hasRole, type UserProfile } from '../../entities/user';
import { getWorklogsByProject, type Worklog } from '../../entities/worklog';
import { useAuth } from '../../features/auth';
import { ProjectBlueprintSection } from '../../features/project-blueprint';
import { ProjectForm } from '../../features/project-form';
import { ProjectStatusUpdate } from '../../features/update-project-status';
import { getApiErrorMessage } from '../../shared/api';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { FormError } from '../../shared/ui/form';
import { LoadingState } from '../../shared/ui/loading-state';
import { Modal } from '../../shared/ui/modal';
import { PageShell } from '../../shared/ui/page-shell';
import { getMessageTimestampValue } from './lib/project-detail-helpers';
import { BudgetPanel } from './ui/budget-panel';
import { FinancePanel } from './ui/finance-panel';
import { MessagesPanel } from './ui/messages-panel';
import { OverviewPanel } from './ui/overview-panel';
import { PeopleCompanyPanel } from './ui/people-company-panel';
import { ReviewPanel } from './ui/review-panel';
import { SummaryHeader } from './ui/summary-header';
import { WorklogsPanel } from './ui/worklogs-panel';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [isWorklogsLoading, setIsWorklogsLoading] = useState(false);
  const [worklogsError, setWorklogsError] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewRating, setReviewRating] = useState<ReviewRating>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFormError, setReviewFormError] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isReviewDeleting, setIsReviewDeleting] = useState(false);
  const [isReviewEditing, setIsReviewEditing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [messageFormError, setMessageFormError] = useState('');
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageDraft, setEditMessageDraft] = useState('');
  const [updatingMessageId, setUpdatingMessageId] = useState<number | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      setError('Project id is missing from the route.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Project could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      hasRole(user, 'manager') ? getUsers() : Promise.resolve([]),
      getTeams(),
    ])
      .then(([usersResult, teamsResult]) => {
        if (!isMounted) {
          return;
        }

        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value);
        }

        if (teamsResult.status === 'fulfilled') {
          setTeams(teamsResult.value);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!project || !hasRole(user, ['manager', 'worker'])) {
      setWorklogs([]);
      setWorklogsError('');
      setIsWorklogsLoading(false);
      return;
    }

    let isMounted = true;

    setIsWorklogsLoading(true);
    setWorklogsError('');

    getWorklogsByProject(project.id)
      .then((data) => {
        if (isMounted) {
          setWorklogs(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setWorklogsError(getApiErrorMessage(err, 'Project worklogs could not be loaded.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsWorklogsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [project, user?.role]);

  useEffect(() => {
    if (!project || !hasRole(user, ['manager', 'client'])) {
      setPayments([]);
      setPaymentsError('');
      setIsPaymentsLoading(false);
      return;
    }

    let isMounted = true;

    setIsPaymentsLoading(true);
    setPaymentsError('');

    getPayments()
      .then((data) => {
        if (isMounted) {
          setPayments(data.filter((payment) => payment.project === project.id));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPaymentsError(getApiErrorMessage(err, 'Project payments could not be loaded.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPaymentsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [project, user?.role]);

  useEffect(() => {
    if (!project) {
      setReviews([]);
      setReviewsError('');
      setIsReviewsLoading(false);
      return;
    }

    let isMounted = true;

    setIsReviewsLoading(true);
    setReviewsError('');

    getReviews()
      .then((data) => {
        if (isMounted) {
          setReviews(data.filter((review) => review.project === project.id));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setReviewsError(getApiErrorMessage(err, 'Project reviews could not be loaded.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReviewsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [project]);

  useEffect(() => {
    if (!project) {
      setMessages([]);
      setMessagesError('');
      setIsMessagesLoading(false);
      return;
    }

    if (!project.chat_room) {
      setMessages([]);
      setMessagesError('');
      setIsMessagesLoading(false);
      return;
    }

    let isMounted = true;

    setIsMessagesLoading(true);
    setMessagesError('');

    getChatMessagesByRoom(project.chat_room)
      .then((data) => {
        if (isMounted) {
          setMessages(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMessagesError(getApiErrorMessage(err, 'Project messages could not be loaded.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsMessagesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [project]);

  async function handleUpdateProject(payload: ProjectFormPayload) {
    if (!project) {
      return;
    }

    const updatedProject = await updateProject(project.id, payload);
    setProject(updatedProject);
    setIsEditOpen(false);
    setNotice('Project updated.');
    setDeleteError('');
  }

  async function handleDeleteProject() {
    if (!project) {
      return;
    }

    if (project.status === 'completed') {
      setDeleteError('Completed projects cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(`Delete project "${project.name}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    setNotice('');

    try {
      await deleteProject(project.id);
      navigate('/projects', { replace: true });
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Project could not be deleted. Please try again.'));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    setIsReviewSubmitting(true);
    setReviewFormError('');

    try {
      const createdReview = await createReview({
        project: project.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviews((currentReviews) => [
        createdReview,
        ...currentReviews.filter((review) => review.id !== createdReview.id),
      ]);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setReviewFormError(getApiErrorMessage(err, 'Review could not be created. Please try again.'));
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  async function handleUpdateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectReview) {
      return;
    }

    setIsReviewSubmitting(true);
    setReviewFormError('');

    try {
      const updatedReview = await updateReview(projectReview.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviews((currentReviews) => (
        currentReviews.map((review) => (
          review.id === updatedReview.id ? updatedReview : review
        ))
      ));
      setIsReviewEditing(false);
    } catch (err) {
      setReviewFormError(getApiErrorMessage(err, 'Review could not be updated. Please try again.'));
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  async function handleDeleteReview() {
    if (!projectReview) {
      return;
    }

    const confirmed = window.confirm('Delete this review?');

    if (!confirmed) {
      return;
    }

    setIsReviewDeleting(true);
    setReviewFormError('');

    try {
      await deleteReview(projectReview.id);
      setReviews((currentReviews) => (
        currentReviews.filter((review) => review.id !== projectReview.id)
      ));
      setIsReviewEditing(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setReviewFormError(getApiErrorMessage(err, 'Review could not be deleted. Please try again.'));
    } finally {
      setIsReviewDeleting(false);
    }
  }

  function startEditReview() {
    if (!projectReview) {
      return;
    }

    setIsReviewEditing(true);
    setReviewRating(projectReview.rating);
    setReviewComment(projectReview.comment || '');
    setReviewFormError('');
  }

  function cancelEditReview() {
    if (!projectReview) {
      return;
    }

    setIsReviewEditing(false);
    setReviewFormError('');
    setReviewRating(projectReview.rating);
    setReviewComment(projectReview.comment || '');
  }

  function changeReviewRating(rating: ReviewRating) {
    setReviewRating(rating);
    setReviewFormError('');
  }

  function changeReviewComment(comment: string) {
    setReviewComment(comment);
    setReviewFormError('');
  }

  async function handleCreateMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project?.chat_room || !messageDraft.trim()) {
      return;
    }

    setIsMessageSubmitting(true);
    setMessageFormError('');

    try {
      const createdMessage = await createChatMessage({
        room: project.chat_room,
        content: messageDraft.trim(),
      });

      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setMessageDraft('');
    } catch (err) {
      setMessageFormError(getApiErrorMessage(err, 'Message could not be sent. Please try again.'));
    } finally {
      setIsMessageSubmitting(false);
    }
  }

  async function handleUpdateMessage(message: ChatMessage) {
    if (!editMessageDraft.trim()) {
      return;
    }

    setUpdatingMessageId(message.id);
    setMessageFormError('');

    try {
      const updatedMessage = await updateChatMessage(message.id, {
        content: editMessageDraft.trim(),
      });

      setMessages((currentMessages) => (
        currentMessages.map((currentMessage) => (
          currentMessage.id === updatedMessage.id ? updatedMessage : currentMessage
        ))
      ));
      setEditingMessageId(null);
      setEditMessageDraft('');
    } catch (err) {
      setMessageFormError(getApiErrorMessage(err, 'Message could not be updated. Please try again.'));
    } finally {
      setUpdatingMessageId(null);
    }
  }

  async function handleDeleteMessage(message: ChatMessage) {
    const confirmed = window.confirm('Delete this message?');

    if (!confirmed) {
      return;
    }

    setDeletingMessageId(message.id);
    setMessageFormError('');

    try {
      await deleteChatMessage(message.id);
      setMessages((currentMessages) => (
        currentMessages.filter((currentMessage) => currentMessage.id !== message.id)
      ));
      if (editingMessageId === message.id) {
        setEditingMessageId(null);
        setEditMessageDraft('');
      }
    } catch (err) {
      setMessageFormError(getApiErrorMessage(err, 'Message could not be deleted. Please try again.'));
    } finally {
      setDeletingMessageId(null);
    }
  }

  function startEditMessage(message: ChatMessage) {
    setEditingMessageId(message.id);
    setEditMessageDraft(message.content);
    setMessageFormError('');
  }

  function changeEditMessageDraft(value: string) {
    setEditMessageDraft(value);
    setMessageFormError('');
  }

  function cancelEditMessage() {
    setEditingMessageId(null);
    setEditMessageDraft('');
    setMessageFormError('');
  }

  function changeMessageDraft(value: string) {
    setMessageDraft(value);
    setMessageFormError('');
  }

  const canViewBudget = hasRole(user, ['manager', 'client']);
  const canViewWorklogs = hasRole(user, ['manager', 'worker']);
  const canViewFinance = hasRole(user, ['manager', 'client']);
  const clientLabel = project
    ? users.find((currentUser) => currentUser.id === project.client)?.username
      ?? (user?.id === project.client ? user.username : `Client #${project.client}`)
    : '';
  const companyLabel = project
    ? user?.company || `Company #${project.company}`
    : '';
  const teamLabel = project
    ? project.assigned_team
      .map((teamId) => teams.find((team) => team.id === teamId)?.name ?? `Team #${teamId}`)
      .join(', ') || 'None'
    : '';
  const projectReview = reviews[0];
  const canManageReview = Boolean(user?.role === 'client' && project && user.id === project.client);
  const sortedMessages = [...messages].sort((firstMessage, secondMessage) => (
    getMessageTimestampValue(firstMessage) - getMessageTimestampValue(secondMessage)
  ));

  return (
    <PageShell
      eyebrow="CRM PROJECT"
      title={project ? project.name : 'Project Detail'}
      subtitle="Project overview with teams, finance, drawings, and workspace activity."
    >
      {isLoading && <LoadingState title="Loading project" />}

      {!isLoading && error && (
        <ErrorState
          title="Unable to load project"
          message={error}
          action={(
            <Link to="/projects" className="inline-flex text-sm font-semibold text-red-800 underline">
              Back to projects
            </Link>
          )}
        />
      )}

      {!isLoading && !error && !project && (
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="This project is not available in your current backend scope."
        />
      )}

      {!isLoading && !error && project && (
        <>
          {notice && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              {notice}
            </div>
          )}

          {deleteError && <FormError message={deleteError} />}

          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            Back to projects
          </Link>

          <SummaryHeader
            project={project}
            user={user}
            isDeleting={isDeleting}
            onEdit={() => {
              setNotice('');
              setDeleteError('');
              setIsEditOpen(true);
            }}
            onDelete={handleDeleteProject}
          />

          {/* ===== Two-column grid ===== */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)] xl:items-start">
            {/* LEFT COLUMN */}
            <div className="grid min-w-0 content-start gap-5">
              <OverviewPanel project={project} />

              {user && (
                <ProjectBlueprintSection
                  projectId={project.id}
                  projectName={project.name}
                  blueprint={project.blueprint}
                  role={user.role}
                  onUpdated={(updatedProject) => {
                    setProject(updatedProject);
                    setNotice('');
                    setDeleteError('');
                  }}
                  onDeleted={() => {
                    setProject((currentProject) => (
                      currentProject ? { ...currentProject, blueprint: null } : currentProject
                    ));
                    setNotice('');
                    setDeleteError('');
                  }}
                />
              )}

              {canViewWorklogs && (
                <WorklogsPanel
                  worklogs={worklogs}
                  users={users}
                  teams={teams}
                  isLoading={isWorklogsLoading}
                  error={worklogsError}
                />
              )}

              {canViewFinance && (
                <FinancePanel
                  payments={payments}
                  isLoading={isPaymentsLoading}
                  error={paymentsError}
                />
              )}

              <ReviewPanel
                review={projectReview}
                canManageReview={canManageReview}
                isLoading={isReviewsLoading}
                error={reviewsError}
                isEditing={isReviewEditing}
                rating={reviewRating}
                comment={reviewComment}
                formError={reviewFormError}
                isSubmitting={isReviewSubmitting}
                isDeleting={isReviewDeleting}
                onRatingChange={changeReviewRating}
                onCommentChange={changeReviewComment}
                onCreateSubmit={handleCreateReview}
                onUpdateSubmit={handleUpdateReview}
                onStartEdit={startEditReview}
                onCancelEdit={cancelEditReview}
                onDelete={handleDeleteReview}
              />

              <MessagesPanel
                hasChatRoom={Boolean(project.chat_room)}
                messages={sortedMessages}
                currentUsername={user?.username}
                isLoading={isMessagesLoading}
                error={messagesError}
                editingMessageId={editingMessageId}
                editMessageDraft={editMessageDraft}
                updatingMessageId={updatingMessageId}
                deletingMessageId={deletingMessageId}
                messageDraft={messageDraft}
                messageFormError={messageFormError}
                isSubmitting={isMessageSubmitting}
                onStartEdit={startEditMessage}
                onEditDraftChange={changeEditMessageDraft}
                onCancelEdit={cancelEditMessage}
                onUpdate={handleUpdateMessage}
                onDelete={handleDeleteMessage}
                onDraftChange={changeMessageDraft}
                onCreateSubmit={handleCreateMessage}
              />
            </div>

            {/* RIGHT RAIL */}
            <aside className="grid min-w-0 content-start gap-5">
              {hasRole(user, 'worker') && (
                <ProjectStatusUpdate
                  projectId={project.id}
                  currentStatus={project.status}
                  onUpdated={(updatedProject) => {
                    setProject(updatedProject);
                    setNotice('');
                    setDeleteError('');
                  }}
                />
              )}

              <PeopleCompanyPanel
                clientLabel={clientLabel}
                companyLabel={companyLabel}
                teamLabel={teamLabel}
                assignedTeam={project.assigned_team}
              />

              {canViewBudget && (
                <BudgetPanel
                  budget={project.budget}
                  payments={payments}
                  isPaymentsLoading={isPaymentsLoading}
                />
              )}

              {hasRole(user, 'worker') && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
                  <Eye className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
                  <span className="text-[12.5px] leading-relaxed text-gray-400">
                    Budget &amp; finance are not visible to workers.
                  </span>
                </div>
              )}
            </aside>
          </div>

          {isEditOpen && (
            <Modal size="3xl">
              <ProjectForm
                mode="edit"
                project={project}
                onSubmit={handleUpdateProject}
                onCancel={() => setIsEditOpen(false)}
              />
            </Modal>
          )}
        </>
      )}
    </PageShell>
  );
}
