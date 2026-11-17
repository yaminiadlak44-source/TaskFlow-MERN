import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2, CheckCircle2, ListTodo, X, LoaderCircle, Users, ChevronDown, ChevronUp, UserRound, UserPlus, Sparkles, ClipboardList, Clock3, TrendingUp, ArrowUpRight, CalendarDays, Video, Copy, RefreshCw, ShieldCheck, Crown, BriefcaseBusiness, Play, Database } from "lucide-react";
import { createDemoTasks, DEMO_STORAGE_KEY, DEMO_TEAM } from "./demoData.js";


// Render frontend: set VITE_API_URL to
// https://taskflow-backend-47ch.onrender.com/api/tasks
// Local development falls back to the local Express API.
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks"
).replace(/\/+$/, "");

const emptyForm = { title: "", description: "", status: "Pending", meetingAt: "", teamMembers: [] };

const toDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatMeetingDate = (value) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
}).format(new Date(value));

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [connectionState, setConnectionState] = useState("checking");
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState("live");
  const [activeDemoUserId, setActiveDemoUserId] = useState("admin");
  const apiRequestId = useRef(0);

  const fetchTasks = async () => {
    const requestId = ++apiRequestId.current;
    try {
      setError("");
      setConnectionState("checking");
      const response = await axios.get(API_URL);
      if (requestId !== apiRequestId.current) return;
      setTasks(response.data);
      setConnectionState("connected");
      setConnectionError(false);
    } catch (err) {
      if (requestId !== apiRequestId.current) return;
      setConnectionState("offline");
      setConnectionError(true);
      setError(err.response?.data?.message || "Backend reachable nahi hai. Pehle backend start karein; agar MongoDB Atlas error aaye, Network Access mein current IP allow karke Retry karein.");
    } finally {
      if (requestId === apiRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const activeDemoUser = DEMO_TEAM.find((member) => member.id === activeDemoUserId) || DEMO_TEAM[0];
  const isReadOnlyDemo = workspaceMode === "demo" && activeDemoUser.type === "employee";
  const connectionLabel = workspaceMode === "demo"
    ? "Demo workspace"
    : connectionState === "checking"
      ? "Checking connection"
      : connectionState === "connected"
        ? "Workspace connected"
        : "Connection issue";

  const visibleTasks = useMemo(() => {
    if (!isReadOnlyDemo) return tasks;
    return tasks.filter((task) => (task.teamMembers || []).some((member) => member.name === activeDemoUser.name));
  }, [tasks, activeDemoUser, isReadOnlyDemo]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((task) => {
      const matchesFilter = filter === "All" || task.status === filter;
      const searchableText = `${task.title} ${task.description} ${(task.teamMembers || []).map((member) => `${member.name} ${member.responsibility}`).join(" ")}`;
      const matchesSearch = searchableText.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [visibleTasks, filter, search]);

  const counts = {
    total: visibleTasks.length,
    pending: visibleTasks.filter((task) => task.status === "Pending").length,
    inProgress: visibleTasks.filter((task) => task.status === "In Progress").length,
    completed: visibleTasks.filter((task) => task.status === "Completed").length,
    members: visibleTasks.reduce((total, task) => total + (task.teamMembers?.length || 0), 0),
    progress: (() => {
      const members = visibleTasks.flatMap((task) => task.teamMembers || []);
      return members.length
        ? Math.round(members.reduce((total, member) => total + Number(member.progress || 0), 0) / members.length)
        : 0;
    })()
  };

  const enterDemoWorkspace = () => {
    try {
      apiRequestId.current += 1;
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      const demoTasks = saved ? JSON.parse(saved) : createDemoTasks();
      if (!Array.isArray(demoTasks)) {
        throw new Error("Saved demo data is invalid. Clear this browser's TaskFlow demo storage and try again.");
      }
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoTasks));
      setWorkspaceMode("demo");
      setActiveDemoUserId("admin");
      setTasks(demoTasks);
      setLoading(false);
      setConnectionState("demo");
      setConnectionError(false);
      setError("");
      setNotice("Demo workspace ready — changes save in this browser only.");
      setFilter("All");
      setSearch("");
      setEditingId(null);
      setForm({ ...emptyForm, teamMembers: [] });
    } catch (err) {
      setError(`Demo workspace load nahi ho paya: ${err.message}`);
    }
  };

  const switchToLiveWorkspace = async () => {
    if (!window.confirm("Live database par switch karein? Demo changes browser mein rahenge; MongoDB par copy nahi honge.")) return;
    setWorkspaceMode("live");
    setTasks([]);
    setLoading(true);
    setConnectionState("checking");
    setError("");
    setNotice("");
    setEditingId(null);
    setForm({ ...emptyForm, teamMembers: [] });
    await fetchTasks();
  };

  const selectDemoUser = (userId) => {
    setActiveDemoUserId(userId);
    setExpandedTaskId(null);
    setFilter("All");
    setSearch("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        teamMembers: form.teamMembers.map((member) => ({ ...member, progress: Number(member.progress) })),
        meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : null
      };

      if (workspaceMode === "demo") {
        const existingTask = tasks.find((task) => task._id === editingId);
        const taskId = editingId || `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const demoTask = {
          ...existingTask,
          ...payload,
          _id: taskId,
          createdAt: existingTask?.createdAt || new Date().toISOString(),
          meetingRoom: payload.meetingAt
            ? existingTask?.meetingRoom || `demo-${Math.random().toString(36).slice(2)}`
            : ""
        };
        const updatedTasks = editingId
          ? tasks.map((task) => task._id === editingId ? demoTask : task)
          : [demoTask, ...tasks];
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        setNotice(editingId ? "Demo task update ho gaya — browser mein saved." : "Demo task add ho gaya — browser mein saved.");
      } else {
        if (editingId) {
          await axios.put(`${API_URL}/${editingId}`, payload);
          setNotice("Task successfully update ho gaya!");
        } else {
          await axios.post(API_URL, payload);
          setNotice("New task add ho gaya!");
        }
      }
      setForm(emptyForm);
      setEditingId(null);
      if (workspaceMode === "live") await fetchTasks();
    } catch (err) {
      if (workspaceMode === "demo") {
        setError(`Browser mein demo task save nahi ho paya: ${err.message}`);
        setConnectionError(false);
      } else {
        const isConnectionError = !err.response;
        setConnectionState(isConnectionError ? "offline" : connectionState);
        setConnectionError(isConnectionError);
        setError(err.response?.data?.message || "Save nahi ho paya. Backend start hai aur MongoDB Atlas reachable hai, ye check karein.");
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (task) => {
    if (isReadOnlyDemo) return;
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      meetingAt: toDateTimeInputValue(task.meetingAt),
      teamMembers: (task.teamMembers || []).map((member) => ({ ...member }))
    });
    setEditingId(task._id);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setForm({ ...emptyForm, teamMembers: [] });
    setEditingId(null);
  };

  const updateTeamMember = (index, field, value) => {
    setForm((current) => ({
      ...current,
      teamMembers: current.teamMembers.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const addTeamMember = () => {
    setForm((current) => ({
      ...current,
      teamMembers: [...current.teamMembers, { name: "", responsibility: "", progress: 0 }]
    }));
  };

  const removeTeamMember = (index) => {
    setForm((current) => ({
      ...current,
      teamMembers: current.teamMembers.filter((_, memberIndex) => memberIndex !== index)
    }));
  };

  const removeTask = async (id) => {
    if (!window.confirm("Kya aap is task ko delete karna chahte hain?")) return;
    try {
      if (workspaceMode === "demo") {
        const updatedTasks = tasks.filter((task) => task._id !== id);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updatedTasks));
        setTasks(updatedTasks);
        setNotice("Demo task delete ho gaya — browser se remove hua.");
      } else {
        await axios.delete(`${API_URL}/${id}`);
        setNotice("Task delete ho gaya.");
        await fetchTasks();
      }
    } catch (err) {
      if (workspaceMode === "demo") {
        setError(`Browser se demo task delete nahi ho paya: ${err.message}`);
        setConnectionError(false);
      } else {
        const isConnectionError = !err.response;
        setConnectionState(isConnectionError ? "offline" : connectionState);
        setConnectionError(isConnectionError);
        setError(err.response?.data?.message || "Delete nahi ho paya. Backend start hai aur MongoDB Atlas reachable hai, ye check karein.");
      }
    }
  };

  const retryConnection = async () => {
    setRetrying(true);
    await fetchTasks();
    setRetrying(false);
  };

  const copyMeetingLink = async (room) => {
    try {
      await navigator.clipboard.writeText(`https://meet.jit.si/TaskFlow-${encodeURIComponent(room)}`);
      setError("");
      setNotice("Video meeting link copy ho gaya!");
    } catch {
      setError("Meeting link copy nahi ho paya. Browser clipboard permission check karein.");
    }
  };

  const focusNewTask = () => {
    document.getElementById("title")?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formattedDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><ListTodo size={21} /></span> TaskFlow<span className="brand-dot">.</span></a>
        <div className="topbar-right">
          <span className={`workspace-pill ${workspaceMode === "demo" ? "demo" : connectionState}`} role="status" title={workspaceMode === "demo" ? "Demo changes are saved in this browser only" : `API status: ${connectionState}`}><span/>{connectionLabel}</span>
          {workspaceMode === "demo" && <label className="role-switcher"><span>Preview as</span><select aria-label="Preview demo as" value={activeDemoUserId} onChange={(event) => selectDemoUser(event.target.value)} >{DEMO_TEAM.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select></label>}
          <button className="mode-switch-button" onClick={workspaceMode === "demo" ? switchToLiveWorkspace : enterDemoWorkspace}>
            {workspaceMode === "demo" ? <><Database size={15}/> Live database</> : <><Play size={14}/> Try demo</>}
          </button>
          {!isReadOnlyDemo && <button className="topbar-cta" onClick={focusNewTask}><Plus size={16}/> New task</button>}
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-date"><CalendarDays size={14}/>{formattedDate}</p>
          <p className="eyebrow">YOUR TEAM, IN SYNC</p>
          <h1>Make work <span>flow.</span></h1>
          <p className="hero-copy">{isReadOnlyDemo ? `Your assigned work, ${activeDemoUser.name.split(" ")[0]} — progress at a glance.` : "One clear view of every task, every teammate, and how far you’ve come."}</p>
          {!isReadOnlyDemo && <button className="hero-button" onClick={focusNewTask}><Sparkles size={16}/> Create a new task <ArrowUpRight size={15}/></button>}
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-art-icon"><CheckCircle2 size={37}/></div><span className="floating-chip chip-one"><span className="chip-check">✓</span> Work in sync</span><span className="floating-chip chip-two"><TrendingUp size={14}/> Progress, clearly</span></div>
      </section>

      <section className="stats-grid">
        <button className={`stat-card ${filter === "All" ? "stat-selected" : ""}`} onClick={() => setFilter("All")}><span className="stat-icon violet"><ClipboardList size={18}/></span><span className="stat-label">All tasks</span><strong>{counts.total}</strong><span className="stat-foot">Across your workspace <ArrowUpRight size={13}/></span></button>
        <button className={`stat-card ${filter === "In Progress" ? "stat-selected" : ""}`} onClick={() => setFilter("In Progress")}><span className="stat-icon blue"><Clock3 size={18}/></span><span className="stat-label">In progress</span><strong>{counts.inProgress}</strong><span className="stat-foot">Moving forward <ArrowUpRight size={13}/></span></button>
        <article className="stat-card stat-static"><span className="stat-icon amber"><Users size={18}/></span><span className="stat-label">Team assignments</span><strong>{counts.members}</strong><span className="stat-foot">People across your tasks</span></article>
        <article className="stat-card stat-static"><span className="stat-icon green"><TrendingUp size={18}/></span><span className="stat-label">Avg. progress</span><strong>{counts.progress}<small>%</small></strong><span className="stat-foot">Based on assigned work</span></article>
      </section>

      {workspaceMode === "demo" && (
        <section className="panel demo-team-panel">
          <div className="demo-panel-heading">
            <div><p className="eyebrow">MEET THE CREW</p><h2>Demo team <span className="count-pill">{DEMO_TEAM.length} people</span></h2></div>
            <span className="demo-only-tag"><ShieldCheck size={14}/> Preview only · no login</span>
          </div>
          <div className="demo-banner">
            <div><Sparkles size={17}/><span><strong>Demo workspace</strong><small>Changes are saved only in this browser and never sent to MongoDB. Role switching is a preview, not access control.</small></span></div>
            <span>1 admin · 1 manager · 5 employees</span>
          </div>
          <div className="demo-team-grid">
            {DEMO_TEAM.map((member) => {
              const RoleIcon = member.type === "admin" ? Crown : member.type === "manager" ? BriefcaseBusiness : UserRound;
              const assignedTasks = tasks.filter((task) => (task.teamMembers || []).some((teamMember) => teamMember.name === member.name)).length;
              return (
                <button className={`demo-person-card ${activeDemoUserId === member.id ? "selected" : ""} role-${member.type}`} key={member.id} onClick={() => selectDemoUser(member.id)}>
                  <span className="demo-person-avatar">{member.initials}</span>
                  <span className="demo-person-info"><strong>{member.name}</strong><small><RoleIcon size={12}/>{member.role}</small></span>
                  <span className="demo-person-tasks">{assignedTasks}<small>tasks</small></span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className={`content-grid ${isReadOnlyDemo ? "employee-view" : ""}`}>
        {!isReadOnlyDemo && <aside className="panel form-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">{editingId ? "MAKE IT JUST RIGHT" : "GET THE BALL ROLLING"}</p><h2>{editingId ? "Edit task" : "Create a task"}</h2></div>
            {editingId && <button className="icon-button" onClick={cancelEdit} aria-label="Cancel edit"><X size={18}/></button>}
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Task title <span>*</span></label>
            <input id="title" value={form.title} maxLength="100" onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Learn React hooks" required />
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} maxLength="500" onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add a few details..." rows="4" />
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Pending</option><option>In Progress</option><option>Completed</option>
            </select>
            <section className="meeting-form-section">
              <div className="meeting-form-heading"><span className="meeting-form-icon"><Video size={16}/></span><div><strong>Schedule a video meeting</strong><p>Meeting ka date aur time set karein.</p></div></div>
              <label htmlFor="meeting-at">Meeting date &amp; time</label>
              <input id="meeting-at" type="datetime-local" value={form.meetingAt} onChange={(e) => setForm({ ...form, meetingAt: e.target.value })} />
              <p className="meeting-form-note">Free Jitsi video room automatically create hoga. Link wale log join kar sakte hain.</p>
            </section>
            <div className="team-form-heading">
              <div><label>Team members</label><p>Har employee ka kaam aur progress add karein.</p></div>
              <button className="secondary-button" type="button" onClick={addTeamMember}><UserPlus size={15}/> Add</button>
            </div>
            {form.teamMembers.map((member, index) => (
              <div className="member-form-card" key={`member-${index}`}>
                <div className="member-form-title">
                  <span>Employee {index + 1}</span>
                  <button className="icon-button delete" type="button" onClick={() => removeTeamMember(index)} aria-label={`Remove employee ${index + 1}`}><X size={15}/></button>
                </div>
                <label htmlFor={`employee-name-${index}`}>Employee name</label>
                <input id={`employee-name-${index}`} value={member.name} maxLength="80" onChange={(e) => updateTeamMember(index, "name", e.target.value)} placeholder="e.g. Rahul Sharma" required />
                <label htmlFor={`employee-work-${index}`}>Assigned work</label>
                <input id={`employee-work-${index}`} value={member.responsibility} maxLength="120" onChange={(e) => updateTeamMember(index, "responsibility", e.target.value)} placeholder="e.g. Frontend development" required />
                <label htmlFor={`employee-progress-${index}`}>Progress (%)</label>
                <input id={`employee-progress-${index}`} type="number" value={member.progress} min="0" max="100" onChange={(e) => updateTeamMember(index, "progress", e.target.value)} required />
              </div>
            ))}
            <button className="primary-button submit-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={18}/> : <Plus size={18}/>}
              {saving ? "Saving..." : editingId ? "Save changes" : "Add task"}
            </button>
          </form>
          <p className="form-tip"><Sparkles size={13}/> A clear owner and next step make all the difference.</p>
        </aside>}

        <section className="panel tasks-panel">
          <div className="tasks-heading">
            <div><p className="eyebrow">THE BIG PICTURE</p><h2>Team tasks <span className="count-pill">{filteredTasks.length}</span></h2></div>
            <div className="search-box"><Search size={17}/><input aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." /></div>
          </div>

          <div className="filter-row">
            {["All", "In Progress", "Pending", "Completed"].map((item) => (
              <button key={item} className={`filter-button ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>{item}<span>{item === "All" ? counts.total : item === "In Progress" ? counts.inProgress : item === "Pending" ? counts.pending : counts.completed}</span></button>
            ))}
          </div>

          {notice && <div className="notice">{notice}</div>}
          {error && <div className="error-message" role="alert"><span>{error}</span>{connectionError && <button className="retry-button" type="button" onClick={retryConnection} disabled={retrying}>{retrying ? <LoaderCircle className="spin" size={14}/> : <RefreshCw size={14}/>} Retry</button>}</div>}

          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={26}/><p>Loading tasks...</p></div> :
            filteredTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><ListTodo size={26}/></div><h3>No tasks found</h3><p>{isReadOnlyDemo ? "No tasks are assigned to this employee yet." : "Add your first task using the form."}</p></div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => {
                  const teamMembers = task.teamMembers || [];
                  const overallProgress = teamMembers.length
                    ? Math.round(teamMembers.reduce((total, member) => total + Number(member.progress || 0), 0) / teamMembers.length)
                    : 0;
                  const isExpanded = expandedTaskId === task._id;
                  return (
                    <article className={`task-item ${isExpanded ? "expanded" : ""} ${task.status.toLowerCase().replace(" ", "-")}`} key={task._id}>
                      <div className="task-row">
                        <button className="task-summary" type="button" aria-expanded={isExpanded} onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}>
                          <div className="task-main">
                            <div className={`task-dot ${task.status.toLowerCase().replace(" ", "-")}`}></div>
                            <div className="task-copy">
                              <div className="task-title-line"><h3>{task.title}</h3><span className={`status-badge ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span></div>
                              {task.description && <p>{task.description}</p>}
                              <div className="task-meta"><span className="team-count"><Users size={13}/>{teamMembers.length} {teamMembers.length === 1 ? "employee" : "employees"}</span><span className="meta-divider"/> <span>{teamMembers.length ? "Team assigned" : "No team yet"}</span></div>
                            </div>
                          </div>
                          <span className="expand-icon">{isExpanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</span>
                        </button>
                        {!isReadOnlyDemo && <div className="task-actions">
                          <button className="icon-button edit" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`} title="Edit"><Pencil size={17}/></button>
                          <button className="icon-button delete" onClick={() => removeTask(task._id)} aria-label={`Delete ${task.title}`} title="Delete"><Trash2 size={17}/></button>
                        </div>}
                      </div>
                      {isExpanded && (
                        <div className="team-details">
                          <div className="overall-progress">
                            <div className="progress-heading"><strong>Overall progress</strong><strong>{overallProgress}%</strong></div>
                            <div className="progress-track"><span style={{ width: `${overallProgress}%` }} /></div>
                            <p>{teamMembers.length ? "Assigned employees ke progress ka average" : "Progress dekhne ke liye pehle employees assign karein."}</p>
                          </div>
                          {teamMembers.length > 0 ? (
                            <div className="member-list">
                              {teamMembers.map((member, index) => (
                                <div className="member-row" key={`${member._id || member.name}-${index}`}>
                                  <div className="member-avatar"><UserRound size={17}/></div>
                                  <div className="member-info"><strong>{member.name}</strong><span>{member.responsibility}</span></div>
                                  <div className="member-progress"><strong>{Number(member.progress || 0)}%</strong><div className="progress-track"><span style={{ width: `${Number(member.progress || 0)}%` }} /></div></div>
                                </div>
                              ))}
                            </div>
                          ) : isReadOnlyDemo ? (
                            <p className="no-team-note">No employee assignments on this task.</p>
                          ) : (
                            <button className="secondary-button assign-button" type="button" onClick={() => startEdit(task)}><UserPlus size={15}/> Employees assign karein</button>
                          )}
                        </div>
                      )}
                      {teamMembers.length > 0 && !isExpanded && <div className="task-mini-progress"><div className="mini-avatars">{teamMembers.slice(0, 3).map((member, index) => <span className={`mini-avatar avatar-${index % 4}`} title={member.name} key={`${member._id || member.name}-${index}`}>{member.name?.trim().charAt(0).toUpperCase() || <UserRound size={12}/>}</span>)}{teamMembers.length > 3 && <span className="mini-avatar more-avatars">+{teamMembers.length - 3}</span>}</div><div className="mini-progress-track"><span style={{ width: `${overallProgress}%` }}/></div><strong>{overallProgress}%</strong></div>}
                      {task.meetingAt && task.meetingRoom && (
                        <div className="meeting-bar">
                          <span className="meeting-clock"><CalendarDays size={15}/></span>
                          <div className="meeting-time"><span>Video meeting</span><strong>{formatMeetingDate(task.meetingAt)}</strong></div>
                          <div className="meeting-actions">
                            <button className="copy-meeting-button" type="button" onClick={() => copyMeetingLink(task.meetingRoom)} aria-label="Copy meeting link" title="Copy meeting link"><Copy size={14}/></button>
                            <a className="join-meeting-button" href={`https://meet.jit.si/TaskFlow-${encodeURIComponent(task.meetingRoom)}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Video size={14}/> Join call</a>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          }
        </section>
      </section>
      <footer>Built with React, Express & MongoDB <span>•</span> Beginner MERN CRUD Project</footer>
    </main>
  );
}

export default App;
