/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MenuItem } from '@/types/sidebar.types';
import { useUserPermissions } from '@/hooks/usePermissions';
import { filterMenuByPermissions, sidebarConfig } from '@/config/sidebarConfig';
import { usePendingInvitationsCount } from '@/features/organizations/hooks/usePendingInvitationsCount';
import { Badge } from './ui/badge';

interface MenuItemProps {
    item: MenuItem;
    level: number;
    orgSlug: string;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    activePath: string;
}

const MenuItem = ({ item, level, orgSlug, expanded, onToggle, activePath }: MenuItemProps) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.id);
    const isExactMatch = item.path && activePath.endsWith(`/${item.path}`);

    // Check if any children are active
    const hasActiveChild = item.children?.some(child => {
        if (child.path && activePath.endsWith(`/${child.path}`)) return true;
        if (child.children) {
            return child.children.some(grandChild =>
                grandChild.path && activePath.endsWith(`/${grandChild.path}`)
            );
        }
        return false;
    });

    const isActive = isExactMatch && !hasActiveChild;
    const fullPath = item.path ? `/${orgSlug}/${item.path}` : undefined;

    const ItemContent = (
        <div
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${isActive || expanded.has(item.id) ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
            onClick={() => hasChildren && onToggle(item.id)}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                    <Icon
                        className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                            }`}
                    />
                )}
                <span className="text-sm truncate">{item.label}</span>
                {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                    </Badge>
                )}
            </div>
            {hasChildren && (
                isExpanded
                    ? <ChevronDown className="h-4 w-4 shrink-0" />
                    : <ChevronRight className="h-4 w-4 shrink-0" />
            )}
        </div>
    );

    return (
        <div>
            {fullPath ? (
                <Link to={fullPath} className="block">
                    {ItemContent}
                </Link>
            ) : (
                ItemContent
            )}
            {hasChildren && isExpanded && (
                <div className="mt-1 space-y-1">
                    {item.children!.map(child => (
                        <MenuItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            orgSlug={orgSlug}
                            expanded={expanded}
                            onToggle={onToggle}
                            activePath={activePath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const Sidebar = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const permissions = useUserPermissions();
    const invitationsCount = usePendingInvitationsCount();
    const location = useLocation();
    const activePath = location.pathname;
    const { orgSlug = '' } = useParams<{ orgSlug: string }>();

    // Create menu with dynamic invitations count
    const menuWithBadges = sidebarConfig.items.map(item => ({
        ...item,
        children: item.children?.map(child => ({
            ...child,
            badge: child.id === 'team-invitations' ? invitationsCount : child.badge,
        })),
    }));

    const menu = filterMenuByPermissions(menuWithBadges, permissions);

    // Auto-expand parent items of active page
    useEffect(() => {
        const findParents = (items: MenuItem[], targetPath: string, parents: string[] = []): string[] => {
            for (const item of items) {
                if (item.path === targetPath) return parents;
                if (item.children) {
                    const found = findParents(item.children, targetPath, [...parents, item.id]);
                    if (found.length) return found;
                }
            }
            return [];
        };

        const activePath = location.pathname.split('/').pop() || '';
        const activeItem = menu.find(item => item.path?.includes(activePath));

        if (activeItem?.path) {
            const parents = findParents(menu, activeItem.path);
            if (parents.length) {
                setExpanded(prev => new Set([...prev, ...parents]));
            }
        }
    }, [location.pathname, menu]);

    const toggleExpanded = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    useEffect(() => {
        const activeParent = menu.find(item => item.children?.some(child => child.path && activePath.endsWith(`/${child.path}`)));
        const parentId = activeParent?.id;
        if (parentId) {
            setExpanded(prev => new Set([...prev, parentId]));
        }
    }, [activePath]);

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200 sticky top-0 overflow-y-auto">
            <nav className="p-3 space-y-1">
                {menu.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No menu items available</p>
                    </div>
                ) : (
                    menu.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            level={0}
                            orgSlug={orgSlug}
                            expanded={expanded}
                            onToggle={toggleExpanded}
                            activePath={activePath}
                        />
                    ))
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;