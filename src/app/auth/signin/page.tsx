import { Metadata } from 'next';
import SignIn from '@/components/auth/SignIn';

export const metadata: Metadata = {
  title: 'Sign In - SpeedReader',
  description: 'Sign in to your SpeedReader account',
};

export default function SignInPage() {
  return <SignIn />;
}