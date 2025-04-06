'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/app/lib/session'; // Import useSession

// Remove the User interface here if it's defined globally or in session.ts

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Use the session hook provided by SessionProvider
  const { user, loading: sessionLoading } = useSession(); // Use the hook
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // REMOVE the useEffect that fetches /api/auth/me independently

  // Add effect to handle redirection based on session state from the hook
  useEffect(() => {
    if (!sessionLoading) { // Wait for the session check to complete
      if (!user) {
        // Not logged in, redirect to login
        console.log('ProtectedLayout: No user found, redirecting to login.');
        router.push('/login');
      } else {
        // User is logged in, check for MBTI completion if they are a STUDENT
        // Note: The `user` object from useSession might need profile details.
        // Adjust this logic based on the actual shape of `user` from useSession.
        // You might need to fetch the profile separately if not included in the session hook's user object.
        const fetchProfileAndCheckMbti = async () => {
          try {
            const profileRes = await fetch('/api/profile');
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (user.role === 'STUDENT' && profileData.profile && !profileData.profile.mbtiCompleted && pathname !== '/mbti-assessment') {
                console.log('ProtectedLayout: MBTI not complete, redirecting to assessment.');
                router.push('/mbti-assessment');
              }
            } else {
              console.error("ProtectedLayout: Failed to fetch profile for MBTI check");
            }
          } catch (err) {
            console.error("ProtectedLayout: Error fetching profile for MBTI check", err);
          }
        };

        if (user.role === 'STUDENT' && pathname !== '/mbti-assessment') {
          fetchProfileAndCheckMbti();
        }
      }
    }
  }, [user, sessionLoading, router, pathname]); // Depend on user and sessionLoading from the hook

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine roles based on the user from the session hook
  const isAdmin = user?.role === 'ADMIN';
  const isEmployer = user?.role === 'EMPLOYER';

  // Define navigation based on user role (adjust as needed)
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['STUDENT', 'EMPLOYER', 'ADMIN'] },
    { name: 'Jobs', href: '/jobs', roles: ['STUDENT'] }, // Only for students
    { name: 'Profile', href: '/profile', roles: ['STUDENT'] }, // Only for students
  ];

  const employerNavigation = [
    { name: 'Employer Home', href: '/employer', roles: ['EMPLOYER'] },
    { name: 'My Job Postings', href: '/employer/jobs', roles: ['EMPLOYER'] },
    { name: 'Create Job', href: '/employer/jobs/create', roles: ['EMPLOYER'] },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/dashboard/admin', roles: ['ADMIN'] },
    { name: 'Job Management', href: '/dashboard/admin', roles: ['ADMIN'] }, // Link to main admin page
    { name: 'Applications', href: '/dashboard/admin/applications', roles: ['ADMIN'] },
    { name: 'Create Job', href: '/dashboard/admin/create-job', roles: ['ADMIN'] },
    { name: 'User Management', href: '/dashboard/admin/users', roles: ['ADMIN'] },
    { name: 'Profile', href: '/profile', roles: ['ADMIN'] }, // Admins might need profile access too
  ];

  // Filter navigation based on current user role
  const currentRole = user?.role;
  const navigation = [
    ...baseNavigation.filter(item => item.roles.includes(currentRole || '')),
    ...(isEmployer ? employerNavigation.filter(item => item.roles.includes(currentRole || '')) : []),
    ...(isAdmin ? adminNavigation.filter(item => item.roles.includes(currentRole || '')) : []),
  ];

  // Separate mobile navigation might be needed if structure differs significantly
  const mobileNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    ...(user?.role === 'STUDENT' ? [{ name: 'Jobs', href: '/jobs' }] : []),
    ...(user?.role === 'STUDENT' ? [{ name: 'Profile', href: '/profile' }] : []),
    ...(isAdmin ? [{ name: 'Admin', href: '/dashboard/admin' }] : []),
    ...(isEmployer ? [{ name: 'Employer', href: '/employer' }] : []),
  ];


  const isActive = (path: string) => {
    // More specific check for dashboard/admin/employer distinction
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/employer') return pathname === '/employer';
    if (path === '/employer/jobs') return pathname === '/employer/jobs' || pathname.startsWith('/employer/jobs/') && !pathname.includes('/create');
    if (path === '/employer/jobs/create') return pathname === '/employer/jobs/create';
    if (path === '/dashboard/admin') return pathname.startsWith('/dashboard/admin');
    return pathname === path;
  };

  // Use the sessionLoading state from the hook
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4">Loading session...</p>
      </div>
    );
  }

  // If session is loaded but no user, redirect happens via useEffect. Render null briefly.
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Render the main layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {(isAdmin || isEmployer) && sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Conditional Sidebar Rendering */}
      {(isAdmin || isEmployer) && (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-indigo-600">
              {isAdmin ? 'Admin Dashboard' : 'Employer Dashboard'}
            </h2>
            <button
              className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {/* Common Dashboard Link */}
            <Link
              href="/dashboard"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/dashboard') && !pathname.startsWith('/dashboard/admin') && !pathname.startsWith('/employer')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {/* Dashboard Icon */}
              Dashboard
            </Link>

            {/* Admin Links */}
            {isAdmin && adminNavigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {/* Add appropriate icons */}
                {item.name}
              </Link>
            ))}

            {/* Employer Links */}
            {isEmployer && employerNavigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {/* Add appropriate icons */}
                {item.name}
              </Link>
            ))}

            {/* Profile Link for Employer/Admin */}
            {(isAdmin || isEmployer) && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/profile" // Assuming profile page exists for all roles
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/profile')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {/* Profile Icon */}
                  Profile
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}


      {/* Main Content Area */}
      <div className={(isAdmin || isEmployer) ? "ml-0 md:ml-64" : ""}>
        <Disclosure as="nav" className="bg-white shadow">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    {/* Sidebar Toggle for Admin/Employer on Mobile */}
                    {(isAdmin || isEmployer) && (
                      <div className="flex items-center mr-2 md:hidden">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setSidebarOpen(true)}
                        >
                          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                          <span className="sr-only">Open sidebar</span>
                        </button>
                      </div>
                    )}
                    {/* Logo */}
                    <div className="flex flex-shrink-0 items-center">
                      <Link href="/dashboard">
                        <Image
                          src="/Giatmara.png"
                          alt="Giatmara Logo"
                          width={280}
                          height={75}
                          className="h-20 w-auto"
                          priority
                        />
                      </Link>
                    </div>
                    {/* Desktop Navigation (Filtered by Role) */}
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      {navigation
                        .filter(item => !item.mobileOnly) // Filter out mobile-only if needed
                        .map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive(item.href)
                                ? 'border-b-2 border-indigo-500 text-gray-900'
                                : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                              }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                    </div>
                  </div>

                  {/* Right side items (Desktop) */}
                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <div className="text-sm text-gray-500 mr-4">
                      {/* Display user name - fetch profile if needed */}
                      {user?.profile?.firstName || user?.email}
                      {/* Display MBTI if available and relevant */}
                      {user?.role === 'STUDENT' && user?.profile?.mbtiType && (
                        <Link
                          href={`/mbti-results?type=${user.profile.mbtiType}`}
                          className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs inline-block hover:bg-indigo-200 transition-colors cursor-pointer"
                          aria-label={`View your MBTI type details: ${user.profile.mbtiType}`}
                        >
                          {user.profile.mbtiType}
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <div className="-mr-2 flex items-center sm:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Panel */}
              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 pb-3 pt-2">
                  {mobileNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={`block py-2 pl-3 pr-4 text-base font-medium ${isActive(item.href)
                          ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700'
                          : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                {/* Mobile User Info & Logout */}
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-4">
                    <div className="text-base font-medium text-gray-800">
                      {user?.profile?.firstName || user?.email}
                      {/* Mobile MBTI Display */}
                      {user?.role === 'STUDENT' && user?.profile?.mbtiType && (
                        <Link
                          href={`/mbti-results?type=${user.profile.mbtiType}`}
                          className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs inline-block hover:bg-indigo-200 transition-colors cursor-pointer"
                          aria-label={`View your MBTI type details: ${user.profile.mbtiType}`}
                        >
                          {user.profile.mbtiType}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                      Logout
                    </Disclosure.Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <main>
          <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
