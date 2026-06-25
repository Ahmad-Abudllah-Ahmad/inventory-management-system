import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  // Check if user is authenticated via either auth-token or session-token
  const authToken = cookies().get('auth-token')?.value || cookies().get('session-token')?.value
  
  if (authToken) {
    // Redirect authenticated users to dashboard
    redirect('/dashboard')
  } else {
    // Redirect unauthenticated users to login
    redirect('/auth/login')
  }
}
