import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Role, UpdateRoleDto } from '@/features/organizations/api/rolesApi';

interface EditRoleModalProps {
    role: Role;
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (data: UpdateRoleDto) => void;
}

export default function EditRoleModal({
    role,
    isOpen,
    isLoading,
    onClose,
    onSubmit,
}: EditRoleModalProps) {
    const [formData, setFormData] = useState<UpdateRoleDto>({
        name: role.name,
        slug: role.slug,
        description: role.description,
        color: role.color,
        level: role.level,
    });

    useEffect(() => {
        setFormData({
            name: role.name,
            slug: role.slug,
            description: role.description,
            color: role.color,
            level: role.level,
        });
    }, [role, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Role</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Role Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleNameChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            type="text"
                            value={formData.slug || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, slug: e.target.value })
                            }
                            placeholder="e.g., custom-role"
                        />
                        <p className="text-xs text-gray-500">
                            Lowercase letters, numbers, and hyphens only
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            placeholder="Describe the purpose of this role"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <Input
                                id="color"
                                type="color"
                                value={formData.color || '#3b82f6'}
                                onChange={(e) =>
                                    setFormData({ ...formData, color: e.target.value })
                                }
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="level">Level</Label>
                            <Select
                                value={formData.level || 'medium'}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, level: value })
                                }
                            >
                                <SelectTrigger id="level">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
