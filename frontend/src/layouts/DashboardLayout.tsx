import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import TopNavbar from '@/components/layout/TopNavbar'
import ProjectWorkspaceNav from '@/components/layout/ProjectWorkspaceNav'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <TopNavbar />
          <ProjectWorkspaceNav />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
