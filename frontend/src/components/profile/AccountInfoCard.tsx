import { useState } from 'react'
import type { ProfileDetails } from '../../types/profile'

type AccountInfoCardProps = {
  account: Pick<ProfileDetails, 'name' | 'email' | 'location' | 'memberSince' | 'bio'>
}

const AccountInfoCard = ({ account }: AccountInfoCardProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleVisibility = () => {
    setIsOpen((current) => !current)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
          <p className="text-sm text-slate-500">
            Update your contact details and personal bio to help buyers know you better.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary md:hidden"
          onClick={toggleVisibility}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide' : 'Show'}
          <span aria-hidden="true">▾</span>
        </button>
      </header>
      <div className={`${isOpen ? 'mt-4 flex flex-col gap-4' : 'hidden'} md:mt-4 md:flex md:flex-row md:items-start md:gap-10`}>
        <dl className="space-y-3 text-sm text-slate-600 md:w-1/2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="text-base font-medium text-slate-900">{account.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
            <dd>{account.email}</dd>
          </div>
          {account.location ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
              <dd>{account.location}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member Since</dt>
            <dd>{account.memberSince}</dd>
          </div>
        </dl>
        {account.bio ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:w-1/2">
            <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
            <p className="mt-2 leading-relaxed">{account.bio}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default AccountInfoCard
