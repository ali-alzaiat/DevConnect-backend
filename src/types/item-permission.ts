/**
 * The requesting user's effective access level on an item.
 * - ADMIN: platform admin (full access without explicit grants)
 * - OWNER: creator/author of the item
 * - EDIT / SHARE / VIEW: level granted via the item's permission table
 */
export type ItemPermission = 'ADMIN' | 'OWNER' | 'EDIT' | 'SHARE' | 'VIEW';

/** Levels that allow modifying/deleting an item */
export const EDIT_LEVELS: ItemPermission[] = ['ADMIN', 'OWNER', 'EDIT'];
