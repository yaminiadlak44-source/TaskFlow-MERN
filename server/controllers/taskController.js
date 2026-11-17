import Task from "../models/Task.js";
import { randomUUID } from "node:crypto";

// GET /api/tasks - read all tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch tasks", error: error.message });
  }
};

// POST /api/tasks - create a task
export const createTask = async (req, res) => {
  try {
    const { title, description, status, teamMembers, meetingAt } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Please enter a task title" });
    }

    const task = await Task.create({
      title,
      description,
      status,
      teamMembers,
      meetingAt: meetingAt || null,
      meetingRoom: meetingAt ? randomUUID().replace(/-/g, "") : ""
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: "Could not create task", error: error.message });
  }
};

// PUT /api/tasks/:id - update a task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { title, description, status, teamMembers, meetingAt } = req.body;
    const updates = { title, description, status, teamMembers };
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) task.set(key, value);
    });

    if (meetingAt !== undefined) {
      task.meetingAt = meetingAt || null;
      task.meetingRoom = meetingAt ? task.meetingRoom || randomUUID().replace(/-/g, "") : "";
    }

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: "Could not update task", error: error.message });
  }
};

// DELETE /api/tasks/:id - delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Could not delete task", error: error.message });
  }
};
