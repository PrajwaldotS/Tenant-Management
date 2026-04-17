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
import { PlusCircle, Printer, CalendarClock } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  tenantId: z.string().min(1, 'Please select a tenant'),
  rentId: z.string().min(1, 'Please select a rent month'),
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
  const [isGeneratingRents, setIsGeneratingRents] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, tenantId: '', rentId: '', method: 'CASH', referenceId: '' },
  });

  const selectedTenantId = form.watch('tenantId');
  const selectedRentId = form.watch('rentId');

  // Auto-fill amount when a specific rent is selected
  useEffect(() => {
    if (selectedRentId && tenantRents.length > 0) {
      const rent = tenantRents.find(r => r.id === selectedRentId);
      if (rent) {
        form.setValue('amount', Number(rent.amount));
      }
    }
  }, [selectedRentId, tenantRents, form]);

  const handleGenerateRents = async () => {
    setIsGeneratingRents(true);
    try {
      const today = new Date();
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-05`;
      
      const res = await api.post('/rents/generate', { month, dueDate });
      if (res.data.success) {
        toast.success(res.data.message || 'Rents generated successfully');
        fetchData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate rents');
    } finally {
      setIsGeneratingRents(false);
    }
  };

  const fetchData = async (forceReload = false) => {
    try {
      // Removed buggy sessionStorage polling to guarantee real-time cross-page sync

      const [paymentsRes, tenantsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/tenants')
      ]);
      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
      if (tenantsRes.data.success) {
        setTenants(tenantsRes.data.data);
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
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateRents} disabled={isGeneratingRents} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <CalendarClock className="h-4 w-4" />
            {isGeneratingRents ? 'Generating...' : 'Generate Rent Cycle'}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
               <span className="flex items-center gap-2">
                 <PlusCircle className="h-4 w-4" /> Record Payment
               </span>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription className="text-base">Apply a payment towards a pending rent and update the ledger.</DialogDescription>
              </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Tenant</FormLabel>
                      <Select 
                        key={`tenant-select-${tenants.length}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {field.value 
                                ? (tenants.find(t => t.id === field.value)?.name || field.value) 
                                : "Choose a tenant"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <span>{t.name} - {t.phone} (₹{t.rentAmount})</span>
                            </SelectItem>
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
                      <Select 
                        key={`rent-select-${selectedTenantId}-${tenantRents.length}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedTenantId || tenantRents.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {field.value 
                                ? (tenantRents.find(r => r.id === field.value)?.generatedMonth || field.value) 
                                : (!selectedTenantId ? "Select a tenant first" : tenantRents.length === 0 ? "No pending rents" : "Select rent to pay")}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantRents.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <span>{r.generatedMonth} - Amt: ₹{r.amount} - {r.status}</span>
                            </SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>A log of all payments received.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageSkeleton />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">No recent payments found</TableCell></TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-sm border border-slate-200 dark:border-slate-700">
                          {p.tenant?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm font-medium border border-blue-100 dark:border-blue-800">
                          {p.rent?.generatedMonth}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded text-sm font-medium border border-violet-100 dark:border-violet-800">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider border ${p.method === 'CASH' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : p.method === 'UPI' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                          {p.method}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-base">
                        <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded text-xs border border-slate-200 dark:border-slate-800">
                          {p.referenceId || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-base font-bold border border-emerald-100 dark:border-emerald-500/20">
                          ₹{Number(p.amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setPrintPayment(p)}>
                          <Printer className="h-4 w-4 mr-2" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Print Dialog */}
      <Dialog open={!!printPayment} onOpenChange={(open) => !open && setPrintPayment(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-2">
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-slate-100 italic">Payment Receipt</DialogTitle>
            <DialogDescription className="text-base font-semibold text-slate-500">Official transaction record for your files.</DialogDescription>
          </DialogHeader>
          <div id="invoice-print-area" className="p-10 bg-white text-black rounded-lg border border-slate-200 shadow-sm mx-auto max-w-3xl">
            <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
              <h2 className="text-3xl font-extrabold uppercase tracking-widest text-slate-800">Rent Receipt</h2>
              <p className="text-base text-slate-500 mt-2 font-medium">Tenant Management System</p>
            </div>
            
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-bold tracking-wider mb-2 uppercase">Received From</p>
                <p className="text-xl font-bold text-slate-800">{printPayment?.tenant?.name}</p>
                <p className="text-sm font-medium text-slate-600">Phone: {printPayment?.tenant?.phone}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-slate-400 font-bold tracking-wider mb-2 uppercase">Receipt Details</p>
                <p className="text-sm text-slate-800"><strong>Date:</strong> {printPayment?.paymentDate ? new Date(printPayment.paymentDate).toLocaleDateString() : ''}</p>
                <p className="text-sm text-slate-800"><strong>Receipt No:</strong> {printPayment?.id?.split('-')[0].toUpperCase()}</p>
              </div>
            </div>

            <table className="w-full mb-10 border-collapse">
              <thead>
                <tr className="border-y-2 border-slate-300 bg-slate-50">
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-5 px-4 text-left font-medium text-slate-800">Rent Payment for Month: <span className="font-bold">{printPayment?.rent?.generatedMonth}</span></td>
                  <td className="py-5 px-4 text-center text-slate-600">{printPayment?.method} {printPayment?.referenceId ? `(${printPayment.referenceId})` : ''}</td>
                  <td className="py-5 px-4 text-right font-bold text-slate-800 text-lg">₹{Number(printPayment?.amount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-10">
              <div className="text-right bg-slate-50 p-4 rounded-lg border border-slate-200 w-64 shadow-sm">
                <p className="text-xs font-bold text-slate-500 tracking-wider mb-1">TOTAL AMOUNT PAID</p>
                <p className="text-3xl font-extrabold text-emerald-600">₹{Number(printPayment?.amount).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-16 text-center text-xs text-slate-400 font-medium">
              <p>This is a computer generated receipt and does not require a physical signature.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 print:hidden">
             <Button variant="outline" onClick={() => setPrintPayment(null)}>Close</Button>
             <Button onClick={() => {
                const printContent = document.getElementById('invoice-print-area');
                const windowPrint = window.open('', '', 'width=900,height=700');
                if (windowPrint && printContent) {
                  windowPrint.document.write(`
                    <html>
                      <head>
                        <title>Rent Receipt - ${printPayment?.tenant?.name}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                          @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                          }
                        </style>
                      </head>
                      <body class="p-8 pb-16 bg-white">
                        ${printContent.innerHTML}
                        <script>
                          setTimeout(() => {
                            window.print();
                            window.close();
                          }, 500);
                        </script>
                      </body>
                    </html>
                  `);
                  windowPrint.document.close();
                }
             }}>
               <Printer className="h-4 w-4 mr-2" /> Print Receipt
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
