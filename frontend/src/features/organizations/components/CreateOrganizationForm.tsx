import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrganization, useGenerateSlug } from '../hooks/useOrganizations';
import type { CreateOrganizationDto } from '../api/organizationsApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

interface ServerFieldError {
  field: string;
  errors: string[];
}

interface ServerValidationError {
  message: string;
  errors: ServerFieldError[];
}

interface CreateOrganizationFormProps {
  onSuccess?: (organizationId: string) => void;
}

export const CreateOrganizationForm = ({ onSuccess }: CreateOrganizationFormProps) => {
    const navigate = useNavigate();
    const createOrgMutation = useCreateOrganization();
    const generateSlugMutation = useGenerateSlug();

    const [formData, setFormData] = useState<CreateOrganizationDto>({
        name: '',
        slug: '',
        description: '',
        website: '',
        logo: '',
    });

    const [errors, setErrors] = useState<Partial<CreateOrganizationDto>>({});

    const validateForm = () => {
        const newErrors: Partial<CreateOrganizationDto> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Organization name is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
            newErrors.slug = 'Slug must be lowercase alphanumeric with hyphens only';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name as keyof CreateOrganizationDto]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleGenerateSlug = async () => {
        if (!formData.name.trim()) {
            setErrors((prev) => ({
                ...prev,
                name: 'Organization name is required to generate slug',
            }));
            return;
        }

        generateSlugMutation.mutate(
            { name: formData.name },
            {
                onSuccess: (response) => {
                    setFormData((prev) => ({
                        ...prev,
                        slug: response.data.slug,
                    }));
                    // Clear slug error if it exists
                    if (errors.slug) {
                        setErrors((prev) => ({
                            ...prev,
                            slug: undefined,
                        }));
                    }
                },
            },
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        createOrgMutation.mutate(formData, {
            onSuccess: (response) => {
                // TanStack Query returns the full AxiosResponse, so we need to access .data
                const org = response.data;
                
                // Call onSuccess callback if provided, otherwise navigate to dashboard
                if (onSuccess) {
                    onSuccess(org.id);
                } else {
                    navigate(`/organizations/${org.id}`);
                }
            },
            onError: (error: unknown) => {
                // Handle server validation errors
                const axiosError = error as { response?: { data?: ServerValidationError } };
                if (axiosError.response?.data?.errors) {
                    const serverErrors: Partial<CreateOrganizationDto> = {};
                    
                    axiosError.response.data.errors.forEach((fieldError: ServerFieldError) => {
                        const fieldName = fieldError.field as keyof CreateOrganizationDto;
                        // Take the first error message for each field
                        serverErrors[fieldName] = fieldError.errors[0];
                    });
                    
                    setErrors(serverErrors);
                }
            },
        });
    };

    return (
        <div className="w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Organization Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                            Organization Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleGenerateSlug}
                            className={`bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white transition-all duration-200 ${
                                errors.name ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                            placeholder="My Company"
                            disabled={createOrgMutation.isPending}
                        />
                        {errors.name && (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                            URL Slug <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="slug"
                                name="slug"
                                type="text"
                                value={formData.slug}
                                onChange={handleChange}
                                className={`bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white transition-all duration-200 flex-1 ${
                                    errors.slug ? 'border-red-300 focus:border-red-500' : ''
                                }`}
                                placeholder="my-company"
                                disabled={true}
                            />
                        </div>
                        {errors.slug && (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white transition-all duration-200 resize-none ${
                                errors.description ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                            placeholder="What does your organization do?"
                            rows={3}
                            disabled={createOrgMutation.isPending}
                        />
                        {errors.description && (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                            Website
                        </Label>
                        <Input
                            id="website"
                            name="website"
                            type="url"
                            value={formData.website}
                            onChange={handleChange}
                            className={`bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white transition-all duration-200 ${
                                errors.website ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                            placeholder="https://example.com"
                            disabled={createOrgMutation.isPending}
                        />
                        {errors.website && (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.website}
                            </p>
                        )}
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2">
                        <Label htmlFor="logo" className="text-sm font-medium text-slate-700">
                            Logo URL
                        </Label>
                        <Input
                            id="logo"
                            name="logo"
                            type="url"
                            value={formData.logo}
                            onChange={handleChange}
                            className={`bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:bg-white transition-all duration-200 ${
                                errors.logo ? 'border-red-300 focus:border-red-500' : ''
                            }`}
                            placeholder="https://example.com/logo.png"
                            disabled={createOrgMutation.isPending}
                        />
                        {errors.logo && (
                            <p className="text-red-600 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.logo}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={createOrgMutation.isPending}
                        className="w-full"
                        size="lg"
                    >
                        {createOrgMutation.isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            'Create Organization'
                        )}
                    </Button>

                    {/* Note */}
                    <p className="text-slate-500 text-xs text-center">
                        <span className="text-red-500">*</span> Required fields
                    </p>
                </form>
            </div>
        </div>
    );
};
