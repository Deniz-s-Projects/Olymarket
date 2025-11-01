import type { FC } from 'react'
import Groups from './Groups'
import CommunityDiscussions from './CommunityDiscussions'

const Community: FC = () => {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community hub</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Discover local groups, plan meetups, and jump into marketplace conversations all in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Groups variant="embedded" />
        <CommunityDiscussions variant="embedded" />
      </div>
    </div>
  )
}

export default Community
