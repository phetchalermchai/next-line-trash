// file: app/(private)/admin/users/banned/page.tsx
import ManageUsersPage from "@/components/users/ManageUsers";


export default function BannedUsersPage() {

  return <ManageUsersPage initialStatus="BANNED" />;
}
