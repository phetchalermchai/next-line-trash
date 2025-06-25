// file: app/(private)/admin/users/banned/page.tsx
import ManageUsersPage from "../manage/page";


export default function BannedUsersPage() {

  return <ManageUsersPage initialStatus="BANNED" />;
}
