import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOrganizationDto,
  InviteMemberDto,
  GenerateSlugDto,
  OrganizationWithRole,
} from '../api/organizationsApi';
import { organizationsApi } from '../api/organizationsApi';

// Get all organizations
export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.getAll(),
  });
};

// Get single organization by ID
export const useOrganization = (id: string | undefined) => {
  return useQuery<OrganizationWithRole>({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const response = await organizationsApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });
};

// Get organization by slug
export const useOrganizationBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['organizations', 'slug', slug],
    queryFn: async () => {
      const response = await organizationsApi.getBySlug(slug!);
      return response.data;
    },
    enabled: !!slug,
  });
};

// Create organization
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationDto) =>
      organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

// Generate slug from organization name
export const useGenerateSlug = () => {
  return useMutation({
    mutationFn: (data: GenerateSlugDto) =>
      organizationsApi.generateSlug(data),
  });
};

// Update organization
export const useUpdateOrganization = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateOrganizationDto>) =>
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

// Delete organization
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

// Get organization members
export const useOrganizationMembers = (orgId: string | undefined) => {
  return useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: async () => {
      const response = await organizationsApi.getMembers(orgId!);
      return response.data;
    },
    enabled: !!orgId,
  });
};

// Invite member to organization
export const useInviteMember = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberDto) =>
      organizationsApi.inviteMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', orgId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-members', orgId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pending-invitations', orgId],
      });
    },
  });
};

// Remove member from organization
export const useRemoveMember = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      organizationsApi.removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', orgId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-members', orgId],
      });
    },
  });
};

// Update member role
export const useUpdateMemberRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      organizationsApi.updateMemberRole(orgId, userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', orgId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-members', orgId],
      });
    },
  });
};

// Update member status
export const useUpdateMemberStatus = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      organizationsApi.updateMemberStatus(orgId, userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', orgId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization-members', orgId],
      });
    },
  });
};
