import React from 'react';
import { useAuth } from './context/AuthContext';

/**
 * PermissionGuard wraps UI elements to show/hide them based on user permissions.
 * @param {string} department - The department key (e.g., 'tikuv', 'ombor')
 * @param {string} level - Required level ('read' or 'full')
 */
const PermissionGuard = ({ department, level = 'read', children, fallback = null }) => {
    const { profile } = useAuth();

    if (!profile) return fallback;

    // Admin has all permissions
    if (profile.role === 'admin') return children;

    const userPerm = profile.permissions?.[department];

    // If 'full' is required, check if user has 'full'
    if (level === 'full') {
        return userPerm === 'full' ? children : fallback;
    }

    // If 'read' is required, check if user has either 'read' or 'full'
    if (level === 'read') {
        return (userPerm === 'read' || userPerm === 'full') ? children : fallback;
    }

    return fallback;
};

export default PermissionGuard;
