import { useState, type FC } from 'react'
import { createReport } from '../services/reports'
import { useAuth } from '../context/useAuth'

type Props = {
  reportType: 'listing' | 'user'
  targetId: string
  targetTitle: string
  onClose: () => void
  onSuccess: () => void
}

const REPORT_REASONS = {
  listing: [
    'Inappropriate or offensive content',
    'Scam or fraudulent listing',
    'Duplicate listing',
    'Wrong category',
    'Prohibited item',
    'Other',
  ],
  user: [
    'Harassment or abusive behavior',
    'Spam or scam activity',
    'Impersonation',
    'Inappropriate profile content',
    'Other',
  ],
}

const ReportModal: FC<Props> = ({ reportType, targetId, targetTitle, onClose, onSuccess }) => {
  const { token } = useAuth()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!reason) {
      setError('Please select a reason')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        reportType,
        reason,
        description: description.trim() || undefined,
        ...(reportType === 'listing'
          ? { reportedListingId: targetId }
          : { reportedUserId: targetId }),
      }

      await createReport(payload, token)
      onSuccess()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit report. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const reasons = REPORT_REASONS[reportType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Report {reportType === 'listing' ? 'Listing' : 'User'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Reporting: <span className="font-medium">{targetTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for report <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
              disabled={isSubmitting}
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Provide any additional context..."
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportModal
