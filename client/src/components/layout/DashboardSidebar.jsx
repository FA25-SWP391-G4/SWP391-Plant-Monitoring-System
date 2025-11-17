/**
 * DashboardSidebar Component
 * Modern sidebar navigation for dashboard pages
 * Based on the reference UI design with expandable/collapsible functionality
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useNotifications } from '../../contexts/NotificationContext';

import UserMenu from '../dashboard/navigation/UserMenu';
import DemoSidebarUserMenu from '../demo/DemoSidebarUserMenu';
import Footer from '../Footer';


const DashboardSidebar = ({ isOpen = true, onToggle, demoUser = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { sidebarOpen, toggleSidebar } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount = 0 } = useNotifications();
  
  // State for expandable menu items
  const [expandedItems, setExpandedItems] = useState({});
  
  // Use context state instead of local state
  const isExpanded = sidebarOpen;
  
  // Use demoUser if provided, otherwise use authenticated user
  const currentUser = demoUser || user;


  // Determine user role for conditional rendering
  const isPremium = currentUser?.role === "Premium";
  const isAdmin = currentUser?.role === "Admin";
  const isUltimate = currentUser?.role === "Ultimate";

  const isAuthenticated = !!currentUser;

  // Calculate unread notifications from shared notification context
  const unreadNotifications = unreadCount;


  // Navigation items based on user role
  const getNavigationItems = () => {
    // Only show navigation if authenticated
    if (!isAuthenticated) return { mainItems: [], bottomItems: [] };

    let baseItems = [
      {
      name: t('navigation.dashboard'),
      href: isAdmin ? '/admin/dashboard' : '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard-icon lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
      )
      },
      {
      name: t('navigation.devices'),
      href: isAdmin ? '/admin/devices' : '/devices',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" id="device-16px">
          <rect id="Retângulo_223" data-name="Retângulo 223" width="16" height="16" fill="none" opacity="0"/>
          <g id="Icone" transform="translate(0.648 0.648)">
          <g id="Retângulo_203" data-name="Retângulo 203" transform="translate(2.352 2.352)" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
            <rect width="10" height="10" stroke="none"/>
            <rect x="0.5" y="0.5" width="9" height="9" fill="none"/>
          </g>
          <g id="Retângulo_206" data-name="Retângulo 206" transform="translate(5.352 5.352)" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
            <rect width="4" height="4" stroke="none"/>
            <rect x="0.5" y="0.5" width="3" height="3" fill="none"/>
          </g>
          <g id="Grupo_327" data-name="Grupo 327" transform="translate(-0.191 1)">
            <line id="Linha_24" data-name="Linha 24" y1="3" transform="translate(5.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_28" data-name="Linha 28" y1="3" transform="translate(7.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_29" data-name="Linha 29" y1="3" transform="translate(9.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
          </g>
          <g id="Grupo_328" data-name="Grupo 328" transform="translate(-0.191 -11)">
            <line id="Linha_24-2" data-name="Linha 24" y1="3" transform="translate(5.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_28-2" data-name="Linha 28" y1="3" transform="translate(7.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_29-2" data-name="Linha 29" y1="3" transform="translate(9.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
          </g>
          <g id="Grupo_329" data-name="Grupo 329" transform="translate(1 14.895) rotate(-90)">
            <line id="Linha_24-3" data-name="Linha 24" y1="3" transform="translate(5.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_28-3" data-name="Linha 28" y1="3" transform="translate(7.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_29-3" data-name="Linha 29" y1="3" transform="translate(9.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
          </g>
          <g id="Grupo_330" data-name="Grupo 330" transform="translate(-11 14.895) rotate(-90)">
            <line id="Linha_24-4" data-name="Linha 24" y1="3" transform="translate(5.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_28-4" data-name="Linha 28" y1="3" transform="translate(7.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
            <line id="Linha_29-4" data-name="Linha 29" y1="3" transform="translate(9.543 10.852)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1"/>
          </g>
          </g>
        </svg>
      )
      },
      {
      name: t('navigation.plants'),
      href: isAdmin ? '/admin/plants' : '/plants',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sprout-icon lucide-sprout"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>
      )
      }
    ];

    // Admin-only navigation items
    if (isAdmin) {
      baseItems = [
      ...baseItems.slice(0, 1),
      {
        name: t('navigation.users'),
        href: '/admin/users',
        icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-icon lucide-users"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        )
      },
      ...baseItems.slice(1)
      ];
      baseItems.push({
      name: t('navigation.reports'),
      href: '/admin/reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" viewBox="0 0 512 512" style={{width: 24, height: 24}} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sprout-icon lucide-sprout">
        <g id="icomoon-ignore">
        </g>
        <path d="M64 448h448v64h-512v-512h64zM144 416c-26.51 0-48-21.49-48-48s21.49-48 48-48c1.414 0 2.811 0.074 4.194 0.193l51.596-85.993c-4.92-7.535-7.79-16.531-7.79-26.201 0-26.51 21.49-48 48-48s48 21.49 48 48c0 9.671-2.87 18.666-7.79 26.201l51.596 85.993c1.383-0.119 2.78-0.193 4.194-0.193 1.068 0 2.124 0.047 3.175 0.115l85.178-149.061c-5.268-7.704-8.353-17.018-8.353-27.055 0-26.51 21.49-48 48-48s48 21.49 48 48c0 26.51-21.49 48-48 48-1.070 0-2.124-0.047-3.175-0.116l-85.178 149.062c5.268 7.703 8.353 17.018 8.353 27.055 0 26.51-21.49 48-48 48s-48-21.49-48-48c0-9.67 2.87-18.666 7.789-26.201l-51.595-85.992c-1.383 0.119-2.78 0.193-4.194 0.193s-2.811-0.073-4.194-0.193l-51.596 85.993c4.92 7.534 7.79 16.53 7.79 26.2 0 26.51-21.49 48-48 48z"/>
        </svg>
      )
      });
    }

    // Add premium section for premium/admin users
    /*if (isUltimate || isAdmin) {
      const ultimateItems = [
        {
          name: t('navigation.aiAssistant', 'AI Assistant'),
          href: '/ai',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit-icon lucide-brain-circuit"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/><circle cx="16" cy="13" r=".5"/><circle cx="18" cy="3" r=".5"/><circle cx="20" cy="21" r=".5"/><circle cx="20" cy="8" r=".5"/></svg>
          ),
          isPremium: true
        }
      ]
      baseItems.push(...ultimateItems);
    }*/
    if (isPremium || isUltimate) {
      const premiumItems = [
        /*{
          name: t('navigation.reporting'),
          href: '/reports',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-no-axes-combined-icon lucide-chart-no-axes-combined"><path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/></svg>
          ),
          isExpandable: true,
          subItems: [
            { name: t('reports.overview', 'Overview'), href: '/reports' },
            { name: t('reports.plantAnalysis', 'Plant Analysis'), href: '/reports/plant-analysis' },
            { name: t('reports.imageAnalysis', 'Image Analysis'), href: '/reports/image-analysis' },
            { name: t('reports.historicalData', 'Historical Data'), href: '/reports/historical-data' },
            { name: t('reports.waterConsumption', 'Water Usage'), href: '/reports/water-consumption' },
            { name: t('reports.plantHealth', 'Plant Health'), href: '/reports/plant-health' },
            { name: t('reports.customReports', 'Custom Reports'), href: '/reports/custom' }
          ]
        },*/
        {
          name: t('navigation.zones'),
          href: '/zones',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-land-plot-icon lucide-land-plot"><path d="m12 8 6-3-6-3v10"/><path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"/><path d="m6.49 12.85 11.02 6.3"/><path d="M17.51 12.85 6.5 19.15"/></svg>
          )
        }
      ];
      baseItems.push(...premiumItems);
    }

    // Add admin-specific items
    /*if (isAdmin) {
      baseItems.push({
        name: t('navigation.admin'),
        href: '/admin',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-star-icon lucide-user-star"><path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>
        )
      });
    */

    // Add bottom section items
    const bottomItems = [
      /*{
        name: t('navigation.documentation'),
        href: '/documentation',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-files-icon lucide-files"><path d="M15 2a2 2 0 0 1 1.414.586l4 4A2 2 0 0 1 21 8v7a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M15 2v4a2 2 0 0 0 2 2h4"/><path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1"/></svg>
        )
      },
      {
        name: t('navigation.support'),
        href: '/support',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-warning-icon lucide-message-square-warning"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M12 15h.01"/><path d="M12 7v4"/></svg>
        )
      },
      */
     {
        name: t('navigation.settings'),
        href: '/settings',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
        )
      }
    ];

    return { mainItems: baseItems, bottomItems };
  };

  const { mainItems, bottomItems } = getNavigationItems();

  const isActiveRoute = (href) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Check if any sub-item is active for parent highlighting
  const isParentActive = (subItems) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActiveRoute(subItem.href));
  };

  // Toggle expandable menu items
  const toggleExpandedItem = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`overflow-y: scroll h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-72' : 'w-16'
      }`}>   
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainItems.map((item) => (
              <div key={item.name}>
                {item.isExpandable ? (
                  <div>
                    <button
                      onClick={() => toggleExpandedItem(item.name)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isParentActive(item.subItems)
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } ${!isExpanded ? 'justify-center' : ''} ${item.isPremium ? 'relative' : ''}`}
                      title={!isExpanded ? item.name : ''}
                    >
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                      {isExpanded && (
                        <>
                          <span className="ml-3 flex-1 text-left">{item.name}</span>
                          {item.isPremium && (
                            <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              AI
                            </span>
                          )}
                          <svg 
                            className={`ml-auto w-4 h-4 transition-transform ${expandedItems[item.name] ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                    {isExpanded && expandedItems[item.name] && item.subItems && (
                      <div className="ml-9 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActiveRoute(subItem.href)
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                            }`}
                          >
                            <span className="text-xs">•</span>
                            <span className="ml-2">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActiveRoute(item.href)
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    } ${!isExpanded ? 'justify-center' : ''} ${item.isPremium ? 'relative' : ''}`}
                    title={!isExpanded ? item.name : ''}
                  >
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    {isExpanded && (
                      <>
                        <span className="ml-3">{item.name}</span>
                        {item.isPremium && (
                          <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            AI
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div className="mt-8">
            <div className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
              !isExpanded ? 'justify-center' : ''
            }`}>
              <div className="flex-shrink-0 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-icon lucide-bell"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              {isExpanded && <span className="ml-3">{t('navigation.notifications')}</span>}
            </div>
          </div>

          {/* Tasks with Badge */}
          <div className="mt-2">
            <div className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
              !isExpanded ? 'justify-center' : ''
            }`}>
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check2-icon lucide-calendar-check-2"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="m16 20 2 2 4-4"/></svg>
              </div>
              {isExpanded && (
                <>
                  <span className="ml-3">{t('navigation.tasks')}</span>
                  <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    3
                  </span>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-1 mb-4">
            {bottomItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } ${!isExpanded ? 'justify-center' : ''}`}
                title={!isExpanded ? item.name : ''}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {isExpanded && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>
        {isExpanded && <Footer className={`flex flex-col mt-auto p-8`} />}
      </div>
    </>
  );
};

export default DashboardSidebar;