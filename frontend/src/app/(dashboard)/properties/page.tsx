// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
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
import { PlusCircle, MapPin, ImageIcon, Images, Search, Eye } from 'lucide-react';

const propertySchema = z.object({
  buildingName: z.string().optional(),
  unitType: z.enum(['SHOP', 'HOUSE'], { required_error: 'Select Shop or House' }),
  unitName: z.string().min(1, 'Unit name is required'),
  address: z.string().min(5, 'Address is too short'),
  managerId: z.string().optional(),
  size: z.string().optional(),
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      buildingName: '', unitType: undefined, unitName: '',
      address: '', managerId: '',
      size: '', floor: '' as any,
      googleLocation: '', meterNo: '',
      rentIncrement: '' as any, rentIncrementType: '',
    },
  });

  const fetchData = async (forceReload = false) => {
    try {
      if (!forceReload) {
        const cachedProp = sessionStorage.getItem('properties_data');
        const cachedManagers = sessionStorage.getItem('managers_data');
        if (cachedProp) {
          setProperties(JSON.parse(cachedProp));
          if (cachedManagers) setManagers(JSON.parse(cachedManagers));
          setLoading(false);
          return;
        }
      }

      const [propRes, userRes] = await Promise.all([
        api.get('/properties'),
        user?.role === 'ADMIN' ? api.get('/users?limit=100') : Promise.resolve(null)
      ]);
      if (propRes.data.success) {
         setProperties(propRes.data.data);
         sessionStorage.setItem('properties_data', JSON.stringify(propRes.data.data));
      }
      if (userRes && userRes.data.success) {
        const possibleManagers = userRes.data.data.filter((u: any) => u.isActive && (u.role === 'MANAGER' || u.role === 'ADMIN'));
        setManagers(possibleManagers);
        sessionStorage.setItem('managers_data', JSON.stringify(possibleManagers));
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

    const handleReload = () => {
      if (user && ['ADMIN', 'MANAGER'].includes(user.role)) {
        setLoading(true);
        fetchData(true);
      }
    };

    window.addEventListener('dashboard-reload', handleReload);
    return () => window.removeEventListener('dashboard-reload', handleReload);
  }, [user]);

  const onSubmit = async (data: PropertyFormValues) => {
    if (!user?.id) {
      toast.error('Session expired. Please re-login.');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.buildingName) formData.append('buildingName', data.buildingName);
      formData.append('unitType', data.unitType);
      formData.append('unitName', data.unitName);
      formData.append('address', data.address);
      formData.append('ownerId', user.id);

      if (data.managerId && data.managerId !== 'none') formData.append('managerId', data.managerId);
      if (data.size) formData.append('size', data.size);
      if (data.floor !== '' && data.floor !== undefined) formData.append('floor', String(data.floor));
      if (data.googleLocation) formData.append('googleLocation', data.googleLocation);
      if (data.meterNo) formData.append('meterNo', data.meterNo);
      if (data.rentIncrement !== '' && data.rentIncrement !== undefined) formData.append('rentIncrement', String(data.rentIncrement));
      if (data.rentIncrementType && data.rentIncrementType !== 'none') formData.append('rentIncrementType', data.rentIncrementType);

      // Attach layout image file if selected (single)
      if (imageFile) {
        formData.append('layoutImage', imageFile);
      }

      // Attach property photos if selected (multiple)
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append('images', file);
        });
      }

      await api.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Property created successfully');
      setIsDialogOpen(false);
      form.reset();
      setImageFile(null);
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imagesInputRef.current) imagesInputRef.current.value = '';
      fetchData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === 'COLLECTOR') {
    return <div className="p-4 text-rose-500 font-medium">Access Denied.</div>;
  }

  // Filter properties logic
  const filteredProperties = properties.filter((p) => {
    const isOccupied = p._count?.tenants > 0;
    
    // Status match
    if (filterStatus === 'VACANT' && isOccupied) return false;
    if (filterStatus === 'OCCUPIED' && !isOccupied) return false;

    // Type match
    if (filterType !== 'ALL' && p.unitType !== filterType) return false;

    // General string search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        p.buildingName?.toLowerCase().includes(q) ||
        p.unitName?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q) ||
        String(p.floor || '').includes(q) ||
        String(p.meterNo || '').toLowerCase().includes(q);
      
      if (!matches) return false;
    }

    return true;
  });

  // Helper to display property name as "Building > Unit" or just "Unit"
  const displayName = (p: any) => {
    if (p.buildingName) {
      return `${p.buildingName} › ${p.unitName}`;
    }
    return p.unitName;
  };

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
                <DialogDescription>Add a new shop or house unit to the system.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                  {/* Row 1: Building Name (optional) */}
                  <FormField
                    control={form.control as any}
                    name="buildingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g. Sunrise Apartments, Mall Plaza" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Row 2: Unit Type + Unit Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="unitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select Shop or House" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SHOP">Shop</SelectItem>
                              <SelectItem value="HOUSE">House</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="unitName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Name *</FormLabel>
                          <FormControl><Input placeholder="e.g. Shop 101, Flat 2A" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Address */}
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

                  {/* Row 4: Size + Floor */}
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

                  {/* Row 5: Meter No + Manager */}
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

                  {/* Row 6: Rent Increment Value + Type */}
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

                  {/* Row 7: Google Location */}
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

                  {/* Row 8: Layout Image Upload (Single - floor plan) */}
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Layout Image (Optional — single floor plan)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <p className="text-xs text-muted-foreground mt-1">Selected: {imageFile.name}</p>
                    )}
                  </div>

                  {/* Row 9: Property Photos (Multiple) */}
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Property Photos (Optional — multiple images)
                    </label>
                    <input
                      ref={imagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                      onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                    />
                    {imageFiles.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{imageFiles.length} file(s) selected</p>
                    )}
                  </div>

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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search building, unit, address, sq ft size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="VACANT">Vacant</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Unit Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SHOP">Shop</SelectItem>
                <SelectItem value="HOUSE">House</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center p-4">Loading properties...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center">No properties found matching filters</TableCell></TableRow>
                  ) : (
                    filteredProperties.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.buildingName || '—'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.unitType === 'SHOP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {p.unitType}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{p.unitName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${p._count?.tenants > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {p._count?.tenants > 0 ? 'Occupied' : 'Vacant'}
                          </span>
                        </TableCell>
                        <TableCell>{p.address}</TableCell>
                        <TableCell>{p.size ? `${p.size}` : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedProperty(p); setIsDetailsOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProperty && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedProperty.buildingName ? `${selectedProperty.buildingName} › ` : ''}{selectedProperty.unitName}</DialogTitle>
              <DialogDescription>Detailed view of this property unit.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg"><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold">{selectedProperty.unitType}</p></div>
                <div className="bg-muted/50 p-3 rounded-lg"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{selectedProperty._count?.tenants > 0 ? 'Occupied' : 'Vacant'}</p></div>
                <div className="bg-muted/50 p-3 rounded-lg"><p className="text-xs text-muted-foreground">Floor</p><p className="font-semibold">{selectedProperty.floor ?? '—'}</p></div>
                <div className="bg-muted/50 p-3 rounded-lg"><p className="text-xs text-muted-foreground">Size</p><p className="font-semibold">{selectedProperty.size || '—'}</p></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold border-b pb-2">Financials & Details</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Rent Increment:</span> {selectedProperty.rentIncrement ? `${Number(selectedProperty.rentIncrement)}${selectedProperty.rentIncrementType === 'PERCENTAGE' ? '%' : ' ₹'}` : 'Not set'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Meter No:</span> {selectedProperty.meterNo || 'Not set'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Total Tenants:</span> {selectedProperty._count?.tenants || 0}</p>
                </div>
                <div className="border p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold border-b pb-2">Location Information</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Address:</span> {selectedProperty.address}</p>
                  {selectedProperty.googleLocation ? (
                    <a href={selectedProperty.googleLocation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm mt-1">
                      <MapPin className="h-4 w-4" /> Open in Google Maps
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4 opacity-50" /> No map link provided
                    </p>
                  )}
                </div>
              </div>

              {selectedProperty.layoutImage ? (
                <div className="border p-4 rounded-lg">
                  <h4 className="font-semibold border-b pb-2 mb-3">Layout / Floor Plan</h4>
                  <a href={selectedProperty.layoutImage} target="_blank" rel="noopener noreferrer">
                    <img src={selectedProperty.layoutImage} alt="Layout" className="rounded-lg max-h-64 w-full object-cover border hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              ) : (
                <div className="border p-4 rounded-lg bg-muted/20 flex flex-col items-center justify-center py-8">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No layout image provided</p>
                </div>
              )}

              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <div className="border p-4 rounded-lg">
                  <h4 className="font-semibold border-b pb-2 mb-3">Property Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Photo ${i+1}`} className="rounded-lg h-32 w-full object-cover border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border p-4 rounded-lg bg-muted/20 flex flex-col items-center justify-center py-8">
                  <Images className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No property photos provided</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
