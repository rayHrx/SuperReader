import { Metadata } from 'next';
import SignUp from '@/components/auth/SignUp';

export const metadata: Metadata = {
  title: 'Sign Up - SpeedReader',
  description: 'Create your SpeedReader account',
};

export default function SignUpPage() {
  return <SignUp />;
}