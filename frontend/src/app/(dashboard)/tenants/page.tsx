// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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
import { PageSkeleton } from '@/components/ui/page-skeleton';

const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  rentAmount: z.coerce.number().min(1, 'Rent must be greater than 0'),
  propertyId: z.string().uuid('Please select a valid property'),
  moveInDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('ALL');

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: '', phone: '', rentAmount: 0, propertyId: '', moveInDate: '' },
  });

  const fetchData = async (forceReload = false) => {
    try {
      if (!forceReload) {
        const cachedTenants = sessionStorage.getItem('tenants_data');
        const cachedProps = sessionStorage.getItem('tenants_properties_data');
        if (cachedTenants) {
          setTenants(JSON.parse(cachedTenants));
          if (cachedProps) setProperties(JSON.parse(cachedProps));
          setLoading(false);
          return;
        }
      }

      const [tenantsRes, propsRes] = await Promise.all([
        api.get('/tenants'),
        ['ADMIN', 'MANAGER'].includes(user?.role || '') ? api.get('/properties') : Promise.resolve(null)
      ]);
      if (tenantsRes.data.success) {
         setTenants(tenantsRes.data.data);
         sessionStorage.setItem('tenants_data', JSON.stringify(tenantsRes.data.data));
      }
      if (propsRes && propsRes.data.success) {
         setProperties(propsRes.data.data);
         sessionStorage.setItem('tenants_properties_data', JSON.stringify(propsRes.data.data));
      }
    } catch (error: any) {
      toast.error('Failed to load tenants data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
    
    const handleReload = () => {
      if (user) {
        setLoading(true);
        fetchData(true);
      }
    };

    window.addEventListener('dashboard-reload', handleReload);
    return () => window.removeEventListener('dashboard-reload', handleReload);
  }, [user]);

  const onSubmit = async (data: TenantFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure moveInDate is an ISO string before submitting. Note: HTML date picker uses YYYY-MM-DD
      const payload = { ...data, moveInDate: new Date(data.moveInDate).toISOString() };
      await api.post('/tenants', payload);
      toast.success('Tenant added successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
        
        {user && ['ADMIN', 'MANAGER'].includes(user.role) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
                <PlusCircle className="h-4 w-4" /> Add Tenant
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription className="text-base">Register a new tenant and assign them to a property unit.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="rentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rent Amount (₹)</FormLabel>
                          <FormControl><Input type="number" placeholder="10000" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control as any}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Property</FormLabel>
                        <Select 
                          key={`property-select-${properties.length}`}
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {field.value 
                                  ? (() => {
                                      const p = properties.find(p => p.id === field.value);
                                      if (!p) return field.value;
                                      return p.buildingName ? `${p.buildingName} › ${p.unitName}` : p.unitName;
                                    })()
                                  : "Select a property"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.buildingName ? `${p.buildingName} › ${p.unitName}` : p.unitName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="moveInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Move-in Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Tenant'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Tenant Directory</CardTitle>
              <CardDescription>View all active tenants and their assigned properties.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search tenant or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-[250px]"
              />
              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Buildings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Buildings</SelectItem>
                  {Array.from(new Set(properties.map(p => p.buildingName).filter(Boolean))).map((building: any) => (
                    <SelectItem key={building} value={building}>{building}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Rent Amount</TableHead>
                  <TableHead>Move-in Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const filteredTenants = tenants.filter((tenant) => {
                    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || tenant.phone.includes(searchTerm);
                    const buildingName = tenant.property?.buildingName;
                    const matchesBuilding = filterBuilding === 'ALL' || buildingName === filterBuilding;
                    return matchesSearch && matchesBuilding;
                  });

                  if (filteredTenants.length === 0) {
                    return <TableRow><TableCell colSpan={5} className="text-center">No tenants found</TableCell></TableRow>;
                  }

                  return filteredTenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase shadow-sm">
                            {t.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-base">{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-sm border border-slate-200 dark:border-slate-800 rounded">
                          {t.phone}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1.5 rounded text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                           {t.property?.buildingName ? `${t.property.buildingName} › ${t.property.unitName}` : (t.property?.unitName || 'Unknown')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-base font-bold border border-emerald-100 dark:border-emerald-500/20">
                          ₹{Number(t.rentAmount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                         <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-mono text-sm border border-slate-200 dark:border-slate-800 rounded">
                           {new Date(t.moveInDate).toLocaleDateString()}
                         </span>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
