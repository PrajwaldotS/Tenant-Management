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
import { PlusCircle, MapPin, Gauge } from 'lucide-react';

const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address is too short'),
  managerId: z.string().optional(),
  size: z.string().optional(),
  layoutImage: z.string().optional(),
  floor: z.coerce.number().int().optional().or(z.literal('')),
  googleLocation: z.string().optional(),
  meterNo: z.string().optional(),
  rentIncrement: z.coerce.number().min(0).optional().or(z.literal('')),
  rentIncrementType: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function PropertiesPage() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '', address: '', managerId: '',
      size: '', layoutImage: '', floor: '' as any,
      googleLocation: '', meterNo: '',
      rentIncrement: '' as any, rentIncrementType: '',
    },
  });

  const fetchData = async () => {
    try {
      const [propRes, userRes] = await Promise.all([
        api.get('/properties'),
        user?.role === 'ADMIN' ? api.get('/users?limit=100') : Promise.resolve(null)
      ]);
      if (propRes.data.success) {
         setProperties(propRes.data.data);
      }
      if (userRes && userRes.data.success) {
        // Filter users who can be managers
        const possibleManagers = userRes.data.data.filter((u: any) => u.isActive && (u.role === 'MANAGER' || u.role === 'ADMIN'));
        setManagers(possibleManagers);
      }
    } catch (error: any) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'MANAGER'].includes(user.role)) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const onSubmit = async (data: PropertyFormValues) => {
    if (!user?.id) {
      toast.error('Session expired. Please re-login.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        address: data.address,
        ownerId: user.id,
        ...(data.managerId && data.managerId !== 'none' ? { managerId: data.managerId } : {}),
      };

      // Add optional fields only if they have values
      if (data.size) payload.size = data.size;
      if (data.layoutImage) payload.layoutImage = data.layoutImage;
      if (data.floor !== '' && data.floor !== undefined) payload.floor = Number(data.floor);
      if (data.googleLocation) payload.googleLocation = data.googleLocation;
      if (data.meterNo) payload.meterNo = data.meterNo;
      if (data.rentIncrement !== '' && data.rentIncrement !== undefined) payload.rentIncrement = Number(data.rentIncrement);
      if (data.rentIncrementType && data.rentIncrementType !== 'none') payload.rentIncrementType = data.rentIncrementType;

      await api.post('/properties', payload);
      toast.success('Property created successfully');
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === 'COLLECTOR') {
    return <div className="p-4 text-rose-500 font-medium">Access Denied.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
        
        {user?.role === 'ADMIN' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
                <PlusCircle className="h-4 w-4" /> Add Property
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Property</DialogTitle>
                <DialogDescription>Add a new building or property unit with all details.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                  {/* Row 1: Name + Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Name *</FormLabel>
                          <FormControl><Input placeholder="Sunrise Apartments" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address *</FormLabel>
                          <FormControl><Input placeholder="123 Main St, Block A" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Size + Floor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <FormControl><Input placeholder="1200 sq ft" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="floor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor</FormLabel>
                          <FormControl><Input type="number" placeholder="3" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Meter No + Manager */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="meterNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meter No.</FormLabel>
                          <FormControl><Input placeholder="MTR-00452" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="managerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Manager</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Manager (Self Managed)</SelectItem>
                              {managers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 4: Rent Increment Value + Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="rentIncrement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rent Increment</FormLabel>
                          <FormControl><Input type="number" step="0.01" placeholder="5" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="rentIncrementType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Increment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Not Set</SelectItem>
                              <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                              <SelectItem value="AMOUNT">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 5: Google Location */}
                  <FormField
                    control={form.control as any}
                    name="googleLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps Location (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://maps.google.com/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Row 6: Layout Image URL */}
                  <FormField
                    control={form.control as any}
                    name="layoutImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layout Image URL (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://example.com/layout.png" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Property'}
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
          <CardTitle>Property Directory</CardTitle>
          <CardDescription>View and manage your registered properties.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-4">Loading properties...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Meter No.</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Rent Increment</TableHead>
                    <TableHead>Tenants</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center">No properties found</TableCell></TableRow>
                  ) : (
                    properties.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.address}</TableCell>
                        <TableCell>{p.size || '—'}</TableCell>
                        <TableCell>{p.floor ?? '—'}</TableCell>
                        <TableCell>{p.meterNo || '—'}</TableCell>
                        <TableCell>{p.manager?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          {p.rentIncrement
                            ? `${Number(p.rentIncrement)}${p.rentIncrementType === 'PERCENTAGE' ? '%' : ' ₹'}`
                            : '—'}
                        </TableCell>
                        <TableCell>{p._count?.tenants || 0}</TableCell>
                        <TableCell>
                          {p.googleLocation ? (
                            <a href={p.googleLocation} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Map
                            </a>
                          ) : '—'}
                        </TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
