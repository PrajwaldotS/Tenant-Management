'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Users, CreditCard, Banknote, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from '@/components/ui/table';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingRents: number;
  overdueRents: number;
  recentPayments: Array<{
    id: string;
    amount: string;
    paymentDate: string;
    method: string;
    tenant: { name: string };
    rent: { generatedMonth: string };
  }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats(forceReload = false) {
      try {
        if (!forceReload) {
          const cachedStats = sessionStorage.getItem('dashboard_stats_data');
          if (cachedStats) {
            setStats(JSON.parse(cachedStats));
            setLoading(false);
            return;
          }
        }

        const response = await api.get('/reports/stats');
        if (response.data.success) {
          setStats(response.data.data);
          sessionStorage.setItem('dashboard_stats_data', JSON.stringify(response.data.data));
        }
      } catch (error: any) {
         if (error.response?.status !== 403) {
            toast.error("Failed to load dashboard statistics");
         }
      } finally {
        setLoading(false);
      }
    }

    if (user && ['ADMIN', 'MANAGER'].includes(user.role)) {
      fetchStats();
    } else {
      setLoading(false);
    }

    const handleReload = () => {
      if (user && ['ADMIN', 'MANAGER'].includes(user.role)) {
        setLoading(true);
        fetchStats(true);
      }
    };

    window.addEventListener('dashboard-reload', handleReload);
    return () => window.removeEventListener('dashboard-reload', handleReload);
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading dashboard...</div>;
  }

  // COLLECTOR shouldn't see full dashboard overview, just a welcome
  if (user?.role === 'COLLECTOR') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.name}. You are logged in as a Collector.</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#f59e0b', '#ef4444', '#10b981']; // Pending (Amber), Overdue (Red), Paid (Emerald - assumed 0 for chart sake as it's not in stats)

  const chartData = stats ? [
    { name: 'Pending Rents', value: stats.pendingRents },
    { name: 'Overdue Rents', value: stats.overdueRents },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.monthlyRevenue.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Rent Status Details</CardTitle>
            <CardDescription>
              Overview of pending and overdue rents across all properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px]">
                {chartData.every(d => d.value === 0) ? (
                   <div className="flex h-full items-center justify-center text-muted-foreground">No pending or overdue rents</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                )}
             </div>
             
             <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex justify-center mb-2 text-amber-600"><Clock className="w-5 h-5"/></div>
                    <p className="text-sm text-amber-600 font-medium">Pending Rents</p>
                    <p className="text-2xl font-bold text-amber-700">{stats?.pendingRents || 0}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                     <div className="flex justify-center mb-2 text-red-600"><AlertCircle className="w-5 h-5"/></div>
                    <p className="text-sm text-red-600 font-medium">Overdue Rents</p>
                    <p className="text-2xl font-bold text-red-700">{stats?.overdueRents || 0}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              You received {stats?.recentPayments?.length || 0} payments recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rent Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.recentPayments || stats.recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No recent payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.tenant.name}</TableCell>
                      <TableCell>{payment.rent.generatedMonth}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="text-right">₹{Number(payment.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
