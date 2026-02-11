import React from 'react';
import * as LucideIcons from 'lucide-react';

export const DynamicIcon = ({ name, className, size = 20 }: any) => {
    if (name?.startsWith('fa')) return <i className={`${name} ${className}`} style={{ fontSize: size }} />;
    const Icon = (LucideIcons as any)[name];
    return Icon ? <Icon className={className} size={size} /> : <LucideIcons.HelpCircle size={size} />;
};