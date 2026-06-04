import { redirect } from 'next/navigation';
import { clearAdminSession, isTrustedAdminRequest } from '../../../lib/auth';

export async function POST(request) {
  if (!isTrustedAdminRequest(request)) {
    redirect('/admin');
  }

  clearAdminSession();
  redirect('/admin');
}
