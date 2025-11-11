import { useOrganizationMembers } from '@/features/users/hooks/useOrganizationMembers';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Users, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthUser } from '@/store/authStore';

interface AssignUsersSelectProps {
  orgId: string;
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export const AssignUsersSelect = ({
  orgId,
  selectedUserIds,
  onSelectionChange,
}: AssignUsersSelectProps) => {
  const { data: members, isLoading } = useOrganizationMembers(orgId);
  const currentUser = useAuthUser();
  const [open, setOpen] = useState(false);

  const handleAddUser = (userId: string) => {
    if (!selectedUserIds.includes(userId)) {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter((id) => id !== userId));
  };

  const selectedMembers = members?.filter((m) =>
    selectedUserIds.includes(m.userId),
  ) || [];

  const availableMembers = members?.filter(
    (m) => !selectedUserIds.includes(m.userId) && m.userId !== currentUser?.id,
  ) || [];

  return (
    <div className="space-y-4">
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <label className="block text-sm font-semibold text-foreground">
          Assign To Team Members
        </label>
        {selectedMembers.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {selectedMembers.length} assigned
          </Badge>
        )}
      </div>

      {/* Selected Users - Enhanced display */}
      <AnimatePresence>
        {selectedMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/50 rounded-lg p-4 border border-primary/10"
          >
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Assigned To ({selectedMembers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member, index) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="default"
                    className="flex items-center gap-2 py-2 px-3 bg-primary hover:bg-primary/90"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs font-bold">
                        {member.firstName?.[0]}
                        {member.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {member.firstName} {member.lastName}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveUser(member.userId)}
                      type="button"
                      className="ml-1 hover:opacity-75 transition p-0.5 rounded hover:bg-white/20"
                      title="Remove assignment"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Selection Dropdown - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        <Select
          onValueChange={(userId) => {
            handleAddUser(userId);
            setOpen(false);
          }}
          disabled={isLoading || availableMembers.length === 0}
          open={open}
          onOpenChange={setOpen}
          value=""
        >
          <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition">
            <SelectValue
              placeholder={
                isLoading
                  ? '⏳ Loading members...'
                  : availableMembers.length === 0
                    ? '✓ All members assigned'
                    : '+ Add team member...'
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {availableMembers.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">
                All other members have been assigned
              </div>
            ) : (
              availableMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs font-bold">
                        {member.firstName?.[0]}
                        {member.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Empty State */}
      {selectedMembers.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30"
        >
          <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            No team members assigned yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Select a member from the dropdown above
          </p>
        </motion.div>
      )}

      {/* Helper text */}
      {selectedMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>
            {selectedMembers.length} team member{selectedMembers.length !== 1 ? 's' : ''} will be assigned to this task
          </span>
        </motion.div>
      )}
    </div>
  );
};
