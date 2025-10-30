import AccountInfoCard from '../components/profile/AccountInfoCard'
import ListingTable from '../components/profile/ListingTable'
import PreferenceToggleList from '../components/profile/PreferenceToggleList'
import ProfileHeader from '../components/profile/ProfileHeader'
import SavedItemsCard from '../components/profile/SavedItemsCard'
import type {
  ProfileAccountInfo,
  ProfileListingSummary,
  ProfileMetric,
  ProfilePreferenceToggle,
  ProfileSavedItemSummary,
} from '../types/profile'

const account: ProfileAccountInfo = {
  name: 'Jamie Lawson',
  email: 'jamie.lawson@example.com',
  location: 'Seattle, WA',
  memberSince: 'January 2021',
  bio: 'Weekend warrior and outdoor gear collector. I list items that still have plenty of adventures left in them.',
}

const metrics: ProfileMetric[] = [
  { label: 'Active Listings', value: 6 },
  { label: 'Items Sold', value: 42 },
  { label: 'Response Rate', value: '98%' },
  { label: 'Avg. Rating', value: '4.9/5' },
]

const activeListings: ProfileListingSummary[] = [
  {
    id: 'listing-1',
    title: 'Carbon Road Bike - Medium Frame',
    category: 'Cycling',
    price: 1450,
    currency: '$',
    status: 'active',
    updatedAt: '2 days ago',
  },
  {
    id: 'listing-2',
    title: 'Climbing Protection Set (12 pcs)',
    category: 'Climbing',
    price: 260,
    currency: '$',
    status: 'active',
    updatedAt: '5 days ago',
  },
  {
    id: 'listing-3',
    title: 'Camping Cookware Kit',
    category: 'Camping',
    price: 75,
    currency: '$',
    status: 'draft',
    updatedAt: '1 hour ago',
  },
]

const savedItems: ProfileSavedItemSummary[] = [
  {
    id: 'saved-1',
    title: 'Trail Running Backpack',
    category: 'Running',
    price: 95,
    currency: '$',
    favoritedAt: '3 days ago',
  },
  {
    id: 'saved-2',
    title: 'Inflatable Paddle Board',
    category: 'Water Sports',
    price: 320,
    currency: '$',
    favoritedAt: '1 week ago',
  },
]

const preferenceToggles: ProfilePreferenceToggle[] = [
  {
    id: 'notifications-email',
    label: 'Email Updates',
    description: 'Receive a summary of new messages, offers, and shipping updates via email.',
    enabled: true,
  },
  {
    id: 'notifications-sms',
    label: 'SMS Alerts',
    description: 'Get a text message when buyers send new offers or questions.',
    enabled: false,
  },
  {
    id: 'notifications-push',
    label: 'Push Notifications',
    description: 'Be alerted instantly when an item sells or requires your attention.',
    enabled: true,
  },
]

const Profile = () => {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:px-0">
      <ProfileHeader
        account={account}
        metrics={metrics}
        actions={
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Create Listing
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <AccountInfoCard account={account} />
          <ListingTable
            listings={activeListings}
            title="Active Listings"
            emptyMessage="You do not have any listings yet. Start by creating your first listing."
          />
        </div>
        <div className="flex flex-col gap-6">
          <SavedItemsCard items={savedItems} />
          <PreferenceToggleList preferences={preferenceToggles} />
        </div>
      </div>
    </section>
  )
}

export default Profile
