"use client";

import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewAssistanceRequestPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dashboard/assistance" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to assistance
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>New support request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Subject" />
            <Textarea placeholder="Tell us what happened" className="min-h-40" />
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Submit request
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
