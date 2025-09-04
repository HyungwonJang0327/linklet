'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">Auth Debug Page</h1>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Authentication State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-300">Loading:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${isLoading ? 'bg-yellow-600' : 'bg-gray-600'}`}>
                {isLoading ? 'true' : 'false'}
              </span>
            </div>
            
            <div>
              <span className="text-slate-300">Authenticated:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${isAuthenticated ? 'bg-green-600' : 'bg-red-600'}`}>
                {isAuthenticated ? 'true' : 'false'}
              </span>
            </div>
          </div>
          
          <div>
            <span className="text-slate-300">User:</span>
            <pre className="mt-2 p-3 bg-slate-900 rounded text-green-400 text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          {isAuthenticated && (
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}