import { FormEvent, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import {
  deleteProjectBlueprint,
  resolveMediaUrl,
  uploadProjectBlueprint,
  type Project,
} from '../../../entities/project';
import type { UserRole } from '../../../entities/user';
import { ApiError } from '../../../shared/api';

type ProjectBlueprintSectionProps = {
  projectId: string | number;
  projectName: string;
  blueprint: string | null;
  role: UserRole;
  onUpdated: (project: Project) => void;
  onDeleted: () => void;
};

function getBlueprintFilename(value: string | null) {
  if (!value) {
    return 'Project drawing.pdf';
  }

  const cleanValue = value.split('?')[0].split('#')[0];
  const filename = cleanValue.substring(cleanValue.lastIndexOf('/') + 1);

  if (!filename) {
    return 'Project drawing.pdf';
  }

  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

function validatePdfFile(file: File | null) {
  if (!file) {
    return 'Choose a PDF drawing first.';
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Drawing must be a PDF file.';
  }

  if (file.type && file.type !== 'application/pdf') {
    return 'Drawing file content type must be application/pdf.';
  }

  return '';
}

function getBlueprintError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.details && typeof err.details === 'object' && 'blueprint' in err.details) {
      const details = err.details as Record<string, unknown>;
      const blueprintError = details.blueprint;

      if (Array.isArray(blueprintError)) {
        return blueprintError.join(' ');
      }

      if (typeof blueprintError === 'string') {
        return blueprintError;
      }
    }

    return err.message;
  }

  return 'Drawing could not be updated. Please try again.';
}

export function ProjectBlueprintSection({
  projectId,
  projectName,
  blueprint,
  role,
  onUpdated,
  onDeleted,
}: ProjectBlueprintSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blueprintUrl = resolveMediaUrl(blueprint);
  const filename = useMemo(() => getBlueprintFilename(blueprint), [blueprint]);
  const isManager = role === 'manager';

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = selectedFile;

    if (!file) {
      setError('Choose a drawing PDF first.');
      setSuccess('');
      return;
    }

    const validationError = validatePdfFile(file);

    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const updatedProject = await uploadProjectBlueprint(projectId, file);
      onUpdated(updatedProject);
      setSelectedFile(null);
      setSuccess(blueprint ? 'Drawing PDF replaced.' : 'Drawing PDF uploaded.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(getBlueprintError(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete drawing PDF for "${projectName}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteProjectBlueprint(projectId);
      onDeleted();
      setSelectedFile(null);
      setSuccess('Drawing PDF deleted.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(getBlueprintError(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText className="h-[18px] w-[18px] shrink-0 text-gray-500" aria-hidden="true" />
          <h2 className="truncate text-[14.5px] font-semibold text-gray-950">PDF drawing</h2>
        </div>
        <span className="shrink-0 text-xs text-gray-400">PDF</span>
      </div>

      <div className="space-y-4 p-5">
        {success && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-[12.5px] font-medium text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />

            {success}
          </div>
        )}

        {blueprintUrl ? (
          <div className="flex items-center gap-3.5 rounded-md border border-gray-200 bg-gray-50/60 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-gray-950">{filename}</p>
              <p className="mt-0.5 text-xs text-gray-400">PDF drawing</p>
            </div>
            <a
              href={blueprintUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-700 px-3.5 text-[13px] font-semibold text-white transition hover:bg-blue-800"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open
            </a>
          </div>
        ) : (
          !isManager && (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50/60 p-4 text-[13.5px] text-gray-400">
              <FileText className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
              No PDF drawing has been uploaded for this project yet.
            </div>
          )
        )}

        {isManager && (
          <form className="space-y-3 rounded-md border border-dashed border-gray-300 bg-gray-50/60 p-4" onSubmit={handleUpload}>
            <label className="block">
              <span className="text-[13px] font-semibold text-gray-700">
                {blueprintUrl ? 'Replace PDF drawing' : 'Upload PDF drawing'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setError('');
                  setSuccess('');
                }}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-700"
              />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {isUploading ? 'Saving…' : blueprintUrl ? 'Replace PDF' : 'Upload PDF'}
              </button>

              {blueprintUrl && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
