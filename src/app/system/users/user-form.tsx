"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createUser, updateUser } from "./actions";
import { uploadAvatar } from "./upload-action";
import { RoleType } from "@prisma/client";
import { Loader2, Upload, AlertTriangle } from "lucide-react";

interface UserFormProps {
    initialData?: any;
    isEdit?: boolean;
    isSuperAdmin?: boolean;
}

export default function UserForm({ initialData, isEdit = false, isSuperAdmin = false }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        email: initialData?.email || "",
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        role: initialData?.roleType || "USER",
        password: "",
        phone: initialData?.phone || "",
        bio: initialData?.bio || "",
        image: initialData?.image || "",
        dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
        gender: initialData?.gender || "",
        address: initialData?.address || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        country: initialData?.country || "",
        postalCode: initialData?.postalCode || "",
        website: initialData?.website || "",
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        socialLinks: {
            website: initialData?.socialLinks?.website || "",
            website_isPublic: initialData?.socialLinks?.website_isPublic || false,
            twitter: initialData?.socialLinks?.twitter || "",
            twitter_isPublic: initialData?.socialLinks?.twitter_isPublic || false,
            linkedin: initialData?.socialLinks?.linkedin || "",
            linkedin_isPublic: initialData?.socialLinks?.linkedin_isPublic || false,
            facebook: initialData?.socialLinks?.facebook || "",
            facebook_isPublic: initialData?.socialLinks?.facebook_isPublic || false,
            instagram: initialData?.socialLinks?.instagram || "",
            instagram_isPublic: initialData?.socialLinks?.instagram_isPublic || false,
            github: initialData?.socialLinks?.github || "",
            github_isPublic: initialData?.socialLinks?.github_isPublic || false,
            whatsapp: initialData?.socialLinks?.whatsapp || "",
            whatsapp_isPublic: initialData?.socialLinks?.whatsapp_isPublic || false,
        },
        privacySettings: initialData?.privacySettings || {
            profileVisible: true,
            showEmail: false,
            showPhone: false,
        },
        preferences: initialData?.preferences || {
            newsletter: true,
            marketingEmails: false,
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (value: RoleType) => {
        setFormData(prev => ({ ...prev, role: value }));
    };

    const handleSuperAdminChange = (checked: boolean) => {
        if (checked) {
            setFormData(prev => ({ ...prev, role: "SUPER_ADMIN" }));
        } else {
            // Default back to USER if unchecked, or keep current if it was something else? 
            // Better to default to USER or ADMIN. Let's go with USER.
            setFormData(prev => ({ ...prev, role: "USER" }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append("file", file);

        try {
            const result = await uploadAvatar(data);
            if (result.success && result.url) {
                setFormData(prev => ({ ...prev, image: result.url }));
                toast.success("Avatar uploaded successfully");
            } else {
                toast.error(result.error || "Failed to upload avatar");
            }
        } catch (error) {
            toast.error("An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = isEdit 
                ? await updateUser(initialData.id, formData)
                : await createUser(formData);

            if (result.success) {
                toast.success(isEdit ? "User updated successfully" : "User created successfully");
                if (!isEdit) router.push("/system/users");
            } else {
                toast.error(result.error || "Operation failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <Tabs defaultValue="general" className="w-full" id="user-form-tabs">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="social">Social Media Links</TabsTrigger>
                            <TabsTrigger value="privacy">Privacy & Preferences</TabsTrigger>
                            <TabsTrigger value="password">Password</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={formData.image} />
                                            <AvatarFallback>{formData.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2">
                                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm font-medium">
                                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                    Change Avatar
                                                </div>
                                                <Input 
                                                    id="avatar-upload" 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                />
                                            </Label>
                                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input 
                                                name="name" 
                                                value={formData.name} 
                                                onChange={handleChange} 
                                                placeholder="Display Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input 
                                                name="email" 
                                                value={formData.email} 
                                                onChange={handleChange} 
                                                placeholder="Email"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input 
                                                name="firstName" 
                                                value={formData.firstName} 
                                                onChange={handleChange} 
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input 
                                                name="lastName" 
                                                value={formData.lastName} 
                                                onChange={handleChange} 
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select 
                                            value={formData.role} 
                                            onValueChange={(val: RoleType) => handleRoleChange(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER">User</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="OWNER">Owner</SelectItem>
                                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="isActive" 
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                                        />
                                        <Label htmlFor="isActive" className="font-medium cursor-pointer">Active Account</Label>
                                    </div>

                                    {isSuperAdmin && (
                                    <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg space-y-3">
                                        <div className="flex items-start space-x-2">
                                            <Checkbox 
                                                id="superAdmin" 
                                                checked={formData.role === "SUPER_ADMIN"}
                                                onCheckedChange={(checked) => handleSuperAdminChange(checked as boolean)}
                                                className="mt-1 border-destructive text-destructive focus:ring-destructive"
                                            />
                                            <div className="space-y-1">
                                                <Label htmlFor="superAdmin" className="font-semibold text-destructive cursor-pointer">
                                                    Super Administrator
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Grant full system access across all tenants. Use with caution.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Profile Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input 
                                                type="date"
                                                name="dateOfBirth" 
                                                value={formData.dateOfBirth} 
                                                onChange={handleChange} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <Select 
                                                value={formData.gender} 
                                                onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input 
                                                name="phone" 
                                                value={formData.phone} 
                                                onChange={handleChange} 
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Website</Label>
                                            <Input 
                                                name="website" 
                                                value={formData.website} 
                                                onChange={handleChange} 
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Textarea 
                                            name="bio" 
                                            value={formData.bio} 
                                            onChange={handleChange} 
                                            placeholder="Tell us about yourself"
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Location */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Location</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Address</Label>
                                        <Textarea 
                                            name="address" 
                                            value={formData.address} 
                                            onChange={handleChange} 
                                            placeholder="Street Address"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input 
                                                name="city" 
                                                value={formData.city} 
                                                onChange={handleChange} 
                                                placeholder="City"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input 
                                                name="state" 
                                                value={formData.state} 
                                                onChange={handleChange} 
                                                placeholder="State/Province"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Country</Label>
                                            <Input 
                                                name="country" 
                                                value={formData.country} 
                                                onChange={handleChange} 
                                                placeholder="Country"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Postal Code</Label>
                                            <Input 
                                                name="postalCode" 
                                                value={formData.postalCode} 
                                                onChange={handleChange} 
                                                placeholder="Postal Code"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="social">
                         <Card>
                            <CardHeader>
                                <CardTitle>Social Media Links</CardTitle>
                                <CardDescription>Add your social media profiles.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.keys(formData.socialLinks).filter(k => !k.endsWith('_isPublic')).map((key) => (
                                    <div key={key} className="grid gap-2">
                                        <Label className="capitalize">{key}</Label>
                                        <Input
                                            value={(formData.socialLinks as any)[key]}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                socialLinks: { ...prev.socialLinks, [key]: e.target.value }
                                            }))}
                                            placeholder={`Your ${key} profile URL`}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle>Privacy & Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-medium">Privacy Settings</h3>
                                    <div className="flex items-center justify-between">
                                        <Label>Profile Visible</Label>
                                        <Switch 
                                            checked={formData.privacySettings.profileVisible}
                                            onCheckedChange={(c) => setFormData(prev => ({ ...prev, privacySettings: { ...prev.privacySettings, profileVisible: c } }))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="password">
                         <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Leave blank to keep current password.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input 
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter new password"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? "Save Profile" : "Create User"}
                </Button>
            </div>
        </form>
    );
}