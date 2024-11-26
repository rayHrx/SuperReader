import { Metadata } from 'next';
import Account from '@/components/Account';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Account - SpeedReader',
  description: 'Manage your SpeedReader account settings',
};

export default function AccountPage() {
  return (
    <Layout>
      <Account />
    </Layout>
  );
}