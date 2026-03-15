'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ConnectCustomerButtonProps {
  slug: string;
  projectId: string;
  workspaceId: string;
  alreadyConnectedIds: string[];
}

export default function ConnectCustomerButton({
  slug,
  projectId,
  workspaceId,
  alreadyConnectedIds,
}: ConnectCustomerButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<
    { id: string; name: string; company_name: string | null }[]
  >([]);
  const [fetching, setFetching] = useState(false);
  const t = useTranslations('projects.connectCustomer');

  const fetchCustomers = async () => {
    setFetching(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('customers')
        .select('id, name, company_name')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null);

      if (alreadyConnectedIds.length > 0) {
        query = query.not('id', 'in', `(${alreadyConnectedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setFetching(false);
    }
  };

  const connectCustomer = async (customerId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('project_customers').insert({
        project_id: projectId,
        customer_id: customerId,
        role: 'stakeholder',
      });

      if (error) throw error;

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error connecting customer:', error);
      alert(t('connectError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          fetchCustomers();
        }}
        className="text-xs font-medium text-primary hover:underline"
      >
        {t('connect')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('title')}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
              {fetching ? (
                <p className="text-center py-4 text-sm text-muted-foreground">{t('loading')}</p>
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => connectCustomer(customer.id)}
                    disabled={loading}
                    className="flex flex-col items-start p-3 rounded-xl border border-border hover:bg-muted transition-colors text-left"
                  >
                    <span className="font-medium text-sm">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.company_name || '-'}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-center py-4 text-sm text-muted-foreground">{t('noCustomers')}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-10 px-4 rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
