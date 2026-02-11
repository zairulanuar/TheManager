"use client";
import { uploadModuleAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ModuleManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload ERP/CMS Module</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={uploadModuleAction} className="space-y-4">
          <Input type="file" name="moduleZip" accept=".zip" />
          <Button className="bg-blue-600 hover:bg-blue-700">Install ZIP</Button>
        </form>
      </CardContent>
    </Card>
  );
}