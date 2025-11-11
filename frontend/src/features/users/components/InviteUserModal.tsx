import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRoles } from '@/features/organizations/hooks/useRoles';
import type { InviteMemberDto } from '@/features/organizations/api/organizationsApi';

interface InviteUserModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (data: InviteMemberDto) => void;
    orgId: string;
}

export default function InviteUserModal({
    isOpen,
    isLoading,
    onClose,
    onSubmit,
    orgId,
}: InviteUserModalProps) {
    const [formData, setFormData] = useState<InviteMemberDto>({
        email: '',
        roleId: '',
    });

    const { data: roles, isLoading: rolesLoading } = useRoles(orgId);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                email: '',
                roleId: '',
            });
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.roleId) return;
        onSubmit(formData);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Set email directly
        setFormData({ ...formData, email: e.target.value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="user@example.com"
                            required
                        />
                        <p className="text-xs text-gray-500">
                            User account will be created automatically if they don't exist
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            value={formData.roleId}
                            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                            disabled={rolesLoading}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles?.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.email || !formData.roleId}
                        >
                            {isLoading ? 'Sending Invite...' : 'Send Invitation'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}