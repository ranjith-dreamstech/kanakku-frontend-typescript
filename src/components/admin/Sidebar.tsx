import React, {useState, useMemo, useEffect, type ReactNode} from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {
    Home,
    ChevronDown,
    Box,
    Settings,
    ShoppingBag,
    Users,
    CircleDollarSignIcon,
    Settings2,
    Cpu,
    GlobeIcon,
    ReceiptTextIcon,
    LogOutIcon,
    Receipt,
} from 'lucide-react';

// --- Type Definitions ---
export type NavLinkItem = {
    type: 'link';
    to: string;
    title: string;
    icon?: ReactNode;
};

export type NavCollapsibleItem = {
    type: 'collapsible';
    id: string;
    icon: ReactNode;
    title: string;
    children: (NavLinkItem | NavCollapsibleItem)[]; // Recursive type
};

export type NavHeaderItem = { type: 'header'; title: string };

export type NavItemType = NavLinkItem | NavCollapsibleItem | NavHeaderItem;

// --- Navigation Data Structure ---
const navItems: NavItemType[] = [
    {type: 'header', title: 'Main'},
    {type: 'link', to: '/admin', icon: <Home size={20}/>, title: 'Dashboard'},
    {type: 'header', title: 'Inventory & Sales'},
    {
        type: 'collapsible',
        id: 'products',
        icon: <Box size={20}/>,
        title: 'Product / Services',
        children: [
            {type: 'link', to: '/admin/products', title: 'Products'},
            {type: 'link', to: '/admin/categories', title: 'Categories'},
            {type: 'link', to: '/admin/brands', title: 'Brands'},
            {type: 'link', to: '/admin/units', title: 'Units'},
        ],
    },
    {
        type: 'collapsible',
        id: 'invoices',
        icon: <Receipt size={20}/>,
        title: 'Invoices',
        children: [
            {type: 'link', to: '/admin/invoices', title: 'Invoices'},
            {type: 'link', to: '/admin/invoice-templates', title: 'Invoice Templates'},
        ]
    },
    {
        type: 'link', to: '/admin/customers', icon: <Users size={20}/>, title: 'Customers',
    },
    {
        type: 'link', to: '/admin/quotations', icon: <ReceiptTextIcon size={20}/>, title: 'Quotations',
    },
    {type: 'header', title: 'Purchase'},
    {
        type: 'collapsible',
        id: 'purchases',
        icon: <ShoppingBag size={20}/>,
        title: 'Purchases',
        children: [
            {type: 'link', to: '/admin/purchases', title: 'Purchases'},
            {type: 'link', to: '/admin/purchase-orders', title: 'Purchase Orders'},
            {type: 'link', to: '/admin/debit-notes', title: 'Debit Notes'},
            {type: 'link', to: '/admin/suppliers', title: 'Suppliers'},
            {type: 'link', to: '/admin/supplier-payments', title: 'Supplier Payments'}
        ],
    },
    {type: 'header', title: 'Settings & Configurations'},
    {
        type: 'collapsible',
        id: 'settings',
        icon: <Settings size={20}/>,
        title: 'Settings',
        children: [
            {
                type: 'collapsible',
                id: 'general-settings',
                title: 'General Settings',
                icon: <Settings2 size={16}/>,
                children: [
                    {type: 'link', to: '/admin/settings/account', title: 'Account'},
                ],
            },
            {
                type: 'collapsible',
                id: 'website-settings',
                title: 'Website Settings',
                icon: <GlobeIcon size={16}/>,
                children: [
                    {type: 'link', to: '/admin/settings/company-settings', title: 'Company Settings'},
                    {type: 'link', to: '/admin/settings/localization', title: 'Localization Settings'},
                ],
            },
            {
                type: 'collapsible',
                id: 'system-settings',
                title: 'System Settings',
                icon: <Cpu size={16}/>,
                children: [
                    {type: 'link', to: '/admin/settings/signatures', title: 'Signatures'},
                ],
            },
            {
                type: 'collapsible',
                id: 'finance-settings',
                title: 'Finance Settings',
                icon: <CircleDollarSignIcon size={16}/>,
                children: [
                    {type: 'link', to: '/admin/settings/bank-accounts', title: 'Bank Accounts'},
                    {type: 'link', to: '/admin/settings/tax-rates', title: 'Tax Rates'},
                    {type: 'link', to: '/admin/settings/tax-groups', title: 'Tax Groups'},
                    {type: 'link', to: '/admin/settings/currencies', title: 'Currencies'},
                ],
            },
        ],
    },
    //logout
    {
        type: 'link', to: '/admin/logout', icon: <LogOutIcon size={20}/>, title: 'Logout',
    },
];

// --- Helper Functions for Link Styling ---
const getTopLevelLinkClasses = ({isActive}: { isActive: boolean }) =>
    `flex items-center p-3 my-1 text-sm font-medium rounded-lg transition-colors duration-200 relative ${
        isActive ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

const getSubLinkClasses = ({isActive}: { isActive: boolean }) =>
    `block py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive ? 'text-purple-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

