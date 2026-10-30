import React, { useState } from 'react';
import { Check, Save, Trash2, UserRound, Users } from 'lucide-react';
import { SavedCareProfile } from '../../shared/types';

interface Props {
  profiles: SavedCareProfile[];
  activeProfileId: string | null;
  currentName: string;
  storageEnabled: boolean;
  onSave: (label: string) => void;
  onSelect: (profile: SavedCareProfile) => void;
  onDelete: (id: string) => void;
}

export const ProfileManager: React.FC<Props> = ({
  profiles,
  activeProfileId,
  currentName,
  storageEnabled,
  onSave,
  onSelect,
  onDelete,
}) => {
  const [label, setLabel] = useState('');

  return (
    <section className="loam-card p-5 md:p-7" aria-labelledby="profiles-heading">
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-6 w-6 shrink-0 text-plum-600 dark:text-plum-300" aria-hidden="true" />
        <div>
          <h2 id="profiles-heading" className="font-serif text-2xl font-semibold text-loam-ink dark:text-parchment-50">
            Loved ones and residents
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-loam-body dark:text-loam-body-dark">
            Save a separate cultural profile for each person, then switch without retyping their interests, comfort choices, or exclusions.
          </p>
        </div>
      </div>

      {!storageEnabled ? (
        <p className="mt-4 rounded-xl border border-brass-300 bg-brass-50 px-4 py-3 text-sm text-brass-900 dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-brass-200">
          Turn on “Remember this family on this device” in Preferences before saving profiles. This is off by default on shared devices.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm font-semibold text-loam-ink dark:text-parchment-50">
            Profile label
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={`${currentName || 'Loved one'} — music and familiar things`}
              className="mt-2 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onSave(label.trim() || `${currentName || 'Loved one'}’s profile`);
              setLabel('');
            }}
            className="loam-btn-primary shrink-0 text-sm"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save current profile
          </button>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const active = profile.id === activeProfileId;
            return (
              <div key={profile.id} className="rounded-2xl border border-parchment-300 bg-parchment-50 p-4 dark:border-vinyl-700 dark:bg-vinyl-900">
                <div className="flex items-start gap-2">
                  <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-plum-600 dark:text-plum-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-loam-ink dark:text-parchment-50">{profile.label}</p>
                    <p className="mt-1 text-xs text-loam-muted dark:text-loam-muted-dark">
                      {profile.guardrails.elderName} · {profile.elderClues.slice(0, 2).map((clue) => clue.name).join(', ') || 'No interests added'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(profile)}
                    className="loam-btn-secondary flex-1 text-sm"
                    aria-current={active ? 'true' : undefined}
                  >
                    {active && <Check className="h-4 w-4" aria-hidden="true" />}
                    {active ? 'Current profile' : 'Switch profile'}
                  </button>
                  <button type="button" onClick={() => onDelete(profile.id)} className="loam-btn-quiet" aria-label={`Delete ${profile.label}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
