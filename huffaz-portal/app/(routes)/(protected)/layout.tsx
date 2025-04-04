'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName: string;
    lastName: string;
    mbtiType?: string;
    mbtiCompleted?: boolean;
  };
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        const data = await response.json();
        setUser(data.user);
        
        // Redirect to MBTI assessment if not completed and not already on that page
        if (data.user?.profile && !data.user.profile.mbtiCompleted && pathname !== '/mbti-assessment') {
          router.push('/mbti-assessment');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.role === 'ADMIN');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    checkAdminStatus();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Profile', href: '/profile' },
    // Only show Admin in top navbar if sidebar is NOT showing (for mobile)
    ...(user?.role === 'ADMIN' && !isAdmin ? [{ name: 'Admin', href: '/dashboard/admin' }] : []),
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If mbti assessment needs to be completed and we're not on the mbti page, don't render
  if (user.profile && !user.profile.mbtiCompleted && pathname !== '/mbti-assessment') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isAdmin && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-800/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Desktop: always visible, Mobile: toggleable */}
      {isAdmin && (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-indigo-600">Admin Dashboard</h2>
            <button 
              className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="p-4 space-y-1">
            <Link 
              href="/dashboard"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard') && !isActive('/dashboard/admin') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            
            <Link 
              href="/dashboard/admin"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/admin') && !isActive('/dashboard/admin/applications')
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Job Management
            </Link>
            
            <Link 
              href="/dashboard/admin/applications"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/admin/applications')
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Applications
            </Link>
            
            <Link 
              href="/dashboard/admin/create-job"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/admin/create-job')
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Job
            </Link>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link 
                href="/profile"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/profile')
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
            </div>
          </nav>
        </div>
      )}
      
      <div className={isAdmin ? "ml-0 md:ml-64" : ""}>
        <Disclosure as="nav" className="bg-white shadow">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    {/* Only show sidebar toggle for admin users on mobile */}
                    {isAdmin && (
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
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                            item.name === 'Admin' 
                              ? 'text-indigo-600 hover:text-indigo-500' 
                              : 'text-gray-900 hover:text-gray-700'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <div className="text-sm text-gray-500 mr-4">
                      {user.profile?.firstName} {user.profile?.lastName}
                      {user.profile?.mbtiType && (
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

              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 pb-3 pt-2">
                  <div className="flex items-center justify-center border-b border-gray-200 pb-3">
                    <Link href="/dashboard">
                      <Image 
                        src="/Giatmara.png" 
                        alt="Giatmara Logo" 
                        width={240} 
                        height={65} 
                        className="h-16 w-auto my-2" 
                        priority
                      />
                    </Link>
                  </div>
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={`block py-2 pl-3 pr-4 text-base font-medium ${
                        item.name === 'Admin'
                          ? 'text-indigo-600 hover:bg-gray-50 hover:text-indigo-800'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-4">
                      <div className="text-base font-medium text-gray-800">
                        {user.profile?.firstName} {user.profile?.lastName}
                        {user.profile?.mbtiType && (
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
                        className="block w-full px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        Logout
                      </Disclosure.Button>
                    </div>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Add a title for admin pages when sidebar is visible */}
        {isAdmin && pathname.includes('/dashboard/admin') && (
          <div className="pt-4 pb-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-xl font-semibold text-gray-900 md:hidden">
                {pathname.includes('/applications') ? 'Applications Management' : 
                 pathname.includes('/create-job') ? 'Create Job' : 'Admin Dashboard'}
              </h1>
            </div>
          </div>
        )}

        <main>
          <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 