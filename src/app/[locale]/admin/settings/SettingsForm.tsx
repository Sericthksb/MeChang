'use client'

import { useActionState } from 'react'
import { updateSettings } from './actions'
import type { PlatformSettings } from '@/types/database'

type ActionState = { error: string } | { success: true } | null

export default function SettingsForm({ settings }: { settings: PlatformSettings | null }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateSettings, null)

  return (
    <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {state && 'error' in state && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state && 'success' in state && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Settings saved successfully.
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="lead_fee_satang" className="block text-sm font-medium text-gray-700">
            Lead Fee (satang)
          </label>
          <p className="mt-0.5 text-xs text-gray-400">Amount charged per lead in satang. 7500 = ฿75.</p>
          <input
            id="lead_fee_satang"
            name="lead_fee_satang"
            type="number"
            min="0"
            defaultValue={settings?.lead_fee_satang ?? 7500}
            className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label htmlFor="featured_slot_limit" className="block text-sm font-medium text-gray-700">
            Featured Slot Limit
          </label>
          <p className="mt-0.5 text-xs text-gray-400">Max number of active featured providers at one time.</p>
          <input
            id="featured_slot_limit"
            name="featured_slot_limit"
            type="number"
            min="1"
            defaultValue={settings?.featured_slot_limit ?? 10}
            className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Platform Status</label>
          <p className="mt-0.5 text-xs text-gray-400">When off, non-admin users see a maintenance page.</p>
          <div className="mt-2 flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="platform_active"
                value="true"
                defaultChecked={settings?.platform_active !== false}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="platform_active"
                value="false"
                defaultChecked={settings?.platform_active === false}
              />
              Maintenance mode
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
