export const CORE_MODULES = [
    { key: 'overview.dashboard', label: 'Dashboard', defaultRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'USER'] },
    { key: 'overview.analytics', label: 'Analytics', defaultRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { key: 'management.organizations', label: 'Organizations', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'user_management.users', label: 'Users', defaultRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { key: 'user_management.roles', label: 'Roles & Permissions', defaultRoles: ['SUPER_ADMIN', 'OWNER'] },
    { key: 'settings.tenant', label: 'Settings', defaultRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
    { key: 'kyc.company', label: 'Company KYC', defaultRoles: ['SUPER_ADMIN', 'OWNER'] },
    { key: 'assistant.chat', label: 'BestLa Chat', defaultRoles: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'USER'] },
    { key: 'system.settings', label: 'Applications Settings', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'system.packages', label: 'Packages', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'system.billings', label: 'Billings', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'system.gateways', label: 'Payment Gateways', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'system.modules', label: 'Modules', defaultRoles: ['SUPER_ADMIN'] },
    { key: 'system.ssm', label: 'SSM Verification Test', defaultRoles: ['SUPER_ADMIN'] },
];

export const MODULE_GROUPS = [
    {
        label: "Overview",
        items: ['overview.dashboard', 'overview.analytics']
    },
    {
        label: "Management",
        items: ['management.organizations']
    },
    {
        label: "User Management",
        items: ['user_management.users', 'user_management.roles']
    },
    {
        label: "Settings",
        items: ['settings.tenant']
    },
    {
        label: "KYC",
        items: ['kyc.company']
    },
    {
        label: "BestLa Assistant",
        items: ['assistant.chat']
    },
    {
        label: "System Settings",
        items: [
            'system.settings',
            'system.packages',
            'system.billings',
            'system.gateways',
            'system.modules',
            'system.ssm'
        ]
    }
];
