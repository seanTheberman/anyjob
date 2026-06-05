"use client";

import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewAssistanceRequestPage() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !details.trim()) return;
    setSubmitted(true);
  }

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
          <CardContent>
            {submitted ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Your support request was recorded for this test session. The support team can now review the submitted details.
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-4">
                <Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
                <Textarea placeholder="Tell us what happened" className="min-h-40" value={details} onChange={(event) => setDetails(event.target.value)} required />
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Submit request
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
