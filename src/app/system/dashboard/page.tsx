import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, DollarSign, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Overview of your organization's performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">Download Report</Button>
                    <Button>New Project</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-emerald-500 flex items-center font-medium"><ArrowUpRight size={12} /> +20.1%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-emerald-500 flex items-center font-medium"><ArrowUpRight size={12} /> +180.1%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-rose-500 flex items-center font-medium"><ArrowDownRight size={12} /> -4.5%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-emerald-500 flex items-center font-medium"><ArrowUpRight size={12} /> +201</span> since last hour
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Large Chart Area */}
                <Card className="col-span-4 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            Monthly revenue breakdown for the current fiscal year.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                         {/* Placeholder for Chart */}
                         <div className="h-[300px] w-full bg-muted/20 rounded-lg flex items-center justify-center border border-dashed border-border">
                            <p className="text-muted-foreground text-sm">Interactive Chart Component</p>
                         </div>
                    </CardContent>
                </Card>

                {/* Recent Sales / Activity */}
                <Card className="col-span-3 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            You made 265 sales this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        OM
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">Olivia Martin</p>
                                        <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                                    </div>
                                    <div className="ml-auto font-medium">+$1,999.00</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
