import { z } from 'zod';

/** 워크스페이스 생성 검증 스키마 */
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, '워크스페이스 이름은 2자 이상이어야 합니다').max(50),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/, '영문 소문자, 숫자, 하이픈만 사용 가능합니다'),
});

/** 고객 생성 검증 스키마 */
export const createCustomerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100),
  email: z.string().email('올바른 이메일을 입력해주세요').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  company_name: z.string().max(100).optional().or(z.literal('')),
  position: z.string().max(50).optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  memo: z.string().max(1000).optional().or(z.literal('')),
  source: z.string().max(50).optional().or(z.literal('')),
});

/** 프로젝트 생성 검증 스키마 */
export const createProjectSchema = z.object({
  name: z.string().min(1, '프로젝트 이름을 입력해주세요').max(100),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planning'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.number().int().min(0).optional(),
  currency: z.string().default('KRW'),
  cooltime_days: z.number().int().min(1).max(365).default(5),
  tags: z.array(z.string()).default([]),
});

/** 거래 생성 검증 스키마 */
export const createDealSchema = z.object({
  title: z.string().min(1, '거래명을 입력해주세요').max(200),
  customer_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid(),
  stage: z.string().min(1),
  amount: z.number().int().min(0).optional(),
  currency: z.string().default('KRW'),
  probability: z.number().int().min(0).max(100).default(50),
  expected_close_date: z.string().optional().or(z.literal('')),
});

/** 활동 생성 검증 스키마 */
export const createActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  customer_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  scheduled_at: z.string().optional().or(z.literal('')),
});

/** 기능 요청 생성 검증 스키마 */
export const createFeatureRequestSchema = z.object({
  title: z.string().min(5, '제목은 5자 이상이어야 합니다').max(200),
  description: z.string().min(10, '설명은 10자 이상이어야 합니다').max(5000),
  category: z.enum(['customer', 'pipeline', 'project', 'ai', 'nudge', 'other']).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateFeatureRequestInput = z.infer<typeof createFeatureRequestSchema>;
