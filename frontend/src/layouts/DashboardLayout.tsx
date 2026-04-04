import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import TopNavbar from '@/components/layout/TopNavbar'
import ProjectWorkspaceNav from '@/components/layout/ProjectWorkspaceNav'

export default function DashboardLayout() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
        <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-500/8 blur-3xl" />
      </div>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="relative flex min-h-screen flex-1 flex-col">
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
