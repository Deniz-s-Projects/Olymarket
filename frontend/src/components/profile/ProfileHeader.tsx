import type { FC, ReactNode } from 'react'
import type { ProfileAccountInfo, ProfileMetric } from '../../types/profile'

type ProfileHeaderProps = {
  account: ProfileAccountInfo
  metrics?: ProfileMetric[]
  actions?: ReactNode
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ account, metrics = [], actions }) => {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900">{account.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{account.email}</p>
          {account.location ? (
            <p className="text-sm text-slate-600">Located in {account.location}</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-500">Member since {account.memberSince}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {account.bio ? (
        <p className="mt-4 max-w-2xl text-sm text-slate-600">{account.bio}</p>
      ) : null}
      {metrics.length > 0 ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {metric.label}
              </dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  )
}

export default ProfileHeader
