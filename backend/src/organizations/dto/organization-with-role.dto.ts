export class OrganizationWithRoleDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  plan: string;
  maxUsers: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRole: {
    id: string;
    name: string;
    slug: string;
  };
}
