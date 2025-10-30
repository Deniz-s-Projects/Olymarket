import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ProfileAccountInfo } from '../../types/profile'

type AccountInfoCardProps = {
  account?: ProfileAccountInfo | null
  isLoading?: boolean
  actions?: ReactNode
}

const AccountInfoCard = ({ account, isLoading = false, actions }: AccountInfoCardProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleVisibility = () => {
    setIsOpen((current) => !current)
  }

  const renderValue = (value: string | undefined, placeholder: string) => {
    if (value && value.trim().length > 0) {
      return value
    }

    return placeholder
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
          <p className="text-sm text-slate-500">
            Update your contact details and personal bio to help buyers know you better.
          </p>
        </div>
        <div className="flex items-center gap-2 md:self-start">
          {actions ? <div className="hidden md:flex md:gap-2">{actions}</div> : null}
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary md:hidden"
            onClick={toggleVisibility}
            aria-expanded={isOpen}
          >
            {isOpen ? 'Hide' : 'Show'}
            <span aria-hidden="true">▾</span>
          </button>
        </div>
      </header>
      {actions ? <div className="mt-4 flex flex-wrap gap-2 md:hidden">{actions}</div> : null}
      <div
        className={`${
          isOpen ? 'mt-4 flex flex-col gap-4' : 'hidden'
        } md:mt-4 md:flex md:flex-row md:items-start md:gap-10`}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading your account information…</p>
        ) : account ? (
          <>
            <dl className="space-y-3 text-sm text-slate-600 md:w-1/2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
                <dd className="text-base font-medium text-slate-900">
                  {renderValue(account.name, 'Not provided yet')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                <dd>{renderValue(account.email, 'Not provided yet')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
                <dd>{renderValue(account.location, 'Not provided yet')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member Since</dt>
                <dd>{renderValue(account.memberSince, 'Not available yet')}</dd>
              </div>
            </dl>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:w-1/2">
              <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
              <p className="mt-2 leading-relaxed">
                {renderValue(
                  account.bio,
                  'You have not added a bio yet. Share a short introduction to help other members get to know you.',
                )}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Set up your account details to help buyers learn more about who you are.
          </p>
        )}
      </div>
    </section>
  )
}

export default AccountInfoCard
