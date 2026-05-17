"use client";

import { Shield, Users, DollarSign, TrendingUp, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-2xl font-bold text-red-600">
                                AnyJob
                            </Link>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                Admin
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Settings className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage the AnyJob platform</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">1,234</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Providers</p>
                                <p className="text-2xl font-bold text-gray-900">456</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">£12,345</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Growth</p>
                                <p className="text-2xl font-bold text-gray-900">+23%</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link href="/admin/users" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Manage Users</span>
                                </div>
                            </Link>
                            <Link href="/admin/providers" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Manage Providers</span>
                                </div>
                            </Link>
                            <Link href="/admin/jobs" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Manage Jobs</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            <div className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">New provider registration</p>
                                        <p className="text-sm text-gray-500">John Doe - Handyman</p>
                                    </div>
                                    <span className="text-xs text-gray-500">2h ago</span>
                                </div>
                            </div>
                            <div className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Job completed</p>
                                        <p className="text-sm text-gray-500">Furniture Assembly - £95</p>
                                    </div>
                                    <span className="text-xs text-gray-500">5h ago</span>
                                </div>
                            </div>
                            <div className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">New user signup</p>
                                        <p className="text-sm text-gray-500">Sarah Johnson</p>
                                    </div>
                                    <span className="text-xs text-gray-500">1d ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
