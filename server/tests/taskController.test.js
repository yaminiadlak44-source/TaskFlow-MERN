import assert from "node:assert/strict";
import test from "node:test";
import Task from "../models/Task.js";
import { createTask, updateTask } from "../controllers/taskController.js";

const makeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const withMock = async (target, key, replacement, run) => {
  const original = target[key];
  target[key] = replacement;
  try {
    await run();
  } finally {
    target[key] = original;
  }
};

test("createTask assigns a unique room only when a meeting is scheduled", async () => {
  await withMock(Task, "create", async (data) => data, async () => {
    const scheduledResponse = makeResponse();
    await createTask({
      body: { title: "Sprint planning", meetingAt: "2026-11-18T05:30:00.000Z" }
    }, scheduledResponse);

    assert.equal(scheduledResponse.statusCode, 201);
    assert.equal(scheduledResponse.body.meetingAt, "2026-11-18T05:30:00.000Z");
    assert.match(scheduledResponse.body.meetingRoom, /^[a-f0-9]{32}$/);

    const unscheduledResponse = makeResponse();
    await createTask({ body: { title: "Design homepage" } }, unscheduledResponse);

    assert.equal(unscheduledResponse.statusCode, 201);
    assert.equal(unscheduledResponse.body.meetingAt, null);
    assert.equal(unscheduledResponse.body.meetingRoom, "");
  });
});

test("updateTask preserves a scheduled room, creates one when needed, and clears it when unscheduled", async () => {
  const task = {
    meetingAt: new Date("2026-11-18T05:30:00.000Z"),
    meetingRoom: "existing-room",
    set(key, value) {
      this[key] = value;
    },
    async save() {}
  };

  await withMock(Task, "findById", async () => task, async () => {
    const rescheduleResponse = makeResponse();
    await updateTask({
      params: { id: "task-id" },
      body: { meetingAt: "2026-11-19T05:30:00.000Z" }
    }, rescheduleResponse);

    assert.equal(rescheduleResponse.statusCode, 200);
    assert.equal(rescheduleResponse.body.meetingRoom, "existing-room");
    assert.equal(new Date(rescheduleResponse.body.meetingAt).toISOString(), "2026-11-19T05:30:00.000Z");

    task.meetingRoom = "";
    const scheduleResponse = makeResponse();
    await updateTask({
      params: { id: "task-id" },
      body: { meetingAt: "2026-11-20T05:30:00.000Z" }
    }, scheduleResponse);

    assert.equal(scheduleResponse.statusCode, 200);
    assert.match(scheduleResponse.body.meetingRoom, /^[a-f0-9]{32}$/);

    const clearResponse = makeResponse();
    await updateTask({
      params: { id: "task-id" },
      body: { meetingAt: null }
    }, clearResponse);

    assert.equal(clearResponse.statusCode, 200);
    assert.equal(clearResponse.body.meetingAt, null);
    assert.equal(clearResponse.body.meetingRoom, "");
  });
});
