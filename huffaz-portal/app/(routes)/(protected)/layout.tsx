'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BriefcaseIcon, CogIcon, DocumentTextIcon, InboxIcon, BuildingOfficeIcon, UserGroupIcon, ChartBarIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/app/lib/session';

// Define navigation items with icons (keep as is)
const studentNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
  { name: 'My Applications', href: '/my-applications', icon: InboxIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
];

const employerNavigation = [
  { name: 'Employer Home', href: '/employer', icon: HomeIcon },
  { name: 'My Job Postings', href: '/employer/jobs', icon: BriefcaseIcon },
  { name: 'Create Job', href: '/employer/jobs/create', icon: DocumentTextIcon },
  { name: 'All Applications', href: '/employer/applications', icon: InboxIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/dashboard/admin', icon: CogIcon },
  { name: 'Job Management', href: '/dashboard/admin', icon: BriefcaseIcon },
  { name: 'Applications', href: '/dashboard/admin/applications', icon: InboxIcon },
  { name: 'Create Job', href: '/dashboard/admin/create-job', icon: DocumentTextIcon },
  { name: 'User Management', href: '/dashboard/admin/users', icon: UserGroupIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: sessionLoading, refreshSession } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  // Removed internal isLoading state

  // Effect for authentication and initial data loading
  useEffect(() => {
    // Still wait for session to finish loading
    if (sessionLoading) {
      return;
    }

    // If session loaded but no user, redirect
    if (!user) {
      console.log("ProtectedLayout Effect: No user, redirecting to login.");
      router.replace('/login');
      return;
    }

    // User is authenticated, fetch profile data (but don't block rendering with a separate loading state)
    const fetchProfile = async () => {
      try {
        const profileRes = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store' // Ensure fresh profile data
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileData(data.profile);

          // MBTI Check for STUDENTS only after profile is fetched
          if (user.role === 'STUDENT' && data.profile && !data.profile.mbtiCompleted && pathname !== '/mbti-assessment') {
            console.log("ProtectedLayout Effect: Student missing MBTI, redirecting.");
            router.push('/mbti-assessment');
            // No return here, let the redirect happen
          }
        } else {
          console.error("ProtectedLayout Effect: Failed to fetch profile, status:", profileRes.status);
          setProfileData(null); // Clear profile data on error
        }
      } catch (err) {
        console.error("ProtectedLayout Effect: Error fetching profile", err);
        setProfileData(null); // Clear profile data on error
      }
    };

    fetchProfile();

  }, [user, sessionLoading, router, pathname]); // Dependencies


  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refreshSession();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine user role and navigation (keep as is)
  const currentRole = user?.role;
  let navigation: { name: string; href: string; icon: React.ElementType }[] = [];
  let mobileNavigation: { name: string; href: string }[] = [];
  let sidebarTitle = 'Dashboard';
  let showSidebar = false;

  if (currentRole === 'ADMIN') {
    navigation = adminNavigation;
    sidebarTitle = 'Admin Menu';
    showSidebar = true;
  } else if (currentRole === 'EMPLOYER') {
    navigation = employerNavigation;
    sidebarTitle = 'Employer Menu';
    showSidebar = true;
  } else if (currentRole === 'STUDENT') {
    navigation = studentNavigation;
    sidebarTitle = 'Student Menu';
    showSidebar = false;
  }
  mobileNavigation = navigation.map(item => ({ name: item.name, href: item.href }));

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path === '/employer' && pathname === '/employer') return true;
    if (path === '/dashboard/admin' && pathname === '/dashboard/admin') return true;
    if (path !== '/' && pathname.startsWith(path + '/')) return true;
    if (path !== '/' && pathname === path) return true;
    return false;
  };

  // Use sessionLoading directly for the main loading indicator
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // If session is loaded, but there's no user (e.g., token invalid), show minimal message while redirecting
  if (!user) {
    console.log("ProtectedLayout Render: No user after loading, rendering redirect message.");
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  // User is loaded, proceed to render the layout
  const displayName = profileData?.firstName ? `${profileData.firstName} ${profileData.lastName}` : user?.email;
  const mbtiType = profileData?.mbtiType;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {showSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Conditional Sidebar Rendering */}
      {showSidebar && (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/Giatmara.png"
                alt="Giatmara Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-lg font-semibold text-indigo-600">{sidebarTitle}</span>
            </Link>
            <button
              className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className={showSidebar ? "md:ml-64" : ""}>
        <Disclosure as="nav" className="bg-white shadow">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex items-center">
                    {showSidebar && (
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
                    {(!showSidebar || !sidebarOpen) && (
                      <div className="flex flex-shrink-0 items-center">
                        <Link href="/dashboard">
                          <Image
                            src="/Giatmara.png"
                            alt="Giatmara Logo"
                            width={140}
                            height={38}
                            className="h-10 w-auto"
                            priority
                          />
                        </Link>
                      </div>
                    )}
                    {!showSidebar && (
                      <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                        {navigation.map((item) => (
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
                    )}
                  </div>

                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <div className="text-sm text-gray-500 mr-4">
                      {displayName}
                      {user?.role === 'STUDENT' && mbtiType && (
                        <Link
                          href={`/mbti-results?type=${mbtiType}`}
                          className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-xs inline-block hover:bg-indigo-200 transition-colors cursor-pointer"
                          aria-label={`View your MBTI type details: ${mbtiType}`}
                        >
                          {mbtiType}
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

                  <div className="-mr-2 flex items-center sm:hidden">
                    {!showSidebar && (
                      <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                        <span className="sr-only">Open main menu</span>
                        {open ? (
                          <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                        ) : (
                          <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                        )}
                      </Disclosure.Button>
                    )}
                  </div>
                </div>
              </div>

              {!showSidebar && (
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
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-4">
                      <div className="text-base font-medium text-gray-800">
                        {displayName}
                        {user?.role === 'STUDENT' && mbtiType && (
                          <Link
                            href={`/mbti-results?type=${mbtiType}`}
                            className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-xs inline-block hover:bg-indigo-200 transition-colors cursor-pointer"
                            aria-label={`View your MBTI type details: ${mbtiType}`}
                          >
                            {mbtiType}
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
              )}
            </>
          )}
        </Disclosure>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
