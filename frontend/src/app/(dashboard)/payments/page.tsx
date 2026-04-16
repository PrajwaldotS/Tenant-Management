// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  tenantId: z.string().uuid('Please select a tenant'),
  rentId: z.string().uuid('Please select a rent month'),
  method: z.enum(['CASH', 'UPI', 'BANK']),
  referenceId: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantRents, setTenantRents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, tenantId: '', rentId: '', method: 'CASH', referenceId: '' },
  });

  const selectedTenantId = form.watch('tenantId');

  const fetchData = async (forceReload = false) => {
    try {
      if (!forceReload) {
        const cachedPayments = sessionStorage.getItem('payments_data');
        const cachedTenants = sessionStorage.getItem('payments_tenants_data');
        if (cachedPayments) {
          setPayments(JSON.parse(cachedPayments));
          if (cachedTenants) setTenants(JSON.parse(cachedTenants));
          setLoading(false);
          return;
        }
      }

      const [paymentsRes, tenantsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/tenants')
      ]);
      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
        sessionStorage.setItem('payments_data', JSON.stringify(paymentsRes.data.data));
      }
      if (tenantsRes.data.success) {
        setTenants(tenantsRes.data.data);
        sessionStorage.setItem('payments_tenants_data', JSON.stringify(tenantsRes.data.data));
      }
    } catch (error: any) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleReload = () => {
      setLoading(true);
      fetchData(true);
    };

    window.addEventListener('dashboard-reload', handleReload);
    return () => window.removeEventListener('dashboard-reload', handleReload);
  }, []);

  // Fetch rents when tenant changes
  useEffect(() => {
    async function fetchRentsForTenant() {
      if (!selectedTenantId) {
        setTenantRents([]);
        return;
      }
      try {
        const res = await api.get(`/rents?tenantId=${selectedTenantId}`);
        if (res.data.success) {
          // Only show rents that are not fully PAID
          const pendingRents = res.data.data.filter((r: any) => r.status !== 'PAID');
          setTenantRents(pendingRents);
        }
      } catch (e) {
        toast.error('Failed to load rents for this tenant');
      }
    }
    fetchRentsForTenant();
    form.setValue('rentId', ''); // Reset rent selection when tenant changes
  }, [selectedTenantId, form]);

  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/payments', data);
      toast.success('Payment recorded successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
              <PlusCircle className="h-4 w-4" /> Record Payment
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>Apply a payment towards a pending rent.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Tenant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Choose a tenant" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name} (₹{t.rentAmount})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="rentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Rent Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedTenantId || tenantRents.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedTenantId ? "Select a tenant first" : tenantRents.length === 0 ? "No pending rents" : "Select rent to pay"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantRents.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.generatedMonth} - Amt: ₹{r.amount} - {r.status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="BANK">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="referenceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference ID (Optional)</FormLabel>
                      <FormControl><Input placeholder="UPI Ref / Cheque No" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>A log of all payments received.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-4">Loading payments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rent Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Ref ID</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No recent payments found</TableCell></TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.tenant?.name || 'Unknown'}</TableCell>
                      <TableCell>{p.rent?.generatedMonth}</TableCell>
                      <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>{p.referenceId || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        ₹{Number(p.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
