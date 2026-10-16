import AccountPageBody from './AccountPageBody'

export default function AccountPage({ title = 'Account settings', showDeletion = false }) {
  return <AccountPageBody title={title} showDeletion={showDeletion} />
}