// --- NavItem Component (for top-level links) ---
const NavItem = ({to, icon, title, isSidebarOpen}: {
    to: string;
    icon: ReactNode;
    title: string;
    isSidebarOpen: boolean;
}) => (
    <NavLink to={to} end className={getTopLevelLinkClasses}>
        {({isActive}) => (
            <>
                <div className="flex items-center">
                    {icon}
                    <span
                        className={`ml-4 transition-opacity font-semibold duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{title}</span>
                </div>
            </>
        )}
    </NavLink>
);

interface CollapsibleNavItemProps {
    item: NavCollapsibleItem;
    isSidebarOpen: boolean;
    openMenus: Record<string, boolean>;
    activePath: string[]; 
    onToggle: (id: string) => void;
    level: number;
}

const CollapsibleNavItem = ({item, isSidebarOpen, openMenus, activePath, onToggle, level}: CollapsibleNavItemProps) => {
    const {id, icon, title, children} = item;
    const isOpen = openMenus[id] || false;

    // UPDATED: An item is active if its ID is in the active path.
    const isActive = activePath.includes(id);

    const paddingClass = level === 1 ? 'p-3 my-1' : 'py-2 px-3';
    const activeClass = isActive && isSidebarOpen
        ? (level === 1 ? 'bg-purple-600 text-white' : ' text-purple-700')
        : 'text-gray-600 hover:bg-gray-100';

    return (
        <div>
            <button
                onClick={() => onToggle(id)}
                className={`flex items-center justify-between w-full text-sm font-medium rounded-lg transition-colors duration-300 ${paddingClass} ${activeClass}`}
            >
                <div className="flex items-center">
                    {icon}
                    <span
                        className={`ml-4 transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {title}
          </span>
                </div>
                {isSidebarOpen && <ChevronDown size={16}
                                               className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}/>}
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && isSidebarOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="pt-1 space-y-1" style={{paddingLeft: `${level * 1}rem`}}>
                    {children.map(subItem => {
                        switch (subItem.type) {
                            case 'link':
                                return (
                                    <NavLink key={subItem.to} to={subItem.to} className={getSubLinkClasses}>
                                        {subItem.title}
                                    </NavLink>
                                );
                            case 'collapsible':
                                return (
                                    <CollapsibleNavItem
                                        key={subItem.id}
                                        item={subItem}
                                        isSidebarOpen={isSidebarOpen}
                                        openMenus={openMenus}
                                        activePath={activePath} // Pass the path down
                                        onToggle={onToggle}
                                        level={level + 1}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        </div>
    );
};

// --- NEW: Helper to find the full path of the active menu based on URL ---
const findActiveMenuPath = (items: NavItemType[], pathname: string): string[] => {
    for (const item of items) {
        if (item.type === 'collapsible') {
            // Check if a direct child link is an ancestor of the current path.
            if (item.children.some(child => child.type === 'link' && pathname.startsWith(child.to))) {
                return [item.id];
            }

            // Recurse into nested collapsible children.
            const pathInChild = findActiveMenuPath(item.children, pathname);

            // If a path was found in a child, prepend the current item's ID.
            if (pathInChild.length > 0) {
                return [item.id, ...pathInChild];
            }
        }
    }
    // Return an empty array if no path is found.
    return [];
};


// --- Main Sidebar Component ---
const Sidebar = ({isOpen, toggleSidebar}: { isOpen: boolean; toggleSidebar: () => void; }) => {
    const {pathname} = useLocation();

    // UPDATED: Calculate the active path once per pathname change.
    const activePath = useMemo(() => findActiveMenuPath(navItems, pathname), [pathname]);

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    // UPDATED: Effect to control which menus are open.
    // This runs on route change, closing old menus and opening the new active path.
    useEffect(() => {
        const newOpenState: Record<string, boolean> = {};
        activePath.forEach(id => {
            newOpenState[id] = true;
        });
        setOpenMenus(newOpenState);
    }, [activePath]);

    const handleToggle = (id: string) => {
        // This allows the user to manually open/close menus.
        setOpenMenus(prev => ({...prev, [id]: !prev[id]}));
    };

    return (
        <aside
            className={`bg-gray-50 text-gray-800 flex flex-col transition-all duration-300 ease-in-out  z-0 border-r border-gray-200 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-4 flex items-center h-16 border-b border-gray-200">
                <svg className="w-8 h-8 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span
                    className={`text-xl font-bold ml-2 text-gray-800 transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Kanakku
        </span>
            </div>
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
                {navItems.map((item, index) => {
                    switch (item.type) {
                        case 'header':
                            return <p key={index}
                                      className={`mt-4 mb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'hidden'}`}>{item.title}</p>;
                        case 'link':
                            return <NavItem key={item.to} to={item.to} icon={item.icon} title={item.title}
                                            isSidebarOpen={isOpen}/>;
                        case 'collapsible':
                            return <CollapsibleNavItem key={item.id} item={item} isSidebarOpen={isOpen}
                                                       openMenus={openMenus} activePath={activePath}
                                                       onToggle={handleToggle} level={1}/>;
                        default:
                            return null;
                    }
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
