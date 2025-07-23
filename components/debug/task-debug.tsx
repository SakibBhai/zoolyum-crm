"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TaskDebug() {
    const [tasks, setTasks] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch tasks
                const tasksResponse = await fetch('/api/tasks')
                const tasksData = await tasksResponse.json()
                console.log('Raw tasks data:', tasksData)
                setTasks(tasksData)

                // Fetch projects
                const projectsResponse = await fetch('/api/projects')
                const projectsData = await projectsResponse.json()
                console.log('Raw projects data:', projectsData)
                setProjects(projectsData)
            } catch (error) {
                console.error('Error fetching debug data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) return <div>Loading debug data...</div>

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Debug: Tasks Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(tasks.slice(0, 3), null, 2)}
                    </pre>
                    <p className="mt-2 text-sm">Total tasks: {tasks.length}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Debug: Projects Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(projects.slice(0, 3), null, 2)}
                    </pre>
                    <p className="mt-2 text-sm">Total projects: {projects.length}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Debug: Project Linking Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        {tasks.slice(0, 5).map((task, index) => (
                            <div key={index} className="border-l-2 border-blue-200 pl-2">
                                <div><strong>Task:</strong> {task.title}</div>
                                <div><strong>Project ID:</strong> {task.project_id || 'null'}</div>
                                <div><strong>Project Name:</strong> {task.project_name || 'null'}</div>
                                <div className="text-xs text-gray-500">
                                    Matching project: {
                                        projects.find(p => p.id === task.project_id)?.name || 'Not found'
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
