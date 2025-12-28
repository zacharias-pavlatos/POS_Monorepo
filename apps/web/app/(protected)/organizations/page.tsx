// import CreateInvitation from './_components/create-organization';
import SelectOrganization from './_components/select-organization';

export default async function OrganizationsPage() {
  //   const organizationOfUser = await getUsersOrganizations();
  //   console.log(organizationOfUser);
  return (
    <>
      {/* <CreateInvitation />; */}
      <SelectOrganization />
    </>
  );
}
