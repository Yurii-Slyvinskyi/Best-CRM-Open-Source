import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  type UserProfile,
  type UserProfileUpdatePayload,
} from '../../entities/user';
import { useAuth } from '../../features/auth';
import { getApiErrorMessage } from '../../shared/api';
import { roleLabels } from '../../shared/config/roles';
import { ErrorState } from '../../shared/ui/error-state';
import { FormActions, FormError } from '../../shared/ui/form';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';

type ProfileFormValues = {
  username: string;
  email: string;
  phone: string;
  address: string;
};

function getProfileInitialValues(profile: UserProfile | null): ProfileFormValues {
  return {
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
  };
}

function buildProfilePayload(values: ProfileFormValues): UserProfileUpdatePayload {
  return {
    username: values.username.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
  };
}

export function ProfilePage() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileValues, setProfileValues] = useState<ProfileFormValues>(() => getProfileInitialValues(null));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setProfileValues(getProfileInitialValues(data));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Profile could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function updateProfileField(field: keyof ProfileFormValues, value: string) {
    setProfileValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateProfile() {
    if (!profileValues.username.trim()) {
      return 'Username is required.';
    }

    if (!profileValues.email.trim()) {
      return 'Email is required.';
    }

    return '';
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateProfile();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError('');
    setNotice('');

    try {
      const updatedProfile = await updateCurrentUserProfile(buildProfilePayload(profileValues));
      setProfile(updatedProfile);
      setProfileValues(getProfileInitialValues(updatedProfile));
      await refreshProfile();
      setNotice('Profile updated.');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Profile could not be updated.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="MY PROFILE"
      title="Profile"
      subtitle="Update your username, email, phone, and address. Role and company are managed by the backend."
    >
      {isLoading && (
        <LoadingState title="Loading profile" description="Fetching your profile details." />
      )}

      {!isLoading && loadError && (
        <ErrorState title="Unable to load profile" message={loadError} />
      )}

      {!isLoading && !loadError && (
        <section className="rounded-lg border border-gray-300 bg-white p-5 shadow-md">
          <div className="border-b border-gray-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">My profile</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-950">{profile?.username ?? 'Current user'}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Role and company are read-only because the backend owns those fields.
            </p>
          </div>

          {notice && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
              {notice}
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleProfileSubmit}>
            {formError && <FormError message={formError} />}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Username</span>
                <input
                  value={profileValues.username}
                  onChange={(event) => updateProfileField('username', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  value={profileValues.email}
                  onChange={(event) => updateProfileField('email', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  type="email"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  value={profileValues.phone}
                  onChange={(event) => updateProfileField('phone', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Address</span>
                <input
                  value={profileValues.address}
                  onChange={(event) => updateProfileField('address', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Role</p>
                <p className="mt-2 text-sm font-semibold text-gray-950">
                  {profile ? roleLabels[profile.role] : 'Not available'}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Company</p>
                <p className="mt-2 text-sm font-semibold text-gray-950">{profile?.company ?? 'Not assigned'}</p>
              </div>
            </div>

            <FormActions
              submitLabel="Save profile"
              submitPendingLabel="Saving..."
              isSubmitting={isSaving}
            />
          </form>
        </section>
      )}
    </PageShell>
  );
}
