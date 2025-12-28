//import { redirect } from "next/navigation";

import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function CreateOrganization() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a new Organization</CardTitle>
        <CardDescription>the new organization ......</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateOrganizationForm />
      </CardContent>
    </Card>
  );
}
