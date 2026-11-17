export const DEMO_STORAGE_KEY = "taskflow-demo-tasks";

export const DEMO_TEAM = [
  { id: "admin", name: "Aarav Mehta", type: "admin", role: "Workspace admin", initials: "AM" },
  { id: "manager", name: "Ananya Rao", type: "manager", role: "Project manager", initials: "AR" },
  { id: "rahul", name: "Rahul Sharma", type: "employee", role: "Frontend developer", initials: "RS" },
  { id: "priya", name: "Priya Verma", type: "employee", role: "Backend developer", initials: "PV" },
  { id: "kavya", name: "Kavya Nair", type: "employee", role: "UI/UX designer", initials: "KN" },
  { id: "aman", name: "Aman Patel", type: "employee", role: "Database engineer", initials: "AP" },
  { id: "neha", name: "Neha Singh", type: "employee", role: "QA engineer", initials: "NS" }
];

export const createDemoTasks = () => [
  {
    _id: "demo-website-launch",
    title: "Launch the company website",
    description: "Build and ship the new responsive company website.",
    status: "In Progress",
    meetingAt: null,
    meetingRoom: "",
    createdAt: new Date().toISOString(),
    teamMembers: [
      { name: "Rahul Sharma", responsibility: "Build responsive frontend pages", progress: 75 },
      { name: "Priya Verma", responsibility: "Connect backend APIs", progress: 55 },
      { name: "Kavya Nair", responsibility: "Finalize website UI/UX", progress: 90 }
    ]
  },
  {
    _id: "demo-database-api",
    title: "Set up database and API",
    description: "Create the data model and connect the core website endpoints.",
    status: "In Progress",
    meetingAt: null,
    meetingRoom: "",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    teamMembers: [
      { name: "Priya Verma", responsibility: "Implement task API endpoints", progress: 60 },
      { name: "Aman Patel", responsibility: "Design MongoDB collections", progress: 45 }
    ]
  },
  {
    _id: "demo-quality-launch",
    title: "QA and launch checklist",
    description: "Test key journeys, fix launch blockers, and prepare deployment.",
    status: "Pending",
    meetingAt: null,
    meetingRoom: "",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    teamMembers: [
      { name: "Neha Singh", responsibility: "Test signup and task workflows", progress: 10 },
      { name: "Rahul Sharma", responsibility: "Fix responsive layout issues", progress: 20 },
      { name: "Aman Patel", responsibility: "Prepare database for launch", progress: 0 }
    ]
  }
];
